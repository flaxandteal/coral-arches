"""
Django AppConfig for alizarin_django.

Replaces arches_orm.arches_django.apps.ArchesORMConfig in coral-arches's
INSTALLED_APPS.

Responsibilities on `ready()`:
    - Eagerly import the wkrm registry (so settings.WELL_KNOWN_RESOURCE_MODELS
      is read once and cached). The actual graph registration with alizarin is
      lazy — it happens the first time a wrapper class is asked for its model.
    - Optionally warm the alizarin RDM cache from Arches' Concept/Value tables
      (also lazy — only triggered the first time a concept lookup needs it).
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
        # Importing wkrm at ready time validates that
        # settings.WELL_KNOWN_RESOURCE_MODELS exists and is parseable, but does
        # NOT touch the DB. Graph registration is deferred until first use.
        try:
            from . import wkrm  # noqa: F401

            wkrm.prime_registry()
            logger.info(
                "alizarin_django: WKRM registry primed (%d models)",
                wkrm.wkrm_count(),
            )
        except Exception as exc:  # pragma: no cover
            # Don't crash app startup if WKRMs are misconfigured — log and let
            # individual call sites surface the error.
            logger.warning(
                "alizarin_django: failed to prime WKRM registry: %s", exc
            )
