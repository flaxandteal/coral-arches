"""Guards QueryBuilder tile filters against the per-resource scan they replaced.

`Person.where(user_account=N)` used to hydrate every Person in the graph (~3s each,
83,975 of them) to compare one attribute. Filters now resolve in SQL, and an
unsupported one must raise rather than fall back to that scan.

Needs Django but no database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell < tests/coral_tests/test_querysets_shim_filters.py`
"""

from django.core.exceptions import FieldError

import arches_querysets.models as aq_models
from querysets_shim.wrapper import QueryBuilder


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


if __name__ == '__main__':
    test_filters_go_to_sql_and_never_hydrate()
    test_only_filtered_nodes_are_annotated()
    test_lookup_suffix_resolves_to_its_node()
    test_unknown_alias_raises_rather_than_scanning()
    test_missing_slug_raises_rather_than_scanning()
    print('ok')
