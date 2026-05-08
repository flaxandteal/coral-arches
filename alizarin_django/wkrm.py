"""
Well-Known Resource Model registry.

Mirrors `arches_orm.wkrm`. Reads `settings.WELL_KNOWN_RESOURCE_MODELS` (a list
of dicts loaded from coral/wkrm.toml) and dynamically builds a ResourceModel
subclass for each entry.

Public API:
    prime_registry()
    wkrm_count()
    get_well_known_resource_model_by_graph_id(graphid)
    attempt_well_known_resource_model(key)
    get_resource_models_for_adapter(adapter_key)
"""

from __future__ import annotations

import logging
import re
import threading
from typing import Any, Dict, List, Optional, Type

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_primed = False
_by_class_name: Dict[str, Any] = {}
_by_class_class_name: Dict[str, Any] = {}  # CamelCased model_name (e.g. "LogicalSet")
_by_graph_id: Dict[str, Any] = {}
_wkrm_defs: List[Dict[str, Any]] = []


def _camel_class_name(name: str) -> str:
    """'Logical Set' → 'LogicalSet', 'Person' → 'Person'."""
    parts = re.split(r"\s+", name.strip())
    return "".join(p[:1].upper() + p[1:] for p in parts if p)


def _build_wrapper_class(wkrm: Dict[str, Any]) -> Type[Any]:
    """Dynamically construct a ResourceModel subclass for a single WKRM."""
    from .wrapper import ResourceModel  # local import to avoid circular load

    class_name = _camel_class_name(wkrm.get("model_name", "Unknown"))
    cls = type(
        class_name,
        (ResourceModel,),
        {
            "_graphid": str(wkrm["graphid"]),
            "_wkrm": dict(wkrm),
            "__module__": "alizarin_django.models",
            "__qualname__": class_name,
        },
    )
    return cls


def prime_registry() -> None:
    """
    Load WELL_KNOWN_RESOURCE_MODELS from settings and build a wrapper class
    per entry. Idempotent.
    """
    global _primed
    if _primed:
        return
    with _lock:
        if _primed:
            return
        try:
            from django.conf import settings

            defs = list(getattr(settings, "WELL_KNOWN_RESOURCE_MODELS", []))
        except Exception as exc:
            logger.warning("alizarin_django: cannot read settings: %s", exc)
            defs = []

        for wkrm in defs:
            try:
                cls = _build_wrapper_class(wkrm)
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "alizarin_django: failed to build wrapper for %r: %s",
                    wkrm,
                    exc,
                )
                continue
            _wkrm_defs.append(wkrm)
            # Index under both the spaced model_name and CamelCased class name
            model_name = wkrm.get("model_name", "")
            _by_class_name[model_name] = cls
            _by_class_class_name[cls.__name__] = cls
            _by_graph_id[str(wkrm["graphid"])] = cls

        _primed = True


def wkrm_count() -> int:
    return len(_wkrm_defs)


def get_well_known_resource_model_by_graph_id(graphid: Any) -> Optional[Type[Any]]:
    """Look up a wrapper class by Arches graph UUID."""
    prime_registry()
    return _by_graph_id.get(str(graphid))


def attempt_well_known_resource_model(key: str) -> Optional[Type[Any]]:
    """
    Try to resolve a wrapper class by various keys: CamelCased class name,
    spaced model_name, or graph UUID.
    """
    prime_registry()
    if not key:
        return None
    if key in _by_class_class_name:
        return _by_class_class_name[key]
    if key in _by_class_name:
        return _by_class_name[key]
    if key in _by_graph_id:
        return _by_graph_id[key]
    return None


def get_resource_models_for_adapter(adapter_key: str = "arches-django") -> Dict[str, Dict[str, Any]]:
    """
    Match arches_orm.wkrm.get_resource_models_for_adapter shape:

        {"by-class": {ClassName: cls, ...},
         "by-graph-id": {graphid: cls, ...}}

    The adapter_key argument is ignored — there's only one adapter.
    """
    prime_registry()
    return {
        "by-class": dict(_by_class_class_name),
        "by-graph-id": dict(_by_graph_id),
    }


__all__ = [
    "prime_registry",
    "wkrm_count",
    "get_well_known_resource_model_by_graph_id",
    "attempt_well_known_resource_model",
    "get_resource_models_for_adapter",
]
