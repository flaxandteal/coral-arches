from arches.app.functions.base import BaseFunction
from coral.utils.afc_number import AfcNumber
from arches.app.models.tile import Tile

SYSTEM_REFERENCE_NODEGROUP = "b37552ba-9527-11ea-96b5-f875a44e0e11"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "b37552be-9527-11ea-9213-f875a44e0e11"

details = {
    "functionid": "8635fa11-8aef-48c7-9511-9002386143f2",
    "name": "Agriculture Forestry consultation Number",
    "type": "node",
    "description": "Will validate Agriculture Forestry consultation numbers before being saved into the tile. Upon failing it will raise an error back to the user.",
    "defaultconfig": {"triggering_nodegroups": [SYSTEM_REFERENCE_NODEGROUP]},
    "classname": "AfcNumberFunction",
    "component": "",
}


class AfcNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        id_number = tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None)

        afcn = AfcNumber()
        if afcn.validate_id(id_number, resource_instance_id):
            print("AFC ID is valid: ", id_number)
            return

        raise ValueError('This AFC Number has already been generated. This is a rare case where 2 people have generated the same number at the same time. Please try to save again.')
