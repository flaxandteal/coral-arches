"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

import time
import itertools
import logging
import readline
import psycopg2
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group as DjangoGroup
from arches.app.models.models import GraphModel

from arches.app.search.elasticsearch_dsl_builder import Query
from arches.app.utils.permission_backend import get_sets_for_user
from arches.app.search.elasticsearch_dsl_builder import Bool, Nested, Terms
from arches.app.search.mappings import RESOURCES_INDEX

from arches_orm.models import Group, Person
from arches_orm.adapter import context_free
from coral import settings

logging.basicConfig()

COOLOFF_S = 10

class Command(BaseCommand):
    """Export the user permission structure.

    """

    # print_statistics = False

    # def add_arguments(self, parser):
    #     parser.add_argument(
    #         "-j",
    #         "--as-json",
    #         action="store_true",
    #         dest="as_json",
    #         help="Export as JSON rather than human-readable",
    #     )


    @context_free
    def handle(self, *args, **options):
        from arches.app.search.search_engine_factory import SearchEngineInstance as _se

        pblc = Group.find("452ab9f2-ed4c-44dc-9ad3-ff9085734bc8")
        print(pblc)

        def _print_group(group, depth = 0):
            for member in group.members:
                if isinstance(member, Group):
                    print("IGNORING SUBGROUPS OF PUBLIC GROUP FOR SAFETY")
                elif isinstance(member, Person):
                    print(" " * depth, "-", str(member))
                else:
                    print(" " * depth, "?", str(member))

        _print_group(pblc)
        query = Query(se=_se)

        sets = get_sets_for_user(pblc, "view_resourceinstance")
        if not sets: # Only None if no filtering should be done, but may be an empty set.
            raise RuntimeError("The public group has no sets - stopping as this is not a useful constraint")

        bool_query = Bool()
        bool_query.must(Nested(path="sets", query=Terms(field="sets.id", terms=list(sets))))
        query.add_query(bool_query)

        import tabulate
        result_table = [
        ]

        graphs = {str(k): v for k, v in GraphModel.objects.values_list("graphid", "name")}

        cursor = 0
        total = 0
        for n in itertools.count():
            results = query.search(index=RESOURCES_INDEX, start=cursor)
            new_total = results["hits"]["total"]["value"]

            if new_total != total and total != 0:
                raise RuntimeError("Total changed during search!")
            total = new_total

            hits = len(results["hits"]["hits"])
            if hits < 1:
                raise RuntimeError("Check this - the number of hits is zero, but the total is larger!")

            cursor += hits
            for result in results["hits"]["hits"]:
                resource_id = result.get("_id")
                source = result.get("_source", {})
                graph_name = graphs[source.get("graph_id")]
                display_names = sorted(source.get("displayname", []), key=lambda name: 0 if name.get("language", "en") else 1)
                display_name = display_names[0].get("value") if display_names else None
                result_table.append((str(graph_name), str(display_name), str(resource_id), n))

            if cursor >= total:
                break

        print("The following %d resources will be EXPOSED EXTERNALLY", results["hits"]["total"])
        result_table = sorted(result_table)
        print(tabulate.tabulate(result_table, headers=["Graph", "Name", "ID", "Query#"]))
