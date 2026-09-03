"""Guards the batched, narrowed page build in DesignationTaskStrategy.get_tasks.

A page is hydrated with one query per model rather than one per row. Two things
have to hold: no row may be lost (a page can mix models, and hydrating them all
against one graph makes the odd ones out vanish silently), and the SQL's sort
order must survive the regrouping.

DISPLAY_ALIASES is passed to `nodes`, which today caps annotation building
without restricting the tile data returned. test_narrowed_page_matches_full_graph
therefore cannot fail on the current arches-querysets; it is kept as a canary for
the day `nodes` starts filtering data, which would blank unlisted fields.

Needs a populated database. Run inside the app container:
`docker exec -i coral-arches-1 /web_root/ENV/bin/python manage.py shell < tests/coral_tests/test_designation_display_nodes.py`
"""

import json

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
    {'sort_by': 'resourceid', 'reverse': True, 'limit': 10, 'offset': 0},
    {'sort_by': 'resourceid', 'reverse': False, 'limit': 10, 'offset': 0},
    {'sort_by': 'smr_number', 'reverse': True, 'limit': 10, 'offset': 0},
]


def _sql_rows(**kwargs):
    with connection.cursor() as cursor:
        cursor.execute(build_query(config=CONFIG, **kwargs))
        return cursor.fetchall()


def _models():
    from querysets_shim.models import Monument, MonumentRevision, Consultation

    return {
        'Monument': Monument,
        'MonumentRevision': MonumentRevision,
        'Consultation': Consultation,
    }


def _tasks(strategy, rows, narrowed=True):
    """Rebuild a page the way get_tasks does: group by model, then re-order."""
    models = _models()
    ordered_ids = []
    ids_by_model = {}
    for raw_id, _, model_name in rows:
        resource_id = str(raw_id)
        ordered_ids.append(resource_id)
        ids_by_model.setdefault(model_name, []).append(resource_id)

    found = {}
    for model_name, ids in ids_by_model.items():
        model_cls = models[model_name]
        nodes = strategy.display_nodes(model_cls, model_name) if narrowed else None
        for instance in model_cls.find_many(ids, nodes=nodes):
            found[str(instance.id)] = (model_name, instance)

    tasks = []
    for resource_id in ordered_ids:
        hit = found.get(resource_id)
        if not hit:
            continue
        model_name, instance = hit
        if model_name == 'Consultation':
            tasks.append(strategy.build_meeting_data(instance))
        else:
            tasks.append(strategy.build_data(instance, GROUP_ID))
    return tasks


def test_no_row_is_lost():
    strategy = DesignationTaskStrategy()
    with admin():
        for page in PAGES:
            rows = _sql_rows(**page)
            assert rows, f'no rows for {page}'
            tasks = _tasks(strategy, rows)
            assert len(tasks) == len(rows), (
                f'{len(rows) - len(tasks)} row(s) dropped for {page}; '
                f'models on page: {sorted({r[2] for r in rows})}'
            )


def test_sql_sort_order_survives_regrouping():
    strategy = DesignationTaskStrategy()
    with admin():
        for page in PAGES:
            rows = _sql_rows(**page)
            tasks = _tasks(strategy, rows)
            assert [t['id'] for t in tasks] == [str(r[0]) for r in rows], (
                f'sort order not preserved for {page}'
            )


def test_displayed_fields_are_actually_populated():
    """A page of blank cards would still pass the count and order checks."""
    strategy = DesignationTaskStrategy()
    with admin():
        rows = _sql_rows(sort_by='hb_number', reverse=True, limit=10, offset=0)
        tasks = _tasks(strategy, rows)
        assert any(t.get('hbnumber') for t in tasks), 'no hbnumber on any row'
        assert all(t.get('model') for t in tasks), 'a row lost its model label'
        assert all(t.get('id') for t in tasks), 'a row lost its id'


def test_narrowed_page_matches_full_graph():
    """Canary: fails if `nodes` ever starts restricting returned tile data."""
    strategy = DesignationTaskStrategy()
    with admin():
        for page in PAGES:
            rows = _sql_rows(**page)
            dump = lambda tasks: [
                json.dumps(t, default=str, sort_keys=True) for t in tasks
            ]
            assert dump(_tasks(strategy, rows, narrowed=True)) == dump(
                _tasks(strategy, rows, narrowed=False)
            ), f'narrowed page differs from full graph for {page}'


if __name__ == '__main__':
    test_no_row_is_lost()
    test_sql_sort_order_survives_regrouping()
    test_displayed_fields_are_actually_populated()
    test_narrowed_page_matches_full_graph()
    print('ok')
