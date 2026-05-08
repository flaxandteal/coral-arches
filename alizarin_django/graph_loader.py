"""
Load Arches graph definitions from the Django DB and register them with the
alizarin Rust core.

alizarin's `tiles_to_json_tree` / `json_tree_to_tiles` need a graph_id that's
been registered via `alizarin.register_graph(graph_json)`. The graph JSON has
to look like the output of Arches' `arches export graph` command — i.e. a dict
with `graph`, `nodes`, `edges`, `nodegroups`, `cards`, `widgets`, etc.

We re-use Arches' own GraphExporter to produce that JSON, then register it
with alizarin and cache the result keyed by graph UUID.
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Dict, Optional

import alizarin

logger = logging.getLogger(__name__)

# Cache: arches graph UUID (str) -> alizarin graph_id (str, may be the same)
_registered: Dict[str, str] = {}
_graph_json_cache: Dict[str, Dict[str, Any]] = {}
_lock = threading.RLock()


def _serialize_graph(graphid: str) -> Dict[str, Any]:
    """
    Serialize an Arches graph to the dict shape alizarin expects.

    Uses Arches' GraphExporter where possible. Falls back to a manual
    serialization built from arches.app.models.graph.Graph.
    """
    # Lazy import — Arches must be set up before this is called.
    from arches.app.models.graph import Graph

    graph = Graph.objects.get(graphid=graphid)

    # Try the canonical exporter first.
    try:
        from arches.app.utils.data_management.resource_graphs.exporter import (
            get_graphs_for_export,
        )

        exported = get_graphs_for_export([str(graphid)])
        if isinstance(exported, dict) and "graph" in exported:
            graphs = exported["graph"]
            if graphs:
                return graphs[0]
    except Exception as exc:  # pragma: no cover
        logger.debug(
            "graph_loader: GraphExporter failed for %s, falling back: %s",
            graphid,
            exc,
        )

    # Fallback: minimal serialization using Graph.serialize()
    if hasattr(graph, "serialize"):
        return graph.serialize()  # type: ignore[no-any-return]

    raise RuntimeError(
        f"Cannot serialize graph {graphid}: no GraphExporter and no .serialize()"
    )


def get_graph_json(graphid: str) -> Dict[str, Any]:
    """Return the (cached) serialized graph JSON for an Arches graph UUID."""
    graphid = str(graphid)
    if graphid in _graph_json_cache:
        return _graph_json_cache[graphid]
    with _lock:
        if graphid in _graph_json_cache:
            return _graph_json_cache[graphid]
        gj = _serialize_graph(graphid)
        _graph_json_cache[graphid] = gj
        return gj


def register_graph(graphid: str) -> str:
    """
    Ensure an Arches graph has been registered with alizarin's Rust core.

    Returns the alizarin graph_id (in practice the same UUID, but we treat it
    as opaque). Cached after the first call per UUID.
    """
    graphid = str(graphid)
    if graphid in _registered:
        return _registered[graphid]
    with _lock:
        if graphid in _registered:
            return _registered[graphid]
        if alizarin.register_graph is None:  # type: ignore[truthy-function]
            raise RuntimeError(
                "alizarin Rust extension not loaded — install the alizarin "
                "package built with maturin"
            )
        gj = get_graph_json(graphid)
        alizarin_id = alizarin.register_graph(json.dumps(gj, default=str))
        _registered[graphid] = alizarin_id
        logger.info(
            "alizarin_django: registered graph %s with alizarin (id=%s)",
            graphid,
            alizarin_id,
        )
        return alizarin_id


def get_alizarin_graph_id(graphid: str) -> Optional[str]:
    """Return the alizarin graph_id for a given Arches graph UUID, or None."""
    return _registered.get(str(graphid))


__all__ = [
    "get_graph_json",
    "register_graph",
    "get_alizarin_graph_id",
]
