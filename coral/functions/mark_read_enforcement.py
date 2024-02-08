from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models

ENFORCEMENT_STATUS_NODEGROUP = "ac823b90-b555-11ee-805b-0242ac120006"
ENFORCEMENT_STATUS_NODE = "c9711ef6-b555-11ee-baf6-0242ac120006"

ENFORCEMENT_STATUS_CLOSED_VALUE = "f3dcfd61-4b71-4d1d-8cd3-a7abb52d861b"


details = {
    "functionid": "e11d2b80-1aa6-4d1b-8d54-f1ec39f45f03",
    "name": "Mark Read Enforcement",
    "type": "node",
    "description": "When the status of the enforcement is marked complete. Mark the created notification as read.",
    "defaultconfig": {"triggering_nodegroups": [ENFORCEMENT_STATUS_NODEGROUP]},
    "classname": "MarkReadEnforcement",
    "component": "",
}


class MarkReadEnforcement(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        if tile.data.get(ENFORCEMENT_STATUS_NODE) != ENFORCEMENT_STATUS_CLOSED_VALUE:
            return

        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id
        ).first()
        user_x_notification = models.UserXNotification.objects.filter(
            notif=existing_notification
        ).first()
        user_x_notification.isread = True
        user_x_notification.save()
