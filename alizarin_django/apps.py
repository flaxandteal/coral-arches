"""
Django AppConfig for alizarin_django.

Responsibilities on `ready()`:
    - Eagerly import the wkrm registry (so settings.WELL_KNOWN_RESOURCE_MODELS
      is read once and cached). Graph slug resolution is deferred until first
      use to avoid DB queries during startup.
"""

from __future__ import annotations

import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AlizarinDjangoConfig(AppConfig):
    name = "alizarin_django"
    verbose_name = "Alizarin Django ORM"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self) -> None:
        try:
            from . import wkrm  # noqa: F401

            wkrm.prime_registry()
            logger.info(
                "alizarin_django: WKRM registry primed (%d models)",
                wkrm.wkrm_count(),
            )
        except Exception as exc:  # pragma: no cover
            logger.warning(
                "alizarin_django: failed to prime WKRM registry: %s", exc
            )
