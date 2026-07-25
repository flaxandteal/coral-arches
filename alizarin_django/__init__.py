"""
alizarin_django — Django/Arches ORM shim backed by arches-querysets.

Preserves the API surface used by coral-arches while delegating data access
to arches-querysets' ResourceTileTree / TileTree underneath.

Public submodules:

    alizarin_django.adapter           — admin(), context_free, ContextVar
    alizarin_django.wkrm              — well-known resource model registry
    alizarin_django.models            — dynamic module: from alizarin_django.models import Person
    alizarin_django.view_models       — view-model classes (Concept, NodeList, ResourceInstance)
    alizarin_django.datatypes         — datatype-specific helpers (django_group)
    alizarin_django.query_builder     — chainable query builder
"""

from __future__ import annotations

__version__ = "0.2.0"

# `import alizarin_django; alizarin_django.wkrm.get_resource_models_for_adapter(...)`
# is used in coral/views/orm.py — make sure the submodule is importable as an
# attribute of the package without an explicit `from … import wkrm`.
from . import wkrm  # noqa: F401
