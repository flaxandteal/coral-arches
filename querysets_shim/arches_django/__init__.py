"""querysets_shim.arches_django — compat shim for arches_orm.arches_django.

Exists so that imports like
    from querysets_shim.arches_django.datatypes.user import UserViewModel
resolve without changes when code is migrated from arches_orm.
"""
