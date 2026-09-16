"""Read controlled-list selections out of a `reference` tile value.

A reference tile stores a list of entries shaped
`{"uri": ..., "list_id": ..., "labels": [{"value": ..., "list_item_id": ...}, ...]}`,
so the pre-v8 `tile.data[node] == "<option id>"` comparison can never match: it tests a
scalar against a list. Compare against `selected_list_item_ids` instead.
"""


def selected_list_item_ids(value):
    """The controlled-list item ids selected in a reference tile value.

    ReferenceDataType.validate_list_item_consistency guarantees every label within one
    entry carries the same list_item_id, so the first label is enough.
    """
    item_ids = set()
    for entry in _entries(value):
        # Read straight off a tile the entries are dicts, but through the querysets
        # shim the datatype hands back arches_controlled_lists Reference objects.
        labels = _labels(entry)
        if not labels:
            continue
        item_id = _label_field(labels[0], 'list_item_id')
        if item_id:
            item_ids.add(str(item_id))
    return item_ids


def _entries(value):
    """The reference entries in a tile value, whichever container they arrive in.

    Read straight off a tile this is a list; through the querysets shim it is a
    node wrapping one. A tile written before the datatype migration still holds
    the bare option id, and iterating that string would yield characters rather
    than entries — so reject what must not be iterated rather than insisting on
    a list.
    """
    if not value or isinstance(value, (str, bytes, dict)):
        return []
    try:
        return list(value)
    except TypeError:
        return []


def _labels(entry):
    """The label rows of one reference entry, whichever shape it arrived in."""
    if isinstance(entry, dict):
        return entry.get('labels') or []
    return getattr(entry, 'labels', None) or []


def _label_field(label, name):
    return label.get(name) if isinstance(label, dict) else getattr(label, name, None)


def has_list_item(value, list_item_id):
    """Whether a reference tile value holds this controlled-list item."""
    return str(list_item_id) in selected_list_item_ids(value)


def single_list_item_id(value):
    """The one controlled-list item id in a single-select reference tile value."""
    return next(iter(selected_list_item_ids(value)), None)


def reference_value(list_item_id):
    """Tile value for a single controlled-list selection.

    Delegates to the datatype so the stored shape stays whatever arches_controlled_lists
    says it is. Unlike the readers above this needs the database, so the import is local.
    """
    from arches_controlled_lists.datatypes.datatypes import ReferenceDataType

    return ReferenceDataType().transform_value_for_tile(str(list_item_id))


def reference_label(value, language='en'):
    """Comma-joined display labels for a reference tile value.

    The labels travel inside the tile, so this needs no node lookup or database query.
    """
    labels = []
    for entry in _entries(value):
        entry_labels = _labels(entry)
        if not entry_labels:
            continue
        preferred = next(
            (label for label in entry_labels if _label_field(label, 'language_id') == language),
            entry_labels[0],
        )
        text = _label_field(preferred, 'value')
        if text:
            labels.append(text)
    return ', '.join(labels) if labels else None
