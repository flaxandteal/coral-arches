"""Descriptor indexing for arches_search, ported from our fork.

Source: flaxandteal/arches-search, branch `scm/index-descriptors`
        (arches_search/indexing/index_descriptor.py)

The installed arches-search (0.1.0a13, PyPI) does not carry this yet. Rather
than pin the dependency to the fork branch - which is based on an older main and
would regress the attribute-filter work already released in 0.1.0a13 - the
module is vendored here and hooked in from `coral.perf.descriptor_indexing`.

Delete this file and the hook once the change lands in a released
arches-search, and the upstream version takes over.

--- begin vendored source ---
"""

from arches.app.models.models import FunctionXGraph, TileModel
from arches.app.models.system_settings import settings

from arches_search.models.models import TermSearch

DESCRIPTOR_NODE_ALIAS = "__descriptor__"


def _descriptor_name_nodegroup_id(resource):
    """The single nodegroup that drives the 'name' descriptor for this resource's
    graph, if the primarydescriptors config declares one; None otherwise (including
    the multicard descriptor, which leaves it empty)."""
    function_x_graph = FunctionXGraph.objects.filter(
        graph_id=resource.graph_id,
        function__functiontype="primarydescriptors",
    ).first()
    if function_x_graph is None:
        return None
    try:
        return function_x_graph.config["descriptor_types"]["name"].get("nodegroup_id") or None
    except (KeyError, TypeError, AttributeError):
        return None


def _descriptor_tile(resource):
    """Prefer a tile from the descriptor's name nodegroup when one is configured;
    else any tile (ordered for determinism); None if the resource has no tiles."""
    tiles = TileModel.objects.filter(resourceinstance_id=resource.resourceinstanceid)
    nodegroup_id = _descriptor_name_nodegroup_id(resource)
    if nodegroup_id:
        tile = (
            tiles.filter(nodegroup_id=nodegroup_id)
            .order_by("sortorder", "tileid")
            .first()
        )
        if tile is not None:
            return tile
    return tiles.order_by("tileid").first()


def build_descriptor_terms(resource):
    """Return the TermSearch rows for this resource's descriptor name(s), or []."""
    if str(resource.graph_id) == str(settings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID):
        return []
    descriptors = resource.descriptors or {}
    if not descriptors:
        return []
    tile = _descriptor_tile(resource)
    if tile is None:
        return []
    graph_slug = resource.graph.slug
    rows = []
    for language, values in descriptors.items():
        name = (values or {}).get("name")
        if not name or name == "Undefined":
            continue
        rows.append(
            TermSearch(
                node_alias=DESCRIPTOR_NODE_ALIAS,
                tileid_id=tile.tileid,
                resourceinstanceid_id=resource.resourceinstanceid,
                datatype="string",
                language=language,
                graph_slug=graph_slug,
                value=name,
            )
        )
    return rows


def index_resource_descriptors(resource, delete_existing=True):
    """Replace (or, during a fresh reindex, append) this resource's descriptor
    term rows. Idempotent when delete_existing is True."""
    if delete_existing:
        TermSearch.objects.filter(
            resourceinstanceid_id=resource.resourceinstanceid,
            node_alias=DESCRIPTOR_NODE_ALIAS,
        ).delete()
    rows = build_descriptor_terms(resource)
    if rows:
        TermSearch.objects.bulk_create(rows)
    return rows
