from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.smr_number import SmrNumber
from coral.utils.hb_number import HbNumber

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
HB_NUMBER_NODE_ID = "250002fe-3aae-11ef-91fd-0242ac120003"

WARDS_AND_DISTRICTS_NODEGROUP_ID = "de6b6af0-44e3-11ef-9114-0242ac120006"
WARDS_AND_DISTRICTS_TYPE_NODE_ID = WARDS_AND_DISTRICTS_NODEGROUP_ID
GENERATED_HB_NODE_ID = "19bd9ac4-44e4-11ef-9114-0242ac120006"

details = {
    "functionid": "23d758a1-cc04-414d-bb4d-49f2d5c82930",
    "name": "HB Number",
    "type": "node",
    "description": "Will validate the generated HB number. Upon failing it will attempt to generate a replacement.",
    "defaultconfig": {"triggering_nodegroups": [WARDS_AND_DISTRICTS_NODEGROUP_ID]},
    "classname": "HbNumberFunction",
    "component": "",
}


class HbNumberFunction(BaseFunction):
    def update_ha_references(self, ri_id, id):
        references_tile = Tile.objects.filter(
            resourceinstance_id=ri_id,
            nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
        ).first()

        if not references_tile:
            references_tile = Tile.get_blank_tile_from_nodegroup_id(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID, resourceid=ri_id
            )

        references_tile.data[HB_NUMBER_NODE_ID] = id
        references_tile.save()

    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        id_number = tile.data.get(GENERATED_HB_NODE_ID, None)

        if not id_number:
            return

        ward_district_text = models.Value.objects.filter(
            valueid=tile.data.get(WARDS_AND_DISTRICTS_TYPE_NODE_ID, None)
        ).first()

        hn = HbNumber(ward_distict_text=ward_district_text.value)

        if hn.validate_id(id_number):
            print("HB Number is valid: ", id_number)
            self.update_ha_references(resource_instance_id, id_number)
            return

        id_number = hn.generate_id_number(resource_instance_id)
        self.update_ha_references(resource_instance_id, id_number)

        return
