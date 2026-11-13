"""querysets_shim.values: tile value readers.

Runs without Django or a database:
    python3 tests/coral_tests/test_values.py

values_by_resource itself needs tiles; its alignment guarantee (one entry per
tile for every alias sharing a nodegroup) was verified live against Group
ae2039a4-7070-11ee-bb7a-0242ac140008, which carries two tiles per resource.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from querysets_shim.values import _value, related_resource_ids


def test_value():
    assert _value({"en": {"value": "HB 123"}}, "string", "en") == "HB 123"
    # arches returns nothing for a missing language rather than another one.
    assert _value({"ga": {"value": "x"}}, "string", "en") is None
    assert _value({"en": {"value": ""}}, "string", "en") is None
    # The active language is whatever arches is serving, not always en.
    assert _value({"en-us": {"value": "Color"}}, "string", "en-us") == "Color"
    # Dates and pre-i18n string tiles hold the bare text.
    assert _value("2026-09-20", "string", "en") == "2026-09-20"
    # Anything else is handed back as stored, for reference_label and friends.
    reference = [{"uri": "u", "labels": [{"value": "Open"}]}]
    assert _value(reference, "reference", "en") == reference


def test_related_resource_ids():
    assert related_resource_ids([{"resourceId": "a"}, {"resourceId": "b"}]) == ["a", "b"]
    # A resource-instance node stores one dict rather than a list of them.
    assert related_resource_ids({"resourceId": "a"}) == ["a"]
    assert related_resource_ids([{"resourceId": "a"}, {"resourceId": "a"}]) == ["a"]
    assert related_resource_ids([{"ontologyProperty": "x"}]) == []
    assert related_resource_ids(None) == []


if __name__ == "__main__":
    test_value()
    test_related_resource_ids()
    print("ok")
