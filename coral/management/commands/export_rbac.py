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

import json
import time
import itertools
import logging
import readline
import psycopg2
from datetime import datetime
from uuid import UUID
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group as DjangoGroup
from pathlib import Path
from arches.app.models.models import GraphModel, EditLog, ResourceInstance

from arches.app.search.elasticsearch_dsl_builder import Query
from arches.app.utils.permission_backend import get_sets_for_user
from arches.app.search.elasticsearch_dsl_builder import Bool, Nested, Terms
from arches.app.search.mappings import RESOURCES_INDEX

from arches_orm import arches_django
from arches_orm.models import Group, Person, PublicationAction
from arches_orm.adapter import context, get_adapter, ADAPTER_MANAGER
from arches_orm.wkrm import get_well_known_resource_model_by_class_name
from coral import settings
ADAPTER_MANAGER.set_default_adapter("arches-django")
from arches_orm import static

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


    @context(None, "static")
    @context(None, "arches-django")
    def handle(self, *args, **options):
        from arches.app.search.search_engine_factory import SearchEngineInstance as _se

        PublicationActionLifecycleState = PublicationAction().lifecycle_status.__collection__

        # TODO: avoid loading all of them
        publication_actions = PublicationAction.all()
        upcoming = [pub for pub in publication_actions if pub.lifecycle_status == PublicationActionLifecycleState.Upcoming]
        if len(upcoming) > 1:
            raise RuntimeError("Must not have more than one upcoming publication action")
        if len(upcoming) == 0:
            pub = PublicationAction()
            pub.lifecycle_status = PublicationActionLifecycleState.Upcoming
            pub.save()
        else:
            pub = upcoming[0]

        epoch = datetime(1970, 1, 1, 0, 0, 0)
        publication_actions = sorted([(pa.deadline, pa) for pa in PublicationAction.all()], key=lambda pa: pa[0] or epoch)
        if publication_actions:
            pub.parent = publication_actions[-1][1]
            pub.save()
        else:
            pub.parent = PublicationAction()
        deadline = pub.parent.deadline or epoch

        get_adapter("static").config.update({
            "concept_paths": [
                Path(__file__).parent.parent.parent / "pkg" / "reference_data" / "concepts",
                Path(__file__).parent.parent.parent / "pkg" / "reference_data" / "collections"
            ],
            "model_paths": [
                Path(__file__).parent.parent.parent / "pkg" / "graphs" / "resource_models"
            ],
            "resource_paths": [
                Path(__file__).parent.parent.parent / "uploadedfiles" / "public-all.json"
            ],
            "arches_url": "http://arches:8000/"
        })
        static_adapter = get_adapter("static")
        static_adapter.get_wkrm_definitions()
        from arches_orm.static.datatypes.resource_instances import STATIC_STORE

        pblc = Group.find("452ab9f2-ed4c-44dc-9ad3-ff9085734bc8")

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
        new_resource_ids = []

        existing_resources = {}
        STATIC_STORE.load_all()
        for id, resource in STATIC_STORE.items():
            existing_resources[id] = resource

        for n in itertools.count():
            results = query.search(index=RESOURCES_INDEX, start=cursor)
            new_total = results["hits"]["total"]["value"]

            if new_total != total and total != 0:
                raise RuntimeError("Total changed during search!")
            total = new_total

            if total == 0:
                break

            hits = len(results["hits"]["hits"])
            if hits < 1:
                raise RuntimeError("Check this - the number of hits is zero, but the total is larger!")

            cursor += hits
            for result in results["hits"]["hits"]:
                resource_id = result.get("_id")

                if resource_id in existing_resources:
                    continue

                source = result.get("_source", {})
                graph_name = graphs[source.get("graph_id")]
                display_names = sorted(source.get("displayname", []), key=lambda name: 0 if name.get("language", "en") else 1)
                display_name = display_names[0].get("value") if display_names else None
                result_table.append((str(graph_name), str(display_name), str(resource_id), n))
                new_resource_ids.append(resource_id)

            if cursor >= total:
                break

        print("The following resources will be EXPOSED EXTERNALLY", results["hits"]["total"])
        result_table = sorted(result_table)
        print(tabulate.tabulate(result_table, headers=["Graph", "Name", "ID", "Query#"]))

        wkris = get_adapter("arches-django").load_from_ids(new_resource_ids)
        wkris = list(wkris)
        for wkri in wkris:
            wkri._.to_resource(_no_save=True, _do_index=False)

        updated_ids = ResourceInstance.objects.raw(
            "SELECT DISTINCT edit_log.resourceinstanceid FROM edit_log where edit_log.resourceinstanceid = ANY(%s) and edit_log.timestamp > %s",
            [
                [str(pk) for pk in existing_resources],
                str(deadline).replace('+00:00', 'Z')
            ]
        )
        updated = get_adapter("arches-django").load_from_ids(updated_ids, lazy=True)
        updated = list(updated)
        print("UPDATED")
        for wkri in updated:
            print(wkri)

        print("TO DELETE")
        for existing_id in existing_resources:
            if existing_id not in new_resource_ids:
                print(existing_id)

        pub.action_timestamp = datetime.now()
        static_resources = [static_adapter.from_pseudo_node_wrapper(wkri) for wkri in wkris + updated]
        print(static_resources)

        output_wkris = {
            "business_data": {
                "resource_instances": [
                    json.loads(static_resource._.to_resource(_do_index=False, _no_save=True).model_dump_json()) for static_resource in static_resources
                ]
            }
        }
        pub.save()
        with (Path(__file__).parent.parent.parent / "uploadedfiles" / "public-all-export.json").open("w") as f:
            json.dump(output_wkris, f, indent=2)
