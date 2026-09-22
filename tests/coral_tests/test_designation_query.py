"""Guards the designation dashboard SQL against the pre-v8-upgrade node ids.

Runs without Django or a database: builder.py and designation_config.py are both
dependency-free. `python tests/coral_tests/test_designation_query.py`
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from coral.views.dashboards.sql_query.builder import build_query
from coral.views.dashboards.sql_query.config.designation_config import (
    DESIGNATION_SQL_QUERY_CONFIG as CONFIG,
)

# Ids replaced when the Heritage Asset and Consultation graphs were regenerated.
RETIRED_IDS = {
    '3897b87a-1902-11ef-aa9f-0242ac150006': 'HA Garden Sign Off nodegroup',
    '3a0ab672-190b-11ef-aa9c-0242ac150006': 'HA Status Type',
    '447973ce-d7e2-11ee-a4a1-0242ac120006': 'HA Council',
    '7e0533aa-37b7-11ef-9263-0242ac150006': 'HA Approvals nodegroup',
    '85396d94-37bc-11ef-9263-0242ac150006': 'HA Statutory Consultee Notification Date Value',
    '34959a52-03aa-11ef-948f-0242ac150003': 'Consultation Evaluation nodegroup',
    '5ffdc00e-03ad-11ef-948f-0242ac150003': 'Consultation Sign Off Date Value',
    '7f81d135-45ac-483f-96f4-2fa8ca882d79': 'Provisional domain-value option',
    'e71df5cc-3aad-11ef-a2d0-0242ac120003': 'HA Heritage Asset References nodegroup',
    '250002fe-3aae-11ef-91fd-0242ac120003': 'HA HB Number',
    '158e1ed2-3aae-11ef-a2d0-0242ac120003': 'HA SMR Number',
    '1de9abf0-3aae-11ef-91fd-0242ac120003': 'HA IHR Number',
    '2c2d02fc-3aae-11ef-91fd-0242ac120003': 'HA Historic Parks and Gardens',
}

MODELS = ('Monument', 'MonumentRevision', 'Consultation')


def every_query():
    """One query per sort option, unfiltered / council-filtered / counting."""
    for sort_by in CONFIG['sort_options']:
        yield build_query(sort_by, config=CONFIG)
        yield build_query(sort_by, count=True, config=CONFIG)
        yield build_query(
            sort_by, filter={'id': 'LA04', 'type': 'council'}, config=CONFIG
        )
        yield build_query(
            sort_by, filter={'id': 'stat_date', 'type': 'date'}, config=CONFIG
        )
        for model in MODELS:
            yield build_query(
                sort_by, filter={'id': model, 'type': 'default'}, config=CONFIG
            )


def test_no_retired_ids():
    for query in every_query():
        for retired, description in RETIRED_IDS.items():
            assert retired not in query, f"retired id still in use: {description}"


def test_council_filter_reaches_every_model():
    query = build_query(
        'resourceid', filter={'id': 'LA04', 'type': 'council'}, config=CONFIG
    )
    for model in MODELS:
        assert f"'{model}' AS type" in query, f"{model} dropped from council filter"
    # Councils live in two lists with different item ids, so the match is on the
    # LA code in the label, not on a list item id.
    assert query.count("lbl ->> 'value' LIKE 'LA04 - %'") == 3


def test_reference_nodes_are_not_compared_as_scalars():
    """`tiledata ->> node` never matches a reference tile, whose value is a list."""
    reference_nodes = (
        'e54c9269-5134-5eb2-a592-953c8799776e',  # HA Status Type
        'f4087433-b7b1-52fd-a1e7-f2f7cb36ef8c',  # HA Council
        '02003ed4-b2b5-4fcc-847b-bc34e7c72ee3',  # HAR Council
    )
    for query in every_query():
        for node in reference_nodes:
            assert f"->> '{node}'" not in query, f"scalar comparison on reference node {node}"


def test_stat_date_filter_excludes_consultations():
    """Consultation has no equivalent date, so its subquery is dropped entirely."""
    query = build_query(
        'resourceid', filter={'id': 'stat_date', 'type': 'date'}, config=CONFIG
    )
    assert "'Monument' AS type" in query
    assert "'MonumentRevision' AS type" in query
    assert "'Consultation' AS type" not in query


if __name__ == '__main__':
    test_no_retired_ids()
    test_council_filter_reaches_every_model()
    test_reference_nodes_are_not_compared_as_scalars()
    test_stat_date_filter_excludes_consultations()
    print('ok')
