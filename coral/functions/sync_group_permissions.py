import logging
from arches.app.functions.base import BaseFunction
from arches.app.utils.permission_backend import _get_permission_framework
from django.db import transaction

MEMBERS = "bb2f7e1c-7029-11ee-885f-0242ac140008"
ARCHES_PLUGINS = "160d28c8-6789-11ef-baee-0242ac120006"

details = {
    "functionid": "76f71d97-f1bf-4b83-a355-7ab8d309d71f",
    "name": "Sync Group Permissions",
    "type": "node",
    "description": "Updates Casbin memberships and plugin rules for a Group when its members or plugins change",
    "defaultconfig": {
        "triggering_nodegroups": [MEMBERS, ARCHES_PLUGINS],
    },
    "classname": "SyncGroupPermissions",
    "component": "",
}

logger = logging.getLogger(__name__)


def _sync(group_id):
    try:
        framework = _get_permission_framework()
        if hasattr(framework, "sync_group"):
            framework.sync_group(group_id)
    except Exception:
        logger.exception("Could not sync permissions for group %s", group_id)


class SyncGroupPermissions(BaseFunction):
    def post_save(self, tile, request, context=None):
        group_id = tile.resourceinstance_id
        transaction.on_commit(lambda: _sync(group_id))

    def delete(self, tile, request=None):
        group_id = tile.resourceinstance_id
        transaction.on_commit(lambda: _sync(group_id))
