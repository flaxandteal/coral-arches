import hashlib
import time
import uuid
from urllib.parse import parse_qs, urlencode
from arches.app.search.components.base import SearchFilterFactory
from arches.app.search.elasticsearch_dsl_builder import Bool, Match, Query, Ids, Nested, Terms, MaxAgg, Aggregation
from arches.app.search.search_engine_factory import SearchEngineFactory
from arches.app.search.mappings import RESOURCES_INDEX
from arches.app.models.models import Plugin
from arches.app.models.resource import Resource
from querysets_shim.models import Set, LogicalSet, ArchesPlugin
from querysets_shim.adapter import context_free


def _build_search_from_parameters(parameters):
    """Build a search DSL from query parameters.

    Replaces the old build_search() that was removed in Arches 8.x.
    Uses SearchFilterFactory and the search filter components to construct
    the DSL query, without requiring a real Django request.
    """
    from django.test import RequestFactory

    query_string = urlencode(parameters)
    from django.contrib.auth.models import User
    from arches.app.utils.permission_backend import get_nodegroups_by_perm

    factory = RequestFactory()
    fake_request = factory.get(f"/search/resources?{query_string}")
    # Use a superuser-equivalent so permission checks during DSL building succeed.
    admin = User.objects.filter(is_superuser=True).first()
    fake_request.user = admin if admin else User()

    se = SearchEngineFactory().create()
    search_filter_factory = SearchFilterFactory(fake_request)
    search_results_object = {"query": Query(se)}

    try:
        permitted_nodegroups = list(
            get_nodegroups_by_perm(fake_request.user, "models.read_nodegroup")
        )
    except Exception:
        permitted_nodegroups = []

    for filter_type, querystring in list(fake_request.GET.items()) + [("search-results", "")]:
        search_filter = search_filter_factory.get_filter(filter_type)
        if search_filter:
            search_filter.append_dsl(
                search_results_object,
                permitted_nodegroups=permitted_nodegroups,
                include_provisional=None,
            )

    return search_results_object["query"]

def _consistent_hash(string: str):
    hsh = hashlib.sha256(string.encode("utf-8"))
    return uuid.UUID(hsh.hexdigest()[::2])

class SetApplicator:
    def __init__(self, print_statistics, wait_for_completion, synchronous=False):
        self.print_statistics = print_statistics
        self.wait = wait_for_completion and (not synchronous)
        if synchronous:
            print("""
                WARNING: synchronous currently 409s due to a
                limitation of Elasticsearch:
                  https://stackoverflow.com/questions/56602137/wait-for-completion-of-updatebyquery-with-the-elasticsearch-dsl
                This may still be useful for debugging purposes.
                TODO: use the lower-level refresh API for passing retry_on_conflict.
            """)
        self.synchronous = synchronous

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
                source = """
                if (ctx._source.sets == null) {
                    ctx._source.sets = [];
                }
                ctx._source.sets.addAll(params.logicalSets);
                """
                sets = [{"id": str(set_id)}]
            dsl.add_query(bool_query)
            body = {
                "query": dsl.dsl["query"],
                "script": {
                    "lang": "painless",
                    "source": source,
                    "params": {
                        "logicalSets": sets
                    }
                }
            }
            results.append(se.es.update_by_query(index=se._add_prefix(RESOURCES_INDEX), body=body, wait_for_completion=self.synchronous))
        return results

    @context_free
    def apply_sets(self, resourceinstanceid=None):
        """Apply set mappings to resources.

        Run update-by-queries to mark/unmark sets against resources in Elasticsearch.
        """

        print("Confirming all plugins present")
        plugins = {str(plugin.pk): plugin for plugin in Plugin.objects.all()}
        plugins.update({str(plugin.slug): plugin for plugin in plugins.values()})
        arches_plugins = ArchesPlugin.all()
        for ap in arches_plugins:
            if ap.plugin_identifier and ap.id != _consistent_hash(ap.plugin_identifier):
                print("Found a plugin with an incorrect identifier - removing", ap.plugin_identifier, ap.id)
                ap.delete()
        arches_plugins = ArchesPlugin.all()
        known_plugins = set(str(plugins[str(plugin.plugin_identifier)].pk) for plugin in arches_plugins)
        known_plugins |= set(str(plugins[str(plugin.plugin_identifier)].slug) for plugin in arches_plugins)
        print(known_plugins)

        unknown_plugins = set(str(plugin.pk) for plugin in Plugin.objects.all()) - known_plugins
        print(unknown_plugins, "UP")
        for plugin in unknown_plugins:
            plugin = Plugin.objects.get(pk=plugin)
            ap = ArchesPlugin()
            ap.name = str(plugin.name) or "(unknown)"
            ap.plugin_identifier = str(plugin.slug or plugin.pk)
            ap.id = _consistent_hash(ap.plugin_identifier)
            ap.save()
            try:
                ap._.index()
            except AttributeError:
                # querysets_shim's _WrapperMeta doesn't expose .index() yet.
                # The save() call should trigger Arches's normal indexing path.
                pass

        print("Done with plugins")

        from arches.app.search.search_engine_factory import SearchEngineInstance as _se

        logical_sets = LogicalSet.all()
        results = []
        print("Print statistics?", self.print_statistics)
        for logical_set in logical_sets:
            if logical_set.member_definition:
                # user=True is shorthand for "do not restrict by user"
                parameters = parse_qs(str(logical_set.member_definition))
                for key, value in parameters.items():
                    if len(value) != 1:
                        raise RuntimeError("Each filter type must appear exactly once")
                    parameters[key] = value[0]
                def _logical_set_query():
                    inner_dsl = _build_search_from_parameters(parameters)
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
        while results:
            result = results[0]
            task_id = result["task"]
            status = _se.es.tasks.get(task_id=task_id)
            if status["completed"]:
                results.remove(result)
            else:
                print(task_id, "not yet completed")
            time.sleep(0.1)
