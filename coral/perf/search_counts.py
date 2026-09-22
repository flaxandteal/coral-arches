"""Make the search result-type counts cheap.

``build_resource_type_counts`` is what makes an arches_search query take over a
minute. Measured on this dataset, a term matching **27 resources** took **74s**,
with every other step of the request under 0.1s.

The cost is structural, not volume-related. For each of the 32 resource models
it calls ``get_related_resources_by_text``, which walks up to two hops through
``resource_x_resource`` (333,586 rows) via chained ``IN (subquery)`` clauses,
then unions all 32 querysets and pulls every row into Python for ``Counter``.
32 two-hop graph traversals to produce 32 integers.

The traversal cannot simply be hoisted out of the loop: each hop excludes
resources *of the target graph* so a path never passes through the graph being
counted, which makes the reachable set genuinely per-target-graph.

So this counts **direct term matches only**, in one SQL ``GROUP BY`` - exactly
what the function's own no-terms branch already does.

WHAT CHANGES
    A chip's count no longer includes resources reached only by relationship.
    Numbers get smaller, and can be smaller than the list you see after
    clicking a chip, because the graph-filtered search still traverses.

WHAT IMPROVES
    ``all_resource_count`` was already computed from direct matches only
    (``type_agnostic_queryset.count()``) while the per-graph counts included
    traversal, so the total and the chips never agreed. Now they do.

Set ``CORAL_FAST_RESOURCE_TYPE_COUNTS = False`` to restore upstream behaviour
and the 74 seconds.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def apply():
    if not getattr(settings, "CORAL_FAST_RESOURCE_TYPE_COUNTS", True):
        return

    from django.db.models import Count

    from arches.app.models.models import GraphModel
    from arches_search.utils import search_queryset as sq

    if getattr(sq.build_resource_type_counts, "_coral_fast", False):
        return

    original = sq.build_resource_type_counts

    def build_resource_type_counts(terms, type_agnostic_queryset):
        try:
            graphs = list(
                GraphModel.objects.filter(isresource=True, is_active=True)
                .exclude(slug="arches_system_settings")
                .values("graphid", "name", "iconclass")
            )

            # One GROUP BY over the matched resources, whether or not there are
            # terms - the queryset already encodes the term filter.
            counts_by_graph_id = dict(
                type_agnostic_queryset.values_list("graph_id").annotate(
                    count=Count("resourceinstanceid")
                )
            )
            all_resource_count = sum(counts_by_graph_id.values())

            return [
                {
                    "graph_id": str(graph["graphid"]),
                    "name": graph["name"],
                    "icon": graph["iconclass"],
                    "count": counts_by_graph_id.get(graph["graphid"], 0),
                }
                for graph in graphs
            ], all_resource_count
        except Exception:
            # Never lose the search over a counting shortcut.
            logger.exception("coral: fast resource-type counts failed, using upstream")
            return original(terms, type_agnostic_queryset)

    build_resource_type_counts._coral_fast = True
    sq.build_resource_type_counts = build_resource_type_counts

    # simple_search.py did `from ... import build_resource_type_counts`, so the
    # view holds its own reference and has to be rebound too.
    try:
        from arches_search.views.api import simple_search

        simple_search.build_resource_type_counts = build_resource_type_counts
    except Exception:
        logger.exception("coral: could not rebind build_resource_type_counts on the view")
