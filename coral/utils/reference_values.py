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
    # A tile written before the datatype migration still holds the bare option id, and
    # iterating that string would yield characters rather than entries.
    if not value or not isinstance(value, list):
        return set()

    item_ids = set()
    for entry in value:
        if not isinstance(entry, dict):
            continue
        labels = entry.get('labels') or []
        if labels:
            item_ids.add(str(labels[0].get('list_item_id')))
    return item_ids


def has_list_item(value, list_item_id):
    """Whether a reference tile value holds this controlled-list item."""
    return str(list_item_id) in selected_list_item_ids(value)


def reference_label(value, language='en'):
    """Comma-joined display labels for a reference tile value.

    The labels travel inside the tile, so this needs no node lookup or database query.
    """
    if not value or not isinstance(value, list):
        return None

    labels = []
    for entry in value:
        if not isinstance(entry, dict):
            continue
        entry_labels = entry.get('labels') or []
        preferred = next(
            (label for label in entry_labels if label.get('language_id') == language),
            entry_labels[0] if entry_labels else None,
        )
        if preferred and preferred.get('value'):
            labels.append(preferred['value'])
    return ', '.join(labels) if labels else None
