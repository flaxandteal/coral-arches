from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.smr_number import SmrNumber

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
SMR_NUMBER_NODE_ID = "158e1ed2-3aae-11ef-a2d0-0242ac120003"

NISMR_NUMBERING_NODEGROUP_ID = "86c19e92-3ea7-11ef-818b-0242ac140006"
NISMR_NUMBERING_TYPE_NODE_ID = "86c19e92-3ea7-11ef-818b-0242ac140006"
GENERATED_SMR_NODE_ID = "b46b5bba-3ec2-11ef-bb61-0242ac140006"

details = {
    "functionid": "b80802e5-c176-4334-8d76-6a033579fd02",
    "name": "SMR Number",
    "type": "node",
    "description": "Will validate the generated SMR number. Upon failing it will attempt to generate a replacement.",
    "defaultconfig": {"triggering_nodegroups": [NISMR_NUMBERING_NODEGROUP_ID]},
    "classname": "SmrNumberFunction",
    "component": "",
}


class SmrNumberFunction(BaseFunction):
    def update_ha_references(self, ri_id, id):
        references_tile = Tile.objects.filter(
            resourceinstance_id=ri_id,
            nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
        ).first()

        if not references_tile:
            references_tile = Tile.get_blank_tile_from_nodegroup_id(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID, resourceid=ri_id
            )
        
        if isinstance(id, str):
            id = {
                "en":{
                    "direction": "ltr",
                    "value": id
                }
            }

        references_tile.data[SMR_NUMBER_NODE_ID] = id
        references_tile.save()

    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        id_number = tile.data.get(GENERATED_SMR_NODE_ID, None)

        if not id_number:
            return

        map_sheet_id = models.Value.objects.filter(
            valueid=tile.data.get(NISMR_NUMBERING_TYPE_NODE_ID, None)
        ).first()

        sn = SmrNumber(map_sheet_id=map_sheet_id.value)

        if sn.validate_id(id_number, resource_instance_id):
            print("SMR Number is valid: ", id_number)
            self.update_ha_references(resource_instance_id, id_number)
            return

        id_number = sn.generate_id_number(resource_instance_id)
        self.update_ha_references(resource_instance_id, id_number)

        return
