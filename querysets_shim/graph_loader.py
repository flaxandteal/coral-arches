"""
Graph loader — compatibility shim.

Previously loaded graph definitions into a Rust core. Now a no-op since
the data layer is backed by arches-querysets.

The public API is preserved so existing imports don't break.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def get_graph_json(graphid: str) -> Dict[str, Any]:
    """Return serialized graph JSON for an Arches graph UUID."""
    graphid = str(graphid)
    from arches.app.models.graph import Graph

    graph = Graph.objects.get(graphid=graphid)
    if hasattr(graph, "serialize"):
        return graph.serialize()
    raise RuntimeError(f"Cannot serialize graph {graphid}")


def register_graph(graphid: str) -> str:
    """No-op — arches-querysets handles graph registration internally."""
    return str(graphid)


def get_graph_id(graphid: str) -> Optional[str]:
    """Returns the graphid unchanged (legacy mapping no longer needed)."""
    return str(graphid)


__all__ = [
    "get_graph_json",
    "register_graph",
    "get_graph_id",
]
