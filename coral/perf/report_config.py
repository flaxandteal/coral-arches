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

The drop-down and the ``default`` report are pruned; the ``default`` report
nests its sections in tabs, so pruning recurses through them. The card itself
(slug ``search``) is left alone - it is a fixed descriptor section, not
data-driven.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

DATA_SECTION = "arches_modular_reports/ModularReport/components/DataSection"
REPORT_TABS = "arches_modular_reports/ModularReport/components/ReportTabs"
LINKED_SECTIONS = "arches_modular_reports/ModularReport/components/LinkedSections"
RELATED_SECTION = (
    "arches_modular_reports/ModularReport/components/RelatedResourcesSection"
)
PRUNED_SLUGS = {"search_result_expanded", "default"}


def _populated_node_aliases(resourceinstanceid):
    """Aliases of nodes that hold a non-empty value for this resource."""
    from arches.app.models import models

    node_ids = set()
    tiles = models.TileModel.objects.filter(resourceinstance_id=resourceinstanceid)
    for data in tiles.values_list("data", flat=True):
        for node_id, value in (data or {}).items():
            if value not in (None, "", [], {}):
                node_ids.add(node_id)

    return set(
        models.Node.objects.filter(nodeid__in=node_ids)
        .exclude(alias__isnull=True)
        .exclude(alias="")
        .values_list("alias", flat=True)
    )


def _related_graph_slugs(resourceinstanceid):
    """Slugs of the graphs this resource is related to, in either direction."""
    from django.db.models import Q

    from arches.app.models import models

    relations = models.ResourceXResource.objects.filter(
        Q(from_resource=resourceinstanceid) | Q(to_resource=resourceinstanceid)
    ).values_list(
        "from_resource_id", "from_resource_graph__slug", "to_resource_graph__slug"
    )
    return {
        to_slug if str(from_id) == str(resourceinstanceid) else from_slug
        for from_id, from_slug, to_slug in relations
    }


def _prune_components(components, populated, related=None):
    """Drop empty DataSections, recursing into tabs and linked sections.

    ``related`` is the set of related graph slugs for the ``default`` report,
    which also goes read-only and shows only populated columns. ``None`` leaves
    related-resource sections and columns alone.
    """
    kept = []
    for component in components:
        name = component.get("component")
        config = component.get("config") or {}
        if name == DATA_SECTION:
            # Keep a section if any of its nodes carries a value on this resource.
            aliases = config.get("node_aliases") or []
            populated_aliases = [alias for alias in aliases if alias in populated]
            if not populated_aliases:
                continue
            if related is None:
                kept.append(component)
            else:
                config = {
                    **config,
                    "node_aliases": populated_aliases,
                    "has_write_permission": False,
                }
                kept.append({**component, "config": config})
        elif name == RELATED_SECTION and related is not None:
            if config.get("graph_slug") in related:
                kept.append(component)
        elif name == REPORT_TABS:
            tabs = _prune_groups(config.get("tabs") or [], populated, related)
            if tabs:
                kept.append({**component, "config": {**config, "tabs": tabs}})
        elif name == LINKED_SECTIONS:
            sections = _prune_groups(config.get("sections") or [], populated, related)
            if sections:
                kept.append({**component, "config": {**config, "sections": sections}})
        else:
            kept.append(component)
    return kept


def _prune_groups(groups, populated, related=None):
    """Prune each tab or section's components, dropping the ones left empty."""
    pruned = []
    for group in groups:
        components = _prune_components(group.get("components") or [], populated, related)
        if components:
            pruned.append({**group, "components": components})
    return pruned


def prune_empty_sections(config, resourceinstanceid, slug="default"):
    """Return ``config`` with data sections that have no data removed.

    Non-DataSection components are always kept: they may render something
    useful without tile data, and we should not guess at their semantics.
    """
    components = config.get("components")
    if not components:
        return config

    related = _related_graph_slugs(resourceinstanceid) if slug == "default" else None
    kept = _prune_components(
        components, _populated_node_aliases(resourceinstanceid), related
    )
    if kept == components:
        return config

    return {**config, "components": kept}


def _plain_controlled_lists(modular_report):
    """Show concept and reference values as text: their list-item URIs do not resolve."""
    original = modular_report.build_valueid_annotation
    if getattr(original, "_coral_plain", False):
        return

    def build_valueid_annotation(data, is_user_rdm_admin, user_language):
        if data.get("datatype") in ("concept", "concept-list", "reference"):
            is_user_rdm_admin = False
        return original(data, is_user_rdm_admin, user_language)

    build_valueid_annotation._coral_plain = True
    modular_report.build_valueid_annotation = build_valueid_annotation


def apply():
    """Wrap the modular report config view so the drop-down prunes itself."""
    if not getattr(settings, "CORAL_PRUNE_EMPTY_REPORT_SECTIONS", True):
        return

    import json

    from arches_modular_reports.app.views import modular_report

    _plain_controlled_lists(modular_report)

    view_class = getattr(modular_report, "ModularReportConfigView", None)
    if view_class is None or getattr(view_class.get, "_coral_pruned", False):
        return

    original_get = view_class.get

    def get(self, request):
        response = original_get(self, request)

        resourceinstanceid = request.GET.get("resourceId")
        slug = request.GET.get("report_config_slug", "default")
        if (
            slug not in PRUNED_SLUGS
            or not resourceinstanceid
            or getattr(response, "status_code", None) != 200
        ):
            return response

        try:
            config = json.loads(response.content)
            pruned = prune_empty_sections(config, resourceinstanceid, slug)
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
