"""Guards the reference-tile readers against the pre-v8 scalar shape.

Runs without Django or a database: `python tests/coral_tests/test_reference_values.py`
(`reference_value` is excluded on purpose — it queries the controlled list tables.)
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from coral.utils.reference_values import (
    has_list_item,
    reference_label,
    selected_list_item_ids,
    single_list_item_id,
)

HM_ITEM = '03ea2b65-1def-5fc4-ae4e-70b5869d9696'
HB_ITEM = '8b7091c9-dcd2-578c-9775-814240a4ea01'


def entry(item_id, value, language='en'):
    return {
        'uri': 'https://coral-her.flaxandteal.co.uk/' + item_id,
        'list_id': '5e1bbef7-b22d-5e2f-a5ae-1c5f23a9bbeb',
        'labels': [{'id': 'x', 'value': value, 'language_id': language,
                    'valuetype_id': 'prefLabel', 'list_item_id': item_id}],
    }


HM_TILE_VALUE = [entry(HM_ITEM, 'HM')]


def test_reads_the_selected_item():
    assert selected_list_item_ids(HM_TILE_VALUE) == {HM_ITEM}
    assert single_list_item_id(HM_TILE_VALUE) == HM_ITEM
    assert has_list_item(HM_TILE_VALUE, HM_ITEM)
    assert not has_list_item(HM_TILE_VALUE, HB_ITEM)
    assert reference_label(HM_TILE_VALUE) == 'HM'


def test_empty_and_missing_values_are_not_a_match():
    # tile.data.get(node) returns None for a tile saved before the node existed.
    for empty in (None, [], {}):
        assert selected_list_item_ids(empty) == set()
        assert single_list_item_id(empty) is None
        assert not has_list_item(empty, HM_ITEM)
        assert reference_label(empty) is None


def test_multiselect_returns_every_item():
    both = [entry(HM_ITEM, 'HM'), entry(HB_ITEM, 'HB')]
    assert selected_list_item_ids(both) == {HM_ITEM, HB_ITEM}
    assert reference_label(both) in ('HM, HB', 'HB, HM')


def test_label_prefers_the_requested_language():
    multilingual = [{
        'uri': 'https://coral-her.flaxandteal.co.uk/' + HM_ITEM,
        'list_id': '5e1bbef7-b22d-5e2f-a5ae-1c5f23a9bbeb',
        'labels': [
            {'id': 'c', 'value': 'Lárionad', 'language_id': 'ga',
             'valuetype_id': 'prefLabel', 'list_item_id': HM_ITEM},
            {'id': 'd', 'value': 'HM', 'language_id': 'en',
             'valuetype_id': 'prefLabel', 'list_item_id': HM_ITEM},
        ],
    }]
    assert reference_label(multilingual) == 'HM'
    assert reference_label(multilingual, language='ga') == 'Lárionad'
    # Every label in one entry shares a list item id, so the first is enough.
    assert selected_list_item_ids(multilingual) == {HM_ITEM}


def test_a_legacy_scalar_value_never_matches():
    # Tiles written before the datatype migration still hold the bare option id. Iterating
    # that string would yield characters, so the readers must reject it outright rather
    # than raising inside a post_save.
    legacy = '2628d62f-c206-4c06-b26a-3511e38ea243'
    assert selected_list_item_ids(legacy) == set()
    assert not has_list_item(legacy, HM_ITEM)
    assert reference_label(legacy) is None


def test_malformed_entries_are_skipped_not_fatal():
    assert selected_list_item_ids([None, 'junk', entry(HM_ITEM, 'HM')]) == {HM_ITEM}
    assert selected_list_item_ids([{'uri': 'x', 'list_id': 'y'}]) == set()


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
