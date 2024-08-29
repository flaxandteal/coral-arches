from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models

HIERARCHY_TYPE_NODEGROUP = "0dd6ccb8-cffe-11ee-8a4e-0242ac180006"
HIERARCHY_TYPE_NODE = HIERARCHY_TYPE_NODEGROUP

HIERARCHY_STATUATORY = "d06d5de0-2881-4d71-89b1-522ebad3088d"
HIERARCHY_NON_STATUATORY = "be6eef20-8bd4-4c64-abb2-418e9024ac14"

APPLICATION_TYPE_NODEGROUP = "54de6acc-8895-11ea-9067-f875a44e0e11"
APPLICATION_TYPE_NODE = APPLICATION_TYPE_NODEGROUP

STATUTORY_VALUES = [
    "7b87dd7a-7573-4417-9691-0875a783e8c2", # F - Full
    "32d2e13f-31fb-4031-9bbb-cd159c76a28e", # O - Outline
    "83fe6c2e-bfbb-4a75-8a46-df8baf05e999", # RM - Reserved Matter
]


details = {
    "functionid": "3461bdcc-c5cd-4e5f-8a79-5f621fbbd6ba",
    "name": "Consultation Hierarchy Function",
    "type": "node",
    "description": "Watches the consultation application type nodegroup and sets the correct hierarchy based on that.",
    "defaultconfig": {"triggering_nodegroups": [APPLICATION_TYPE_NODEGROUP]},
    "classname": "ConsultationHierarchyFunction",
    "component": "",
}


class ConsultationHierarchyFunction(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        application_type = (tile.data.get(APPLICATION_TYPE_NODE))
        hierarchy_value = ''

        if application_type:
            if application_type in STATUTORY_VALUES:
                hierarchy_value = HIERARCHY_STATUATORY
            else:
                hierarchy_value = HIERARCHY_NON_STATUATORY
        else:
            hierarchy_value = None

        hierarchy_tile = None
        try:
            hierarchy_tile = Tile.objects.get(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HIERARCHY_TYPE_NODEGROUP,
            )
        except Tile.DoesNotExist:
            hierarchy_tile = None
        
        if not hierarchy_tile:
            hierarchy_tile = Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HIERARCHY_TYPE_NODEGROUP,
                data={
                    HIERARCHY_TYPE_NODEGROUP: hierarchy_value
                },
            )
        else:
            hierarchy_tile.data[HIERARCHY_TYPE_NODEGROUP] = hierarchy_value
            hierarchy_tile.save()

