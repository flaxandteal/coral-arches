"""Drop empty sections from the search result drop-down.

``arches_search`` asks ``arches_modular_reports`` for a report config per
resource - ``fetchSearchReportConfig(resourceInstanceId, "search_result_expanded")``
- so the endpoint already knows *which resource* is being expanded. It just
does not use that to decide what to return.

Without pruning, a config generated from a graph's cards shows every section
for every resource, and ``DataSection`` does not hide itself when a card has no
data: it renders the card header plus "No data found." Heritage Asset has 54
top-level cards, so a typical resource shows a wall of empty boxes.

This filters ``DataSection`` entries down to the cards that actually hold a
tile for the resource being viewed. One extra query per request, against the
already-indexed ``tiles.nodegroupid``.

Only the drop-down is pruned. The card itself (slug ``search``) is left alone -
it is a fixed descriptor section, not data-driven.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

DATA_SECTION = "arches_modular_reports/ModularReport/components/DataSection"
EXPANDED_SLUG = "search_result_expanded"


def _populated_node_aliases(resourceinstanceid):
    """Aliases of nodes that hold a value for this resource."""
    from arches.app.models import models

    nodegroup_ids = set(
        models.TileModel.objects.filter(
            resourceinstance_id=resourceinstanceid
        ).values_list("nodegroup_id", flat=True)
    )
    if not nodegroup_ids:
        return set()

    return set(
        models.Node.objects.filter(nodegroup_id__in=nodegroup_ids)
        .exclude(alias__isnull=True)
        .exclude(alias="")
        .values_list("alias", flat=True)
    )


def prune_empty_sections(config, resourceinstanceid):
    """Return ``config`` with data sections that have no data removed.

    Non-DataSection components are always kept: they may render something
    useful without tile data, and we should not guess at their semantics.
    """
    components = config.get("components")
    if not components:
        return config

    populated = _populated_node_aliases(resourceinstanceid)

    kept = []
    for component in components:
        if component.get("component") != DATA_SECTION:
            kept.append(component)
            continue
        aliases = (component.get("config") or {}).get("node_aliases") or []
        # Keep a section if any of its nodes carries a value on this resource.
        if any(alias in populated for alias in aliases):
            kept.append(component)

    if len(kept) == len(components):
        return config

    pruned = dict(config)
    pruned["components"] = kept
    return pruned


def apply():
    """Wrap the modular report config view so the drop-down prunes itself."""
    if not getattr(settings, "CORAL_PRUNE_EMPTY_REPORT_SECTIONS", True):
        return

    import json

    from arches_modular_reports.app.views import modular_report

    view_class = getattr(modular_report, "ModularReportConfigView", None)
    if view_class is None or getattr(view_class.get, "_coral_pruned", False):
        return

    original_get = view_class.get

    def get(self, request):
        response = original_get(self, request)

        resourceinstanceid = request.GET.get("resourceId")
        slug = request.GET.get("report_config_slug")
        if (
            slug != EXPANDED_SLUG
            or not resourceinstanceid
            or getattr(response, "status_code", None) != 200
        ):
            return response

        try:
            config = json.loads(response.content)
            pruned = prune_empty_sections(config, resourceinstanceid)
            if pruned is config:
                return response
            response.content = json.dumps(pruned)
            if response.has_header("Content-Length"):
                response["Content-Length"] = str(len(response.content))
        except Exception:
            # A failure here must not cost the user their report - fall back to
            # the unpruned config.
            logger.exception(
                "coral.perf: could not prune report config for %s", resourceinstanceid
            )
            return response

        return response

    get._coral_pruned = True
    view_class.get = get
