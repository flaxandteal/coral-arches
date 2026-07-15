"""
alizarin_django — Django/Arches ORM shim built on top of the `alizarin` Rust/Python
data-transformation library. Drop-in replacement for the parts of `arches_orm`
that coral-arches actually uses.

Public submodules (mirroring the arches_orm import paths used in coral-arches):

    alizarin_django.adapter           — admin(), context_free, ContextVar
    alizarin_django.wkrm              — well-known resource model registry
    alizarin_django.models            — dynamic module: from alizarin_django.models import Person
    alizarin_django.view_models       — view-model classes (Concept, NodeList, ResourceInstance)
    alizarin_django.datatypes         — datatype-specific helpers (django_group)
    alizarin_django.query_builder     — chainable query builder

Design notes:
    * The data layer is `alizarin` (PyO3 bindings: tiles_to_json_tree,
      json_tree_to_tiles, register_graph, RDM cache, view models).
    * The high-level alizarin Python wrappers (ResourceInstanceWrapper,
      SemanticViewModel) are async; coral-arches is sync. Where we use them, we
      bridge with `alizarin_django.sync_bridge.run_sync()`.
    * Storage layer is Arches' own Django models (Resource, TileModel,
      ResourceXResource).
    * Permission context is a contextvars.ContextVar — same semantics as
      arches_orm.adapter.
"""

from __future__ import annotations

__version__ = "0.1.0"

# `import alizarin_django; alizarin_django.wkrm.get_resource_models_for_adapter(...)`
# is used in coral/views/orm.py — make sure the submodule is importable as an
# attribute of the package without an explicit `from … import wkrm`.
from . import wkrm  # noqa: F401
