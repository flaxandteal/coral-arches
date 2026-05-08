"""
Dynamic module: `from alizarin_django.models import Person, Group, Monument, …`

Each name is resolved on first access via the WKRM registry. The returned
class is a fully-constructed ResourceModel subclass.

Mirrors `arches_orm.models` which exposes one class per WKRM.
"""

from __future__ import annotations

from typing import Any

from . import wkrm


def __getattr__(name: str) -> Any:
    cls = wkrm.attempt_well_known_resource_model(name)
    if cls is None:
        raise AttributeError(
            f"alizarin_django.models has no resource model named {name!r} — "
            f"check coral/wkrm.toml or settings.WELL_KNOWN_RESOURCE_MODELS"
        )
    # Cache on the module so subsequent lookups are direct attribute access
    globals()[name] = cls
    return cls


def __dir__() -> list[str]:
    wkrm.prime_registry()
    models = wkrm.get_resource_models_for_adapter()
    return sorted(models["by-class"].keys())
