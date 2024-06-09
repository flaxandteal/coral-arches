from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models

ACTIVITY_SYSTEM_REF_NODEGROUP = "e7d695ff-9939-11ea-8fff-f875a44e0e11"
ACTIVITY_RESOURCE_ID_NODE = "e7d69603-9939-11ea-9e7f-f875a44e0e11"

ACTIVITY_NAME_NODEGROUP = "4a7bba1d-9938-11ea-86aa-f875a44e0e11"
ACTIVITY_NAME_NODE = "4a7be135-9938-11ea-b0e2-f875a44e0e11"

details = {
    "functionid": "29b52180-9520-4614-bcd0-77370659d2d2",
    "name": "Update Activity Name",
    "type": "node",
    "description": "Will update the activity name automatically based on a set of conditions.",
    "defaultconfig": {"triggering_nodegroups": [ACTIVITY_SYSTEM_REF_NODEGROUP]},
    "classname": "UpdateActivityName",
    "component": "",
}


class UpdateActivityName(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        prefixed_id = tile.data[ACTIVITY_RESOURCE_ID_NODE].get("en").get("value")

        if prefixed_id.startswith("ESV"):
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=ACTIVITY_NAME_NODEGROUP,
                data={
                    ACTIVITY_NAME_NODE: {
                        "en": {
                            "direction": "ltr",
                            "value": prefixed_id,
                        }
                    }
                },
            )
