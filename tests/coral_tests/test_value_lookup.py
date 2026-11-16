"""resolve_value_lookup: the node-alias filter -> JSON path translation.

Runs without Django or a database:
    python3 tests/coral_tests/test_value_lookup.py

Every node arches-querysets annotates is JSONB, so `where(hierarchy_type='X')`
compares a string against the whole document: no match, no error. These cases
pin the paths that were measured against a live Consultation, where the
untranslated lookups returned 0 and the translated ones returned every row.
"""

import os
import sys
import types

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# wrapper.py imports Django at module scope for FieldError; stub just enough to
# import it, so this test needs neither Django settings nor a database.
if "django" not in sys.modules:
    django = types.ModuleType("django")
    core = types.ModuleType("django.core")
    exceptions = types.ModuleType("django.core.exceptions")
    exceptions.FieldError = type("FieldError", (Exception,), {})
    core.exceptions = exceptions
    django.core = core
    sys.modules.update({
        "django": django,
        "django.core": core,
        "django.core.exceptions": exceptions,
    })

from querysets_shim.wrapper import resolve_value_lookup  # noqa: E402

CASES = [
    # (lookup, datatype, expected)
    # string: {"en": {"value": "CON/2026/x", "direction": "ltr"}}
    ("resourceid", "string", "resourceid__en__value"),
    ("resourceid__startswith", "string", "resourceid__en__value__startswith"),
    ("resourceid__in", "string", "resourceid__en__value__in"),
    # reference: [{"uri": ..., "labels": [{"value": "Non-statutory", ...}]}]
    ("hierarchy_type", "reference", "hierarchy_type__0__labels__0__value"),
    ("council__in", "reference", "council__0__labels__0__value__in"),
    # Structural lookups address the annotation, not the value inside it.
    ("hierarchy_type__isnull", "reference", "hierarchy_type__isnull"),
    ("council__contains", "reference", "council__contains"),
    # Datatypes with no mapping are passed through untouched.
    ("target_date_n1__lte", "date", "target_date_n1__lte"),
    ("assigned_to_n1", "resource-instance-list", "assigned_to_n1"),
    ("some_alias", "", "some_alias"),
]


def main():
    failed = 0
    for lookup, datatype, expected in CASES:
        actual = resolve_value_lookup(lookup, datatype)
        if actual == expected:
            print(f"  ok    {lookup:32} [{datatype or '-'}] -> {actual}")
        else:
            failed += 1
            print(f"  FAIL  {lookup:32} [{datatype or '-'}]\n"
                  f"          expected {expected!r}\n"
                  f"          got      {actual!r}")
    print(f"\n{len(CASES) - failed}/{len(CASES)} passing")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
