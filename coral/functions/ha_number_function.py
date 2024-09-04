from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile

SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "325a430a-efe4-11eb-810b-a87eeabdefba"

details = {
    "functionid": "9e34b9df-b098-4faf-a833-a84611e41009",
    "name": "Heritage Asset Number",
    "type": "node",
    "description": "Will validate Heritage Asset numbers before being saved into the tile. Upon failing it will raise an error back to the user.",
    "defaultconfig": {"triggering_nodegroups": [SYSTEM_REFERENCE_NODEGROUP]},
    "classname": "HaNumberFunction",
    "component": "",
}


class HaNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        id_number = tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None)

        hn = HaNumber()
        if hn.validate_id(id_number, resource_instance_id):
            print("Heritage Asset ID is valid: ", id_number)
            return

        raise ValueError('This HA Number has already been generated. This is a rare case where 2 people have generated the same number at the same time. Please try to save again.')
