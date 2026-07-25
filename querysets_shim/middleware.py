"""
Django middleware that pushes the current request.user onto the querysets_shim
permission context for the duration of the request.

Replaces arches_orm.arches_django.middleware.ArchesORMContextMiddleware in
coral-arches settings.MIDDLEWARE.
"""

from __future__ import annotations

from typing import Any, Callable

from django.http import HttpRequest, HttpResponse

from .adapter import context


class QuerysetsShimContextMiddleware:
    """
    Wrap each request in `querysets_shim.adapter.context(user=request.user)`.

    The context is a ContextVar, so anything called from within a view will
    see the right user when it asks `querysets_shim.adapter.get_user()`.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        user: Any = getattr(request, "user", None)
        with context(user=user):
            return self.get_response(request)
