"""Rebuild arches_search descriptor terms for every resource.

    python manage.py index_descriptors

Ports the bulk half of flaxandteal/arches-search@scm/index-descriptors as a
Coral command, so `arches_search reindex_database` does not have to be patched.
Run it after a full arches_search reindex, or on its own to repair descriptors.
"""

import time

from django.core.management.base import BaseCommand

from coral.perf.descriptor_indexing import reindex_all


class Command(BaseCommand):
    help = "Index resource descriptors into the arches_search term index."

    def add_arguments(self, parser):
        parser.add_argument("--batch-size", type=int, default=None)

    def handle(self, *args, **options):
        from arches_search.models.models import TermSearch

        from coral.search_indexes.descriptor_indexer import DESCRIPTOR_NODE_ALIAS

        start = time.perf_counter()
        count = reindex_all(stdout=self.stdout, batch_size=options["batch_size"])
        rows = TermSearch.objects.filter(node_alias=DESCRIPTOR_NODE_ALIAS).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"indexed descriptors for {count} resources "
                f"({rows} term rows) in {time.perf_counter() - start:.1f}s"
            )
        )
