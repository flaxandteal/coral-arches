"""StringViewModel — translatable string."""

from __future__ import annotations

from typing import Any, Optional

from ._base import ViewModel


class StringViewModel(str, ViewModel):
    """Wraps a localized string. `.lang(code)` re-translates."""

    _value: dict
    _default_language: Optional[str]

    def __new__(
        cls,
        value: Any = "",
        language: Optional[str] = None,
    ) -> "StringViewModel":
        if isinstance(value, dict):
            display = _flatten(value, language)
            source = value
        else:
            display = str(value) if value is not None else ""
            source = {language or "en": {"value": display}}
        inst = super().__new__(cls, display)
        inst._value = source
        inst._default_language = language
        return inst

    def lang(self, language: Optional[str]) -> str:
        return _flatten(self._value, language)


def _flatten(value: dict, language: Optional[str]) -> str:
    """Pull a display string out of Arches' localized-string shape."""
    if not isinstance(value, dict):
        return str(value) if value is not None else ""
    if language and language in value:
        entry = value[language]
        if isinstance(entry, dict):
            return str(entry.get("value", ""))
        return str(entry)
    for lang in ("en", "en-US"):
        if lang in value:
            entry = value[lang]
            if isinstance(entry, dict):
                return str(entry.get("value", ""))
            return str(entry)
    for entry in value.values():
        if isinstance(entry, dict) and "value" in entry:
            return str(entry["value"])
        if isinstance(entry, str):
            return entry
    return ""
