from arches_orm.models import Group, ArchesPlugin
from arches.app.models.models import Plugin
from casbin import Enforcer
import uuid

import logging
logger = logging.getLogger(__name__)

class ArchesPluginProcessor():
    """
    A class to process Arches plugins and their permissions.
    This class is responsible for handling the permissions of plugins in the Arches system.
    """

    def __init__(self, enforcer: Enforcer):
        self._enforcer = enforcer
        self._plugin_cache = {}

    def process_group_plugins(self, group: Group, group_key: str) -> None:
        """Process all plugins for the given group."""
        try:
            arches_plugins = group.arches_plugins

            for arches_plugin in arches_plugins:
                if not isinstance(arches_plugin, ArchesPlugin):
                    try:
                        logger.warning("A non-plugin resource was listed as an Arches plugin in a group: %s in %s", arches_plugin.id, group.id)
                    except Exception as exc:
                        logger.warning("A non-plugin resource was listed as an Arches plugin in a group: %s", str(exc))
                    continue

                self._add_plugin_policies(arches_plugin, group_key)
        except Exception as exc:
            print("Could not get Arches Plugins", exc)

    def _add_plugin_policies(self, arches_plugin: ArchesPlugin, group_key: str):
        """Add the plugin policies to the enforcer"""
        plugin = self._get_plugin(arches_plugin)

        for obj_key in (f"pl:{key}" for key in (plugin.pk, plugin.slug) if key):
            self._enforcer.add_policy(group_key, obj_key, "view_plugin")
            print("Arches Plugins #3", group_key, obj_key)

    def _get_plugin(self, arches_plugin: ArchesPlugin):
        """Retrieve the plugin from the cache or database"""
        if arches_plugin.plugin_identifier not in self._plugin_cache:
            try:
                identifier = uuid.UUID(arches_plugin.plugin_identifier)
                plugin = Plugin.objects.get(pk=identifier)
            except ValueError:
                plugin = Plugin.objects.get(slug=arches_plugin.plugin_identifier)
            self._plugin_cache[arches_plugin.plugin_identifier] = plugin
            return plugin
        return self._plugin_cache[arches_plugin.plugin_identifier]