"""Guards QueryBuilder tile filters against the per-resource scan they replaced.

`Person.where(user_account=N)` used to hydrate every Person in the graph (~3s each,
83,975 of them) to compare one attribute. Filters now resolve in SQL, and an
unsupported one must raise rather than fall back to that scan.

Needs Django but no database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell < tests/coral_tests/test_querysets_shim_filters.py`
"""

from django.core.exceptions import FieldError

import arches_querysets.models as aq_models
from querysets_shim.wrapper import QueryBuilder, ResourceModel, _SemanticNode


class _StubNode:
    def __init__(self, alias):
        self.alias = alias


class _StubMeta:
    def __init__(self, aliases):
        self._aliases = aliases

    def _node_objects_by_alias(self):
        return {alias: _StubNode(alias) for alias in self._aliases}


def _stub_model(aliases=('user_account',), slug='person'):
    class StubModel:
        _ = _StubMeta(aliases)
        find_calls = []

        @classmethod
        def _get_graph_slug(cls):
            return slug

        @classmethod
        def find(cls, rid):
            cls.find_calls.append(rid)
            return None

    return StubModel


class _StubQuerySet:
    def __init__(self, recorder):
        self.recorder = recorder

    def filter(self, **kwargs):
        self.recorder['filter'] = kwargs
        return self

    def values_list(self, field, flat=False):
        self.recorder['values_list'] = (field, flat)
        return ['id-1', 'id-2']


def _patch_get_tiles(recorder):
    """Swap ResourceTileTree.get_tiles for a recorder; returns the original."""
    original = aq_models.ResourceTileTree.get_tiles

    def fake_get_tiles(slug, **kwargs):
        recorder['slug'] = slug
        recorder['nodes'] = [node.alias for node in kwargs.get('nodes', [])]
        return _StubQuerySet(recorder)

    aq_models.ResourceTileTree.get_tiles = staticmethod(fake_get_tiles)
    return original


def test_filters_go_to_sql_and_never_hydrate():
    recorder = {}
    original = _patch_get_tiles(recorder)
    try:
        model = _stub_model()
        builder = QueryBuilder(model)
        ids = builder._tile_filtered_ids({'user_account': 3})
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert ids == ['id-1', 'id-2'], ids
    assert recorder['filter'] == {'user_account': 3}, recorder['filter']
    assert recorder['values_list'] == ('pk', True), recorder['values_list']
    # The whole point: not one resource was loaded to answer the filter.
    assert model.find_calls == [], model.find_calls


def test_only_filtered_nodes_are_annotated():
    """Annotating a whole graph costs seconds, so `nodes` must be narrowed."""
    recorder = {}
    original = _patch_get_tiles(recorder)
    try:
        model = _stub_model(aliases=('user_account', 'name', 'description'))
        QueryBuilder(model)._tile_filtered_ids({'user_account': 3})
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert recorder['nodes'] == ['user_account'], recorder['nodes']


def test_lookup_suffix_resolves_to_its_node():
    recorder = {}
    original = _patch_get_tiles(recorder)
    try:
        model = _stub_model(aliases=('name',))
        QueryBuilder(model)._tile_filtered_ids({'name__contains': 'Access'})
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert recorder['nodes'] == ['name'], recorder['nodes']


def test_unknown_alias_raises_rather_than_scanning():
    model = _stub_model(aliases=('user_account',))
    try:
        QueryBuilder(model)._tile_filtered_ids({'nope': 1})
    except FieldError as exc:
        assert 'nope' in str(exc), exc
    else:
        raise AssertionError('unknown alias silently accepted')
    assert model.find_calls == [], model.find_calls


def test_missing_slug_raises_rather_than_scanning():
    model = _stub_model(slug=None)
    try:
        QueryBuilder(model)._tile_filtered_ids({'user_account': 3})
    except FieldError as exc:
        assert 'slug' in str(exc), exc
    else:
        raise AssertionError('missing slug silently accepted')
    assert model.find_calls == [], model.find_calls


class _StubRow:
    def __init__(self, pk):
        self.pk = pk


def _stub_resource_model(rows, calls):
    """A ResourceModel whose get_tiles is recorded and whose hydration is a no-op."""
    class StubResource(ResourceModel):
        _graphid = 'graph-1'
        _wkrm = {}

        @classmethod
        def _get_graph_slug(cls):
            return 'stub_slug'

        @classmethod
        def _hydrate(cls, rid, rtt):
            return f'instance:{rid}'

    def fake_get_tiles(slug, **kwargs):
        calls.append(kwargs.get('resource_ids'))
        wanted = set(kwargs.get('resource_ids') or [])
        return [_StubRow(pk) for pk in rows if pk in wanted]

    aq_models.ResourceTileTree.get_tiles = staticmethod(fake_get_tiles)
    return StubResource


def test_find_many_makes_one_query_for_the_whole_page():
    """The bug was one get_tiles per row; building that queryset costs seconds."""
    calls = []
    original = aq_models.ResourceTileTree.get_tiles
    try:
        model = _stub_resource_model(['a', 'b', 'c'], calls)
        got = model.find_many(['a', 'b', 'c'])
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert len(calls) == 1, calls
    assert got == ['instance:a', 'instance:b', 'instance:c'], got


def test_find_many_returns_ids_in_argument_order():
    """Callers page and sort in SQL, so argument order is the display order."""
    calls = []
    original = aq_models.ResourceTileTree.get_tiles
    try:
        # get_tiles gives no ordering guarantee; rows come back reversed here.
        model = _stub_resource_model(['c', 'b', 'a'], calls)
        got = model.find_many(['b', 'a', 'c'])
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert got == ['instance:b', 'instance:a', 'instance:c'], got


def test_find_many_drops_ids_that_do_not_exist():
    calls = []
    original = aq_models.ResourceTileTree.get_tiles
    try:
        model = _stub_resource_model(['a'], calls)
        got = model.find_many(['a', 'missing'])
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert got == ['instance:a'], got


def test_find_many_of_nothing_makes_no_query():
    calls = []
    original = aq_models.ResourceTileTree.get_tiles
    try:
        model = _stub_resource_model([], calls)
        got = model.find_many([])
    finally:
        aq_models.ResourceTileTree.get_tiles = original

    assert got == [], got
    assert calls == [], calls


def test_single_node_nodegroup_collapses_to_its_node():
    """arches-querysets nests {'members': {'members': [...]}}; callers mean the list."""
    node = _SemanticNode({'members': {'members': ['a', 'b']}}, path='Group')
    # Iterating the uncollapsed dict used to yield the key 'members' as a string.
    assert list(node.members) == ['a', 'b'], list(node.members)
    assert len(node.members) == 2, len(node.members)


def test_nodegroup_without_matching_node_is_left_alone():
    """`title` holds only `title_text`, so it must stay walkable (wkrm remapping)."""
    node = _SemanticNode({'title': {'title_text': 'Set A'}}, path='Set')
    assert node.title.title_text == 'Set A', node.title.title_text


def test_siblings_of_a_collapsed_nodegroup_stay_reachable():
    tree = {'display_name': {'display_name': 'HA 1', 'show_hb_number': True}}
    node = _SemanticNode(tree, path='Monument')
    assert node.display_name == 'HA 1', node.display_name
    assert node.show_hb_number is True, node.show_hb_number


def test_missing_attribute_still_raises():
    node = _SemanticNode({'members': {'members': []}}, path='Group')
    try:
        node.nope
    except AttributeError as exc:
        assert 'nope' in str(exc), exc
    else:
        raise AssertionError('missing attribute silently accepted')


if __name__ == '__main__':
    test_find_many_makes_one_query_for_the_whole_page()
    test_find_many_returns_ids_in_argument_order()
    test_find_many_drops_ids_that_do_not_exist()
    test_find_many_of_nothing_makes_no_query()
    test_single_node_nodegroup_collapses_to_its_node()
    test_nodegroup_without_matching_node_is_left_alone()
    test_siblings_of_a_collapsed_nodegroup_stay_reachable()
    test_missing_attribute_still_raises()
    test_filters_go_to_sql_and_never_hydrate()
    test_only_filtered_nodes_are_annotated()
    test_lookup_suffix_resolves_to_its_node()
    test_unknown_alias_raises_rather_than_scanning()
    test_missing_slug_raises_rather_than_scanning()
    print('ok')
