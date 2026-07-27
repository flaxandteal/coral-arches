"""Defer Elasticsearch re-indexing off the tile save/delete request path.

Arches re-indexes the whole resource synchronously inside `Tile.save()` and
`Tile.delete()`. Measured on coral that costs ~270ms per tile save, and a
workflow step saving four tiles pays it four times over — re-indexing the same
resource each time, so three of the four are redundant anyway.

This is applied as a patch from `CoralConfig.ready()` rather than as a change to
arches itself, so the project carries the fix without a fork. It replaces one
well-defined method; if arches' own `Tile.save()` gains deferral upstream, this
becomes a no-op worth deleting.

Trade-off: search becomes eventually consistent. A resource is not guaranteed to
be findable the instant its tile save returns. Nothing in the coral workflows
searches for a resource it has just written, which is what makes this safe here.
"""

import logging

logger = logging.getLogger(__name__)


def patch_tile_index():
    from django.db import transaction
    from arches.app.models.tile import Tile
    from arches.app.utils import task_management

    from coral.tasks import index_resource_instance

    if getattr(Tile.index, "_coral_defers_indexing", False):
        return  # already patched; ready() can run more than once

    original_index = Tile.index

    def deferred_index(self, resource=None):
        """Hand re-indexing to a celery worker, or do it inline if there is none."""

        if not task_management.check_if_celery_available():
            return original_index(self, resource=resource)

        resource_id = str(self.resourceinstance_id)
        # Deferred to on_commit because the worker re-reads the resource from
        # the database — it must not start before this transaction lands.
        transaction.on_commit(
            lambda: index_resource_instance.delay(resource_id)
        )

    deferred_index._coral_defers_indexing = True
    Tile.index = deferred_index
