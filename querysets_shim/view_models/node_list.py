"""NodeListViewModel — list of related nodes/tiles."""

from __future__ import annotations

from collections import UserList
from typing import Any, Iterable, Optional

from ._base import ViewModel


class NodeListViewModel(UserList, ViewModel):
    """A list of semantic nodes exposed under a single alias."""

    def __init__(self, items: Optional[Iterable[Any]] = None) -> None:
        UserList.__init__(self)
        if items:
            self.extend(list(items))
