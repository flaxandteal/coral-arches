from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile

SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "325a430a-efe4-11eb-810b-a87eeabdefba"

details = {
    "functionid": "9e34b9df-b098-4faf-a833-a84611e41009",
    "name": "Heritage Asset Number",
    "type": "node",
    "description": "Will validate Heritage Asset numbers before being saved into the tile. Upon failing it will attempt to generate a replacement.",
    "defaultconfig": {"triggering_nodegroups": [SYSTEM_REFERENCE_NODEGROUP]},
    "classname": "HaNumberFunction",
    "component": "",
}


class HaNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        hn = HaNumber()
        id_number = tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None)

        if hn.validate_id(id_number):
            print("Heritage Asset ID is valid: ", id)
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        ha_number = hn.generate_id_number(resource_instance_id)

        try:
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
                data={
                    SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID: {
                        "en": {"direction": "ltr", "value": ha_number}
                    },
                },
            )
        except Exception as e:
            print(f"Failed saving Heritage Asset number to system reference: {e}")
            raise e

        return
