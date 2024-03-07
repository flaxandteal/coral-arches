from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models


REVISION_COMPLETE_NODEGROUP = "3c51740c-dbd0-11ee-8835-0242ac120006"
APPROVED_BY_NODE = "ad22dad6-dbd0-11ee-b0db-0242ac120006"
APPROVED_ON_NODE = "0cd0998c-dbd6-11ee-b0db-0242ac120006"
COMPLETED_BY_NODE = "3b267ffe-dbd1-11ee-b0db-0242ac120006"
COMPLETED_ON_NODE = "af5fd406-dbd1-11ee-b0db-0242ac120006"


details = {
    "functionid": "abde9ed3-1f84-4df4-9a32-e32527ba2aba",
    "name": "Apply Revision Function",
    "type": "node",
    "description": "Watches the Revision Complete nodegroup for the correct values to apply.",
    "defaultconfig": {"triggering_nodegroups": [REVISION_COMPLETE_NODEGROUP]},
    "classname": "ApplyRevisionFunction",
    "component": "",
}


class ApplyRevisionFunction:
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        
