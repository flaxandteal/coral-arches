"""SemanticViewModel — a nested tile with child fields."""

from __future__ import annotations

from typing import Any, Dict, Iterator, Mapping

from ._base import ViewModel


class SemanticViewModel(ViewModel, Mapping[str, Any]):
    """Wraps a semantic (nested) tile as a Mapping."""

    def __init__(self, data: Any = None) -> None:
        self._data: Dict[str, Any] = dict(data) if isinstance(data, dict) else {}

    def __getitem__(self, key: str) -> Any:
        return self._data[key]

    def __iter__(self) -> Iterator[str]:
        return iter(self._data)

    def __len__(self) -> int:
        return len(self._data)

    def __getattr__(self, key: str) -> Any:
        if key.startswith("_"):
            raise AttributeError(key)
        try:
            return self._data[key]
        except KeyError as e:
            raise AttributeError(key) from e

    def get_children(self, direct: Any = None) -> list:
        return [v for v in self._data.values() if v is not None]
