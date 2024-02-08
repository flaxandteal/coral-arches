from arches.app.search.components.base import SearchFilterFactory
from urllib.parse import parse_qs
from arches.app.views.search import build_search
from arches.app.search.elasticsearch_dsl_builder import Bool, Match, Query, Ids, Nested, Terms, MaxAgg, Aggregation, UpdateByQuery
from arches.app.search.search_engine_factory import SearchEngineFactory
from arches.app.search.mappings import RESOURCES_INDEX
from arches.app.models.resource import Resource
from arches_orm.models import Set, LogicalSet
import time

class SetApplicator:
    def __init__(self, print_statistics, wait_for_completion):
        self.print_statistics = print_statistics
        self.wait = wait_for_completion

    def _apply_set(self, se, set_id, set_query, resourceinstanceid=None):
        results = []
        for add_not_remove in (True, False):
            dsl = Query(se=se)
            bool_query = Bool()
            if resourceinstanceid:
                bool_query.must(Ids(ids=[str(resourceinstanceid)]))
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
            update_by_query = UpdateByQuery(se=se, query=dsl, script={
                "lang": "painless",
                "source": source,
                "params": {
                    "logicalSets": sets
                }
            })
            results.append(update_by_query.run(index=RESOURCES_INDEX, wait_for_completion=False))
        return results

    def apply_sets(self, resourceinstanceid=None):
        """Apply set mappings to resources.

        Run update-by-queries to mark/unmark sets against resources in Elasticsearch.
        """

        from arches.app.search.search_engine_factory import SearchEngineInstance as _se

        logical_sets = LogicalSet.all()
        results = []
        print("Print statistics?", self.print_statistics)
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
                if self.print_statistics:
                    dsl = Query(se=_se)
                    dsl.add_query(_logical_set_query())
                    count = dsl.count(index=RESOURCES_INDEX)
                    print("Logical Set:", logical_set.id)
                    print("Definition:", logical_set.member_definition)
                    print("Count:", count)
                results = self._apply_set(_se, f"l:{logical_set.id}", _logical_set_query, resourceinstanceid=resourceinstanceid)
                if self.wait:
                    self.wait_for_completion(_se, results)
                if self.print_statistics:
                    dsl = Query(se=_se)
                    bool_query = Bool()
                    bool_query.must(Nested(path="sets", query=Terms(field="sets.id", terms=[f"l:{logical_set.id}"])))
                    if resourceinstanceid:
                        bool_query.must(Ids(ids=[str(resourceinstanceid)]))
                    dsl.add_query(bool_query)
                    count = dsl.count(index=RESOURCES_INDEX)
                    print("Applies to by search:", count)

        sets = Set.all()
        for regular_set in sets:
            if regular_set.members:
                # user=True is shorthand for "do not restrict by user"
                members = [str(member.id) for member in regular_set.members]
                if not resourceinstanceid or str(resourceinstanceid) in members:
                    def _regular_set_query():
                        query = Query(se=_se)
                        bool_query = Bool()
                        bool_query.must(Terms(field="_id", terms=members))
                        query.add_query(bool_query)
                        return query.dsl["query"]
                    results = self._apply_set(_se, f"r:{regular_set.id}", _regular_set_query, resourceinstanceid=resourceinstanceid)
                    if self.wait:
                        self.wait_for_completion(_se, results)

    def wait_for_completion(self, _se, results):
        tasks_client = _se.make_tasks_client()
        while results:
            result = results[0]
            task_id = result["task"]
            status = tasks_client.get(task_id=task_id)
            if status["completed"]:
                results.remove(result)
            else:
                print(task_id, "not yet completed")
            time.sleep(0.1)
