from django.apps import AppConfig


class CoralConfig(AppConfig):
    name = "coral"
    is_arches_application = True

    def ready(self):
        from coral.utils.deferred_tile_index import patch_tile_index

        patch_tile_index()
