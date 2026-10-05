"""Guards the page build in DesignationTaskStrategy.get_tasks.

The SQL picks the page; the cards are filled from tile values without hydrating
any resource. A page can mix models, so no row may be lost and the SQL's sort
order must survive the per-model reads.

Needs a populated database. Run inside the app container (`manage.py shell < file`
exec's stdin with the shell module's own __name__, so the guard below would not fire):
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell -c "exec(open('tests/coral_tests/test_designation_dashboard.py').read(), {'__name__': '__main__'})"`
"""

from django.db import connection

from querysets_shim.adapter import admin
from coral.views.dashboards.designation_strategy import DesignationTaskStrategy
from coral.views.dashboards.sql_query.builder import build_query
from coral.views.dashboards.sql_query.config.designation_config import (
    DESIGNATION_SQL_QUERY_CONFIG as CONFIG,
)

GROUP_ID = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'

# Sorts chosen so more than one model lands on a page.
PAGES = [
    {'sort_by': 'resourceid', 'sort_order': 'desc', 'filter': 'all'},
    {'sort_by': 'resourceid', 'sort_order': 'asc', 'filter': 'all'},
    {'sort_by': 'smr_number', 'sort_order': 'desc', 'filter': 'all'},
    {'sort_by': 'resourceid', 'sort_order': 'desc', 'filter': 'Consultation'},
]


def _page(sort_by, sort_order, filter):
    strategy = DesignationTaskStrategy()
    with admin():
        tasks, _, _ = strategy.get_tasks(
            GROUP_ID, None, page=1, page_size=10,
            sort_by=sort_by, sort_order=sort_order, filter=filter)
        option = next(o for o in strategy.get_filter_options() if o['id'] == filter)
        query = build_query(sort_by, reverse=sort_order == 'desc', limit=10, offset=0,
                            filter={'id': option['id'], 'type': option['type']}, config=CONFIG)
    with connection.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()
    return tasks, rows


def test_every_row_renders_in_sql_order():
    for page in PAGES:
        tasks, rows = _page(**page)
        assert rows, f'no rows for {page}'
        assert [t['id'] for t in tasks] == [str(r[0]) for r in rows], (
            f'rows lost or reordered for {page}; models on page: {sorted({r[2] for r in rows})}'
        )


def test_displayed_fields_are_populated():
    """A page of blank cards would still pass the count and order checks."""
    tasks, _ = _page('hb_number', 'desc', 'all')
    assert any(t.get('hbnumber') for t in tasks), 'no hbnumber on any row'
    assert all(t.get('model') for t in tasks), 'a row lost its model label'
    assert any(t.get('resourceid') for t in tasks), 'no resourceid on any row'
    assert any(t.get('displayname') for t in tasks), 'no display name on any row'
    assert any(t.get('inputdatevalue') for t in tasks), 'no input date on any row'
    # The card does `foreach: data.monumenttype`, so it must be a list of labels.
    types = [t['monumenttype'] for t in tasks if t.get('monumenttype')]
    assert types, 'no monument type on any row'
    assert all(all(isinstance(label, str) for label in v) for v in types), (
        f'monumenttype must be a list of strings, got {types[0]!r}')


def test_meetings_name_their_heritage_assets():
    tasks, _ = _page('resourceid', 'desc', 'Consultation')
    assert all(t['model'] == 'Evaluation Meeting' for t in tasks)
    related = [name for t in tasks for name in t['relatedmonumentsandareas']]
    assert related and all(isinstance(name, str) for name in related), (
        f'related heritage assets should be display names, got {related!r}')


if __name__ == '__main__':
    test_every_row_renders_in_sql_order()
    test_displayed_fields_are_populated()
    test_meetings_name_their_heritage_assets()
    print('ok')
