"""
Sync↔async bridge.

alizarin's high-level Python layer (ResourceInstanceWrapper, SemanticViewModel,
PseudoValue.get_value, …) is async. coral-arches is sync Django code.

`run_sync(coro)` runs a coroutine to completion synchronously, regardless of
whether an event loop is already running on the current thread. We use a
dedicated background loop kept alive in a worker thread, so calling code never
needs to care.

This is heavier than asyncio.run but it works in *all* contexts:
    - sync Django view (no loop) → schedules on the worker
    - async ASGI handler (loop running) → schedules on the worker (avoids
      "asyncio.run() cannot be called from a running event loop")
    - inside another sync_bridge.run_sync() call → reuses the same worker loop
"""

from __future__ import annotations

import asyncio
import threading
from concurrent.futures import Future
from typing import Any, Awaitable, TypeVar

T = TypeVar("T")

_loop: asyncio.AbstractEventLoop | None = None
_loop_thread: threading.Thread | None = None
_loop_lock = threading.Lock()


def _ensure_loop() -> asyncio.AbstractEventLoop:
    """Lazily start a background event loop in a daemon thread."""
    global _loop, _loop_thread
    if _loop is not None and _loop.is_running():
        return _loop
    with _loop_lock:
        if _loop is not None and _loop.is_running():
            return _loop
        _loop = asyncio.new_event_loop()
        ready = threading.Event()

        def _run() -> None:
            asyncio.set_event_loop(_loop)
            ready.set()
            _loop.run_forever()  # type: ignore[union-attr]

        _loop_thread = threading.Thread(
            target=_run,
            name="alizarin-django-sync-bridge",
            daemon=True,
        )
        _loop_thread.start()
        ready.wait()
        return _loop  # type: ignore[return-value]


def run_sync(awaitable: Awaitable[T]) -> T:
    """
    Run an awaitable to completion from sync code.

    Safe to call from any thread, regardless of whether an event loop is
    running on it.
    """
    loop = _ensure_loop()
    fut: Future[T] = asyncio.run_coroutine_threadsafe(_to_coro(awaitable), loop)
    return fut.result()


async def _to_coro(awaitable: Awaitable[T]) -> T:
    """Coroutine adapter — accepts any awaitable (coroutine, future, task)."""
    return await awaitable


__all__ = ["run_sync"]
