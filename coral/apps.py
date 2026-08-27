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

