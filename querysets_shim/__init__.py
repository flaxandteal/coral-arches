"""
querysets_shim — Django/Arches ORM shim backed by arches-querysets.

Preserves the API surface used by coral-arches while delegating data access
to arches-querysets' ResourceTileTree / TileTree underneath.

Public submodules:

    querysets_shim.adapter           — admin(), context_free, ContextVar
    querysets_shim.wkrm              — well-known resource model registry
    querysets_shim.models            — dynamic module: from querysets_shim.models import Person
    querysets_shim.view_models       — view-model classes (Concept, NodeList, ResourceInstance)
    querysets_shim.datatypes         — datatype-specific helpers (django_group)
    querysets_shim.query_builder     — chainable query builder
"""

from __future__ import annotations

__version__ = "0.2.0"

# `import querysets_shim; querysets_shim.wkrm.get_resource_models_for_adapter(...)`
# is used in coral/views/orm.py — make sure the submodule is importable as an
# attribute of the package without an explicit `from … import wkrm`.
from . import wkrm  # noqa: F401
