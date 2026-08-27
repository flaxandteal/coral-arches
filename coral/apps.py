from django.apps import AppConfig
from django.conf import settings


class CoralConfig(AppConfig):
    name = "coral"
    is_arches_application = True

    def ready(self):
        # Prune empty sections from the arches_search result drop-down.
        if getattr(settings, "CORAL_PRUNE_EMPTY_REPORT_SECTIONS", True):
            from coral.perf import report_config

            report_config.apply()

        # Index resource descriptors into the arches_search term index.
        if getattr(settings, "CORAL_INDEX_DESCRIPTORS", True):
            from coral.perf import descriptor_indexing

            descriptor_indexing.apply()

        # Rank simple-search results by descriptor match, exact first.
        if getattr(settings, "CORAL_DESCRIPTOR_RELEVANCE_SORT", True):
            from coral.perf import search_sort

            search_sort.apply()

        # Compute search result-type counts in SQL instead of 32 graph traversals.
        if getattr(settings, "CORAL_FAST_RESOURCE_TYPE_COUNTS", True):
            from coral.perf import search_counts

            search_counts.apply()
