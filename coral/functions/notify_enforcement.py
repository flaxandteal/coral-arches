from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models


SYSTEM_REF_NODEGROUP = "ba39c036-b551-11ee-94ee-0242ac120006"
SYSTEM_REF_RESOURCE_ID_NODE = "ba3a083e-b551-11ee-94ee-0242ac120006"

CASE_REF_NODEGROUP = "074effd0-b5e8-11ee-8e91-0242ac120006"
CASE_REF_NODE = "074f0746-b5e8-11ee-8e91-0242ac120006"

REASON_DESC_NODEGROUP = "89bf628e-b552-11ee-805b-0242ac120006"
REASON_DESC_NODE = "89bf6c48-b552-11ee-805b-0242ac120006"

ASSOCIATED_ACTORS_NODEGROUP = "f0b99550-b551-11ee-805b-0242ac120006"
ASSOCIATED_ACTOR_NODE = "f0b9edd4-b551-11ee-805b-0242ac120006"

FLAGGED_DATE_NODEGROUP = "229501c2-b552-11ee-805b-0242ac120006"
FLAGGED_DATE_NODE = "2295085c-b552-11ee-805b-0242ac120006"


details = {
    "functionid": "3cf14ca7-4c4d-46c8-8b69-41d7d36a365f",
    "name": "Notify Enforcement",
    "type": "node",
    "description": "Will send a notification on creation of an enforcement to a specified user",
    "defaultconfig": {"triggering_nodegroups": [REASON_DESC_NODEGROUP]},
    "classname": "NotifyEnforcement",
    "component": "",
}


class NotifyEnforcement(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id
        ).first()
        if existing_notification:
            return

        reason_description = models.TileModel.objects.filter(
            resourceinstance_id=resource_instance_id, nodegroup_id=REASON_DESC_NODEGROUP
        ).first()

        system_ref = models.TileModel.objects.filter(
            resourceinstance_id=resource_instance_id, nodegroup_id=SYSTEM_REF_NODEGROUP
        ).first()

        notification = models.Notification(
            message=reason_description.data.get(REASON_DESC_NODE)
            .get("en")
            .get("value"),
            context={
                "resource_instance_id": resource_instance_id,
                "enforcement_id": system_ref.data.get(SYSTEM_REF_RESOURCE_ID_NODE)
                .get("en")
                .get("value"),
            },
        )
        notification.save()

        user_x_notification = models.UserXNotification(
            notif=notification, recipient=request.user
        )
        user_x_notification.save()
