from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.garden_number import GardenNumber

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
GARDEN_NUMBER_NODE_ID = "2c2d02fc-3aae-11ef-91fd-0242ac120003"

GENERATED_GARDEN_NODEGROUP = "9b884c9c-49a4-11ef-8345-0242ac120007"
GENERATED_GARDEN_NODE_ID = "bd85cca2-49a4-11ef-94a5-0242ac120007"

ADDRESS_NODEGROUP_ID = "87d39b25-f44f-11eb-95e5-a87eeabdefba"
COUNTY_NODE_ID = "87d3ff32-f44f-11eb-aa82-a87eeabdefba"

details = {
    "functionid": "2d0a0e51-0a20-443f-85cf-7ddc333c0cdd",
    "name": "Garden Number",
    "type": "node",
    "description": "Will validate the generated garden number. Upon failing it will attempt to generate a replacement.",
    "defaultconfig": {"triggering_nodegroups": [GENERATED_GARDEN_NODEGROUP]},
    "classname": "GardenNumberFunction",
    "component": "",
}


class GardenNumberFunction(BaseFunction):
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
            id = {"en": {"direction": "ltr", "value": id}}
        references_tile.data[GARDEN_NUMBER_NODE_ID] = id
        references_tile.save(request=request)

    def post_save(self, tile, request, context):
        if context and context.get("escape_function", False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        id_number = (
            Tile.objects.filter(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=GENERATED_GARDEN_NODEGROUP,
            )
            .first()
            .data.get(GENERATED_GARDEN_NODE_ID)
        )

        county_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=ADDRESS_NODEGROUP_ID,
        ).first()

        county_name = models.Value.objects.filter(
            valueid=county_tile.data.get(COUNTY_NODE_ID)
        ).first()

        if not county_name and not id_number:
            # Clear HPG Number
            self.update_ha_references(resource_instance_id, "", request)
            return
        
        if not county_name and id_number:
            raise ValueError('No selected County selected but a generated ID was provided.')
        
        gn = GardenNumber(county_name=county_name.value)

        if gn.validate_id(id_number, resource_instance_id):
            print("Garden Number is valid: ", id_number)
            self.update_ha_references(resource_instance_id, id_number, request)
            return

        raise ValueError(
            'This Historic Parks and Gardens Number has already been generated. This is a rare case where 2 people have generated the same number at the same time. Please click "generate" to receive a new number.'
        )
