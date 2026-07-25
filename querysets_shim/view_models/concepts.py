"""Concept view models — minimal isinstance-compatible shims.

coral-arches only uses these for isinstance() checks and simple attribute
access (`.text`, `.value`, iteration for list types). Full RDM-backed
behaviour from arches_orm is not reproduced — the Arches concepts API is
available if code actually needs to dereference IDs.
"""

from __future__ import annotations

from typing import Any, Iterable, Optional

from ._base import ViewModel


class CollectionChild:
    """Minimal CollectionChild mixin (kept for isinstance compatibility)."""

    _collection_id: Optional[str] = None


class EmptyConceptValueViewModel(CollectionChild, ViewModel):
    """A concept-value slot with no concept set."""

    def __bool__(self) -> bool:
        return False

    def __hash__(self) -> int:
        return hash(None)

    def __eq__(self, other: Any) -> bool:
        return other is None or isinstance(other, EmptyConceptValueViewModel)


class ConceptValueReference:
    """Lazy lookup wrapper — returned by `.value` on ConceptValueViewModel."""

    __slots__ = ("value", "language", "concept_id")

    def __init__(
        self,
        value: str = "",
        language: Optional[str] = None,
        concept_id: Optional[str] = None,
    ) -> None:
        self.value = value
        self.language = language
        self.concept_id = concept_id


class ConceptValueViewModel(str, CollectionChild, ViewModel):
    """Wraps a single concept value.

    Subclasses str so it behaves like the concept-value UUID in string context
    — matches the arches_orm contract. `.text` / `.value` / `.lang` return the
    label text, a lookup object, and the language respectively.
    """

    _concept_value_id: str
    _text: str
    _language: Optional[str]
    _concept_id: Optional[str]

    def __new__(
        cls,
        concept_value_id: Any = "",
        text: str = "",
        language: Optional[str] = None,
        concept_id: Optional[str] = None,
        collection_id: Optional[str] = None,
    ) -> "ConceptValueViewModel":
        inst = super().__new__(cls, str(concept_value_id))
        inst._concept_value_id = str(concept_value_id)
        inst._text = text or str(concept_value_id)
        inst._language = language
        inst._concept_id = concept_id
        inst._collection_id = collection_id
        return inst

    def __hash__(self) -> int:
        return hash(self._concept_value_id)

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, ConceptValueViewModel):
            return self._concept_value_id == other._concept_value_id
        return str.__eq__(self, other)

    @property
    def text(self) -> str:
        return self._text

    @property
    def lang(self) -> Optional[str]:
        return self._language

    @property
    def conceptid(self) -> Optional[str]:
        return self._concept_id

    @property
    def value(self) -> ConceptValueReference:
        return ConceptValueReference(
            value=self._text,
            language=self._language,
            concept_id=self._concept_id,
        )

    def __str__(self) -> str:
        return self._text


class ConceptListValueViewModel(list, ViewModel, CollectionChild):
    """Wraps a list of concept values."""

    def __init__(
        self,
        items: Optional[Iterable[Any]] = None,
        collection_id: Optional[str] = None,
    ) -> None:
        list.__init__(self)
        self._collection_id = collection_id
        if items:
            for item in items:
                self.append(item)

    @property
    def data(self) -> list:
        return list(self)

    def append(self, item: Any) -> None:
        if not isinstance(item, ConceptValueViewModel):
            item = ConceptValueViewModel(item)
        super().append(item)
