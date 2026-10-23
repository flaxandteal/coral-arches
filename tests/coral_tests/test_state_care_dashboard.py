"""Guards StateCareTaskStrategy.get_tasks: open items are picked and paged in the database.

Open means no sign-off value, including no sign-off tile at all. The expected ids
are worked out here from the tiles, independently of the strategy's SQL.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_state_care_dashboard.py').read(), {'__name__': '__main__'})"`
"""

from arches.app.models.models import ResourceInstance, TileModel
from querysets_shim import models as shim_models
from querysets_shim.adapter import admin
from coral.views.dashboards.state_care_strategy import SOURCES, StateCareTaskStrategy, format_date

GROUP_ID = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'
CARD_KEYS = {'id', 'state', 'displayname', 'userheading', 'dateheading', 'inputby', 'date', 'slug', 'model'}


def _tasks(filter='all', sort_by='displayname', sort_order='asc'):
    with admin():
        return StateCareTaskStrategy().get_tasks(
            GROUP_ID, None, page=1, page_size=100000,
            sort_by=sort_by, sort_order=sort_order, filter=filter)


def _expected_open_ids(source):
    cls = getattr(shim_models, source['model_class'])
    node = cls._._node_objects_by_alias()[source['signed_off']]
    signed_off = set()
    for resource_id, data in TileModel.objects.filter(nodegroup_id=node.nodegroup_id).values_list(
            'resourceinstance_id', 'data'):
        if (data or {}).get(str(node.nodeid)):
            signed_off.add(str(resource_id))
    ids = {str(id) for id in ResourceInstance.objects.filter(graph_id=cls._graphid).values_list('pk', flat=True)}
    if source['model_class'] == 'Consultation':
        node = cls._._node_objects_by_alias()['resourceid']
        ids = {str(resource_id) for resource_id, data in TileModel.objects.filter(
            nodegroup_id=node.nodegroup_id).values_list('resourceinstance_id', 'data')
            if ((data or {}).get(str(node.nodeid)) or {}).get('en', {}).get('value', '').startswith('CIN/')}
    return ids - signed_off


def test_each_filter_returns_exactly_its_open_items():
    for source in SOURCES:
        expected = _expected_open_ids(source)
        tasks, total, counters = _tasks(source['filter'])
        assert {t['id'] for t in tasks} == expected, source['filter']
        assert total == len(expected) == counters['Resource Types'][source['counter']]
        assert all(t['model'] == source['model'] for t in tasks)


def test_all_is_the_union_and_counters_match():
    tasks, total, counters = _tasks('all')
    expected = {id for source in SOURCES for id in _expected_open_ids(source)}
    assert expected, 'no open items in this database'
    assert {t['id'] for t in tasks} == expected
    assert total == sum(counters['Resource Types'].values()) == len(expected)


def test_filtering_zeroes_other_counters():
    _, _, counters = _tasks('curatorial_inspection')
    others = {k: v for k, v in counters['Resource Types'].items() if k != 'Curatorial Inspections'}
    assert set(others.values()) == {0}


def test_cards_carry_every_key_and_sorts_page_cleanly():
    for sort_by in ('displayname', 'completed_on_date', 'completed_by'):
        for order in ('asc', 'desc'):
            tasks, total, _ = _tasks('all', sort_by, order)
            assert len(tasks) == total
            assert all(CARD_KEYS <= set(t) for t in tasks)
            assert all(t['state'] == 'State' for t in tasks)


def test_bare_iso_date_renders_day_first():
    assert format_date('2026-09-20') == '20-09-2026'
    assert format_date(None) is None


if __name__ == '__main__':
    test_each_filter_returns_exactly_its_open_items()
    test_all_is_the_union_and_counters_match()
    test_filtering_zeroes_other_counters()
    test_cards_carry_every_key_and_sorts_page_cleanly()
    test_bare_iso_date_renders_day_first()
