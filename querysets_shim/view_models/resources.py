"""Resource view models — ResourceInstance / RelatedResourceInstanceList."""

from __future__ import annotations

from typing import Any, Iterable, Optional

from ._base import ViewModel


class ResourceInstanceViewModel(ViewModel):
    """Reference to another resource instance (related-resource slot)."""

    def __init__(
        self,
        resource_id: Optional[str] = None,
        graph_id: Optional[str] = None,
        display_value: str = "",
        instance: Any = None,
    ) -> None:
        self._resource_id = str(resource_id) if resource_id else None
        self._graph_id = str(graph_id) if graph_id else None
        self._display = display_value
        self._instance = instance

    @property
    def id(self) -> Optional[str]:
        return self._resource_id

    @property
    def graph_id(self) -> Optional[str]:
        return self._graph_id

    def __str__(self) -> str:
        return self._display or (self._resource_id or "")

    def __bool__(self) -> bool:
        return self._resource_id is not None


class RelatedResourceInstanceListViewModel(list, ViewModel):
    """A list of ResourceInstanceViewModel entries."""

    def __init__(self, items: Optional[Iterable[Any]] = None) -> None:
        list.__init__(self)
        if items:
            self.extend(list(items))

    @property
    def data(self) -> list:
        return list(self)


class SingleRelatedResourceInstanceViewModel(RelatedResourceInstanceListViewModel):
    """A single-valued `resource-instance` node — list-like *and* scalar-like.

    Arches stores `resource-instance` and `resource-instance-list` in the same
    shape (a JSON array), and `_vm_to_tile_value` already writes both back as an
    array, but arches-querysets normalises the single case to a scalar on read.
    Callers are split on which they expect: `coral/permissions/casbin.py:265`
    iterates `permission.object`, while other readers treat a single reference
    as the resource itself.

    Rather than break one to serve the other, this behaves as a 0-or-1 element
    list and delegates attribute access to that element, so `for obj in x`,
    `x.id` and `bool(x)` all do the sensible thing.
    """

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(name)
        if not len(self):
            raise AttributeError(name)
        return getattr(self[0], name)

    def __str__(self) -> str:
        return str(self[0]) if len(self) else ""
