"""Work out a user's searchable graphs in one query.

Core ``get_permitted_graphids`` loads every Node in the permitted nodegroups as a
model instance (~17,000 here) just to read ``graph_id``, and every search request
calls it twice. Measured: 0.5-0.8s per call; the values-only query below returns
the same graph ids in 0.01-0.03s. Every resource picker keystroke pays this.

Set ``CORAL_FAST_PERMITTED_GRAPHIDS = False`` to restore upstream behaviour.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def apply():
    if not getattr(settings, "CORAL_FAST_PERMITTED_GRAPHIDS", True):
        return

    from arches.app.models.models import GraphModel, Node
    from arches.app.search.components import resource_type_filter

    if getattr(resource_type_filter.get_permitted_graphids, "_coral_fast", False):
        return

    original = resource_type_filter.get_permitted_graphids

    def get_permitted_graphids(permitted_nodegroups):
        try:
            return set(
                str(graphid)
                for graphid in GraphModel.objects.filter(
                    graphid__in=Node.objects.filter(nodegroup__in=permitted_nodegroups).values("graph_id")
                )
                .exclude(is_active=False)
                .values_list("graphid", flat=True)
            )
        except Exception:
            logger.exception("coral: fast permitted graph ids failed, using upstream")
            return original(permitted_nodegroups)

    get_permitted_graphids._coral_fast = True
    resource_type_filter.get_permitted_graphids = get_permitted_graphids

    # search_results.py did `from ... import get_permitted_graphids`, so it holds its own reference.
    try:
        from arches.app.search.components import search_results

        search_results.get_permitted_graphids = get_permitted_graphids
    except Exception:
        logger.exception("coral: could not rebind get_permitted_graphids on search_results")
