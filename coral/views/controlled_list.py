import logging
from collections import defaultdict
from http import HTTPStatus
from itertools import islice

from arches.app.utils.response import JSONErrorResponse, JSONResponse
from arches_controlled_lists.models import List, ListItem, ListItemValue
from arches_controlled_lists.views import FilteredListView

logger = logging.getLogger(__name__)

LIMIT = 200


def _matching_ids(list_id, term):
    """Ids whose prefLabel contains `term`, best first: exact, then prefix, then the rest.

    Ranking decides which items survive the cap, so it has to happen over every
    match rather than over a page of them.
    """
    lowered = term.lower()

    def rank(label):
        label = label.lower()
        if label == lowered:
            return 0
        return 1 if label.startswith(lowered) else 2

    matches = (
        ListItemValue.objects.filter(
            list_item__list_id=list_id,
            valuetype_id="prefLabel",
            value__icontains=term,
        )
        .exclude(list_item__guide=True)
        .values_list("list_item_id", "value")
    )

    # An item carries one prefLabel per language, so it can match more than once.
    best = {}
    for item_id, label in matches:
        item_id = str(item_id)
        key = (rank(label), label.lower())
        if item_id not in best or key < best[item_id]:
            best[item_id] = key
    return sorted(best, key=best.get)


def _page_ids(list_id, start):
    """One page of the list in upstream's order: each item followed by its own children.

    The roots of Area Name are headings - Barony, Parish, Ward - so anything that
    separates one from its members reads as broken. Ordering by column can't
    express that, hence the walk; `islice` stops it once the page is filled.
    """
    children = defaultdict(list)
    for item_id, parent_id, sortorder in ListItem.objects.filter(
        list_id=list_id
    ).values_list("id", "parent_id", "sortorder"):
        children[parent_id].append((sortorder, item_id))
    for siblings in children.values():
        siblings.sort()

    def walk(parent_id):
        for _, item_id in children.get(parent_id, ()):
            yield str(item_id)
            yield from walk(item_id)

    return list(islice(walk(None), start, start + LIMIT + 1))


def _with_ancestors(ids):
    """`ids` plus every forebear, which the inherited parent-path helpers look up by id."""
    known = set(ids)
    frontier = known
    while frontier:
        parents = (
            ListItem.objects.filter(pk__in=frontier)
            .exclude(parent_id=None)
            .values_list("parent_id", flat=True)
        )
        frontier = {str(parent) for parent in parents} - known
        known |= frontier
    return known


class FilteredList(FilteredListView):
    """Filter a controlled list in the database rather than in Python.

    Upstream serializes the whole list before applying `?term=`, so searching
    the 9,635-item Administrative Area costs as much as loading it: ~1.8s and
    5.5MB per keystroke pause in a workflow dropdown.

    Registered ahead of `arches_controlled_lists.urls` in coral/urls.py; drop
    that line to go back to upstream.
    """

    def get(self, request, list_id):
        term = request.GET.get("term", "")
        try:
            start = (max(1, int(request.GET.get("page") or 1)) - 1) * LIMIT
            if term:
                window = _matching_ids(list_id, term)[start : start + LIMIT + 1]
            else:
                window = _page_ids(list_id, start)
                # A whole small list is what upstream is already good at.
                if not start and len(window) <= LIMIT:
                    return super().get(request, list_id)

            more = len(window) > LIMIT
            ids = window[:LIMIT]

            try:
                lst = List.objects.get(pk=list_id)
            except List.DoesNotExist:
                return JSONErrorResponse(status=HTTPStatus.NOT_FOUND)

            item_map = {
                str(item.pk): item.serialize(flat=True)
                for item in ListItem.objects.filter(
                    pk__in=_with_ancestors(ids)
                ).prefetch_related("list_item_values", "list_item_images")
            }
            lang = request.LANGUAGE_CODE
            for item in item_map.values():
                item["parent_ids"] = self._get_parent_ids(item, item_map)
                item["parent_path"] = self._get_parent_path(item, item_map, lang)
                item["depth"] = len(item["parent_ids"])

            return JSONResponse(
                {
                    "id": str(lst.id),
                    "name": lst.name,
                    "dynamic": lst.dynamic,
                    "searchable": lst.searchable,
                    "items": [item_map[i] for i in ids if i in item_map],
                    "more": more,
                }
            )
        except Exception:
            logger.exception("coral: fast controlled-list filter failed, using upstream")
            return super().get(request, list_id)
