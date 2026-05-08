"""
Permission/user context for alizarin_django.

Mirrors arches_orm.adapter:
    - admin() context manager — sets the active user to None (bypass perms)
    - context_free decorator — runs a function with user=None
    - get_user() / set_user() — current request user

Backed by a contextvars.ContextVar so it works correctly across threads and
async tasks (same approach as arches_orm).
"""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from functools import wraps
from typing import Any, Callable, Iterator, Optional, TypeVar

# A None value means "admin / no user / bypass permission checks".
# An Unset sentinel means "no context has been pushed yet" — distinguished from
# None so that views which forget to set context don't accidentally get admin.
class _Unset:
    def __repr__(self) -> str:  # pragma: no cover
        return "<unset>"


_UNSET: Any = _Unset()

_user_var: ContextVar[Any] = ContextVar("alizarin_django_user", default=_UNSET)


def get_user() -> Optional[Any]:
    """
    Return the current request user, or None if running as admin / unset.

    Returns None in two cases:
        - admin() / context_free() pushed None
        - no context has been pushed (treated as anonymous)
    """
    val = _user_var.get()
    if val is _UNSET:
        return None
    return val


def set_user(user: Optional[Any]) -> Any:
    """Set the current user, returning a token usable with `reset_user`."""
    return _user_var.set(user)


def reset_user(token: Any) -> None:
    """Reset the user context to its previous value (token from set_user)."""
    _user_var.reset(token)


def is_admin_context() -> bool:
    """True iff the current context is explicitly admin (user is None and set)."""
    val = _user_var.get()
    return val is None  # set to None explicitly; _UNSET would mean unset


@contextmanager
def admin() -> Iterator[None]:
    """
    Run a block as 'admin' — bypass all permission checks.

    Usage:
        with admin():
            person = Person.find(some_id)
            person.save()
    """
    token = _user_var.set(None)
    try:
        yield
    finally:
        _user_var.reset(token)


F = TypeVar("F", bound=Callable[..., Any])


def context_free(fn: F) -> F:
    """
    Decorator: run the function as admin (no permission context).

    Equivalent to wrapping the body in `with admin():`.
    """

    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        with admin():
            return fn(*args, **kwargs)

    return wrapper  # type: ignore[return-value]


@contextmanager
def context(user: Optional[Any] = None) -> Iterator[None]:
    """
    Push an explicit user onto the context stack.

    Used by AlizarinDjangoContextMiddleware to wrap each request.
    """
    token = _user_var.set(user)
    try:
        yield
    finally:
        _user_var.reset(token)


__all__ = [
    "admin",
    "context",
    "context_free",
    "get_user",
    "set_user",
    "reset_user",
    "is_admin_context",
]
