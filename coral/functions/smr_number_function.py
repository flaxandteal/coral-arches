from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.smr_number import SmrNumber

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
SMR_NUMBER_NODE_ID = "d146451b-9140-5f81-b3de-9005acc01e28"

NISMR_NUMBERING_NODEGROUP_ID = "a7742f3d-197d-5fcb-9fde-4179a7e28d5b"
NISMR_NUMBERING_TYPE_NODE_ID = "a7742f3d-197d-5fcb-9fde-4179a7e28d5b"
GENERATED_SMR_NODE_ID = "039aaf6d-59d4-57a9-bf87-245ec8913130"

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
    def update_ha_references(self, ri_id, id, request):
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
        references_tile.save(request=request)

    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        id_number = tile.data.get(GENERATED_SMR_NODE_ID, None)

        map_sheet_id = models.Value.objects.filter(
            valueid=tile.data.get(NISMR_NUMBERING_TYPE_NODE_ID, None)
        ).first()

        if not map_sheet_id and not id_number:
            # Clear SMR Number
            self.update_ha_references(resource_instance_id, "", request)
            return
        
        if not map_sheet_id and id_number:
            raise ValueError('No selected NISMR Numbering selected but a generated ID was provided.')

        sn = SmrNumber(map_sheet_id=map_sheet_id.value)

        if sn.validate_id(id_number, resource_instance_id):
            print("SMR Number is valid: ", id_number)
            self.update_ha_references(resource_instance_id, id_number, request)
            return
        
        raise ValueError('This SMR Number has already been generated. This is a rare case where 2 people have generated the same number at the same time. Please click "generate" to receive a new number.')
