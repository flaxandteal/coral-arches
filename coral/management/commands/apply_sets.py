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

from urllib.parse import parse_qs
import logging
import readline
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group as DjangoGroup
from arches.app.utils.permission_backend import assign_perm
from arches.app.models.system_settings import settings
from arches.app.models.resource import Resource
from arches_orm.models import Set, LogicalSet
from coral.permissions.casbin import CasbinPermissionFramework
from arches.app.search.components.base import SearchFilterFactory
from arches.app.views.search import build_search
from arches.app.search.elasticsearch_dsl_builder import Bool, Match, Query, Nested, Terms, MaxAgg, Aggregation, UpdateByQuery
from arches.app.search.search_engine_factory import SearchEngineFactory
from arches.app.search.mappings import RESOURCES_INDEX

from coral import settings

logging.basicConfig()

class Command(BaseCommand):
    """Recalculate ES resource->set mapping.

    """

    def add_arguments(self, parser):
        ...

    def handle(self, *args, **options):
        table = self.apply_sets()

    def _apply_set(self, se, set_id, set_query):
        for add_not_remove in (True, False):
            dsl = Query(se=se)
            bool_query = Bool()
            if add_not_remove:
                bool_query.must_not(set_query())
                bool_query.must(Nested(path="sets", query=Terms(field="sets.id", terms=[str(set_id)])))
                sets = [str(set_id)]
                source = """
                if (ctx._source.sets != null) {
                    for (int i=ctx._source.sets.length-1; i>=0; i--) {
                        if (params.logicalSets.contains(ctx._source.sets[i].id)) {
                            ctx._source.sets.remove(i);
                        }
                    }
                }
                """
            else:
                bool_query.must(set_query())
                bool_query.must_not(Nested(path="sets", query=Terms(field="sets.id", terms=[str(set_id)])))
                source = "ctx._source.sets.addAll(params.logicalSets)"
                sets = [{"id": str(set_id)}]
            dsl.add_query(bool_query)
            print(source, sets)
            update_by_query = UpdateByQuery(se=se, query=dsl, script={
                "lang": "painless",
                "source": source,
                "params": {
                    "logicalSets": sets
                }
            })
            results = update_by_query.run(index=RESOURCES_INDEX)
            print(results)

    def apply_sets(self, resourceinstanceid=None):
        """Apply set mappings to resources.

        Run update-by-queries to mark/unmark sets against resources in Elasticsearch.
        """

        from arches.app.search.search_engine_factory import SearchEngineInstance as _se

        logical_sets = LogicalSet.all()
        for logical_set in logical_sets:
            if logical_set.member_definition:
                # user=True is shorthand for "do not restrict by user"
                parameters = parse_qs(logical_set.member_definition)
                for key, value in parameters.items():
                    if len(value) != 1:
                        raise RuntimeError("Each filter type must appear exactly once")
                    parameters[key] = value[0]
                def _logical_set_query():
                    _, _, inner_dsl = build_search(
                        for_export=False,
                        pages=False,
                        total=None,
                        resourceinstanceid=None,
                        load_tiles=False,
                        user=True,
                        provisional_filter=[],
                        parameters=parameters,
                        permitted_nodegroups=True # This should be ignored as user==True
                    )
                    return inner_dsl.dsl["query"]
                self._apply_set(_se, f"l:{logical_set.id}", _logical_set_query)

        sets = Set.all()
        for regular_set in sets:
            if regular_set.members:
                # user=True is shorthand for "do not restrict by user"
                def _regular_set_query():
                    query = Query(se=_se)
                    bool_query = Bool()
                    bool_query.must(Terms(field="_id", terms=[str(member.id) for member in regular_set.members]))
                    query.add_query(bool_query)
                    return query.dsl["query"]
                self._apply_set(_se, f"r:{regular_set.id}", _regular_set_query)

        framework = CasbinPermissionFramework()
        framework.recalculate_table()
