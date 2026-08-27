"""Rank search results by how well the name descriptor matches.

arches_search has no relevance ordering. ``SortResolver.DEFAULT_SORT`` is empty
and ``apply()`` always ends with ``F("resourceinstanceid").asc()``, so with no
sort chosen the results come back in UUID order - effectively random. Matching
itself is a boolean filter (``Q(search_vector=...) | Q(value__icontains=...)``),
so nothing scores a row and nothing can order by it.

This adds a default ordering that puts descriptor matches first:

    0  name is exactly the search text
    1  name starts with it
    2  name contains it
    3  everything else (matched on some other node)

Within a tier, results are ordered by name so the list is stable and readable,
then by id so pagination is deterministic.

Ranking off ``ResourceInstance.descriptors`` rather than TermSearch is
deliberate: the descriptor is the string the user sees in the result, so
ranking on it is exactly "did the thing I typed match the title". It also
avoids a join, and works whether or not the descriptor terms have been indexed.

An explicit sort in the request payload still wins - this only fills the gap
where the user has not chosen one.
"""

import logging
import threading

from django.conf import settings

logger = logging.getLogger(__name__)

_state = threading.local()

RELEVANCE = "coral_descriptor_relevance"


def remember_terms(body):
    """Stash the request's search text where the sort resolver can reach it.

    The resolver is constructed with only the sort spec, so the term has to be
    carried across from the queryset builder, which runs first in the same
    request and thread.
    """
    terms = body.get("terms") or []
    texts = [
        str(term.get("text", "")).strip()
        for term in terms
        if isinstance(term, dict) and str(term.get("text", "")).strip()
    ]
    _state.term_text = " ".join(texts).strip().lower() or None


def current_term():
    return getattr(_state, "term_text", None)


def relevance_ordering(queryset, term_text):
    """Annotate a descriptor-match tier and return (queryset, order_expressions)."""
    from django.db.models import Case, Func, IntegerField, TextField, Value, When
    from django.db.models.fields.json import KeyTextTransform
    from django.db.models.functions import Coalesce, Lower
    from django.utils.translation import get_language

    language = get_language() or "en"

    # output_field is required: KeyTextTransform is a TextField and Value("")
    # a CharField, and Coalesce refuses to guess between them.
    # Descriptors in this data routinely end in trailing spaces AND a newline
    # ("HB07/02/002 I: 51 HILLMOUNT ROAD  \n"). Django's Trim is Postgres btrim,
    # which strips spaces only - the newline blocks it and the exact tier never
    # fires. Pass an explicit character set instead.
    name = Func(
        Lower(
        Coalesce(
            KeyTextTransform("name", KeyTextTransform(language, "descriptors")),
            Value("", output_field=TextField()),
            output_field=TextField(),
        )
        ),
        Value(" \t\r\n"),
        function="BTRIM",
        output_field=TextField(),
    )

    queryset = queryset.annotate(**{f"{RELEVANCE}_name": name})
    queryset = queryset.annotate(
        **{
            RELEVANCE: Case(
                When(**{f"{RELEVANCE}_name": term_text}, then=Value(0)),
                When(**{f"{RELEVANCE}_name__startswith": term_text}, then=Value(1)),
                When(**{f"{RELEVANCE}_name__contains": term_text}, then=Value(2)),
                default=Value(3),
                output_field=IntegerField(),
            )
        }
    )
    return queryset, [RELEVANCE, f"{RELEVANCE}_name"]


def apply():
    """Make descriptor relevance the default ordering for simple search."""
    if not getattr(settings, "CORAL_DESCRIPTOR_RELEVANCE_SORT", True):
        return

    from arches_search.utils.search_queryset import SimpleSearchQuerysetBuilder
    from arches_search.utils.search_sort import SortResolver

    if getattr(SortResolver.apply, "_coral_relevance", False):
        return

    # 1. Capture the search text as the builder is constructed.
    original_init = SimpleSearchQuerysetBuilder.__init__

    def __init__(self, body):
        try:
            remember_terms(body)
        except Exception:
            logger.exception("coral: could not read search terms for ranking")
            _state.term_text = None
        original_init(self, body)

    SimpleSearchQuerysetBuilder.__init__ = __init__

    # 2. Order by descriptor relevance when the caller supplied no sort.
    original_apply = SortResolver.apply

    def apply_sort(self, queryset):
        term_text = current_term()
        if self.sort_specs or not term_text:
            return original_apply(self, queryset)

        from django.db.models import F

        try:
            queryset, ordering = relevance_ordering(queryset, term_text)
        except Exception:
            logger.exception("coral: could not build relevance ordering")
            return original_apply(self, queryset)

        return queryset.order_by(*ordering, F("resourceinstanceid").asc())

    apply_sort._coral_relevance = True
    SortResolver.apply = apply_sort
