"""Resource view models — ResourceInstance / RelatedResourceInstanceList."""

from __future__ import annotations

from collections import UserList
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


class RelatedResourceInstanceListViewModel(UserList, ViewModel):
    """A list of ResourceInstanceViewModel entries."""

    def __init__(self, items: Optional[Iterable[Any]] = None) -> None:
        UserList.__init__(self)
        if items:
            self.extend(list(items))
