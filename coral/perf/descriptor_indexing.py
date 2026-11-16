"""Index resource descriptors into arches_search's term index.

Ports the hook half of flaxandteal/arches-search@scm/index-descriptors. The
indexer itself is vendored at ``coral/search_indexes/descriptor_indexer.py``;
this module wires it into the two places the fork patches:

* ``SearchIndexingFunction.post_save`` - so a tile save refreshes the
  resource's descriptor terms, on commit.
* the bulk pass - exposed here as ``reindex_all`` and driven by
  ``manage.py index_descriptors`` rather than by patching arches_search's own
  management command.

Why the descriptor needs indexing at all: a resource is often identified by a
value that never reaches TermSearch. A primary reference number is a ``number``
node, so it indexes into NumericSearch and the resource cannot be found by
typing it. The descriptor carries that text, so indexing the descriptor makes
those resources findable.

Remove this module, the vendored indexer, and the settings flag once the change
is in a released arches-search.
"""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def apply():
    """Refresh descriptor terms whenever a tile is saved."""
    if not getattr(settings, "CORAL_INDEX_DESCRIPTORS", True):
        return

    from django.db import transaction

    from arches.app.models.resource import Resource
    from arches_search.functions.search_indexing import SearchIndexingFunction

    from coral.search_indexes.descriptor_indexer import index_resource_descriptors

    if getattr(SearchIndexingFunction.post_save, "_coral_descriptors", False):
        return

    original_post_save = SearchIndexingFunction.post_save

    def post_save(self, *args, **kwargs):
        result = original_post_save(self, *args, **kwargs)

        tile = args[0]
        resourceinstanceid = tile.resourceinstance_id

        def index():
            try:
                index_resource_descriptors(
                    Resource.objects.select_related("graph").get(
                        pk=resourceinstanceid
                    )
                )
            except Exception:
                # Indexing must never cost the user their edit - the tile is
                # already committed by the time this runs.
                logger.exception(
                    "coral: could not index descriptors for %s", resourceinstanceid
                )

        transaction.on_commit(index)
        return result

    post_save._coral_descriptors = True
    SearchIndexingFunction.post_save = post_save


def reindex_all(stdout=None, batch_size=None):
    """Rebuild descriptor terms for every resource. Returns the resource count.

    Deletes each resource's existing descriptor rows as it goes, so this is safe
    to run against an already-populated index - unlike the fork's version, which
    appends because it runs immediately after a full wipe-and-rebuild.
    """
    from arches.app.models.resource import Resource
    from arches.app.models.system_settings import settings as system_settings
    from arches_search.models.models import TermSearch

    from coral.search_indexes.descriptor_indexer import (
        DESCRIPTOR_NODE_ALIAS,
        build_descriptor_terms,
    )

    batch_size = batch_size or getattr(system_settings, "INDEX_BATCH_SIZE", 1000)

    TermSearch.objects.filter(node_alias=DESCRIPTOR_NODE_ALIAS).delete()

    batch = []
    count = 0
    for resource in (
        Resource.objects.exclude(
            graph_id=system_settings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID
        )
        .select_related("graph")
        .iterator(chunk_size=batch_size)
    ):
        batch.extend(build_descriptor_terms(resource))
        count += 1
        if len(batch) >= batch_size:
            TermSearch.objects.bulk_create(batch, batch_size=batch_size)
            batch = []
        if stdout and count % (batch_size * 10) == 0:
            stdout.write(f"  {count} resources...")

    if batch:
        TermSearch.objects.bulk_create(batch, batch_size=batch_size)

    return count
