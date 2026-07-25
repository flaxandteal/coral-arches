"""
Sync↔async bridge — retained for import compatibility.

Previously bridged alizarin's async API to sync Django code. No longer needed
since arches-querysets is fully synchronous.
"""

from __future__ import annotations

import asyncio
from typing import Awaitable, TypeVar

T = TypeVar("T")


def run_sync(awaitable: Awaitable[T]) -> T:
    """Run an awaitable to completion from sync code."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(awaitable)
    finally:
        loop.close()


__all__ = ["run_sync"]
