from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.garden_number import GardenNumber
from arches.app.models import models


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
COUNTY_NODEGROUP_ID = "87d3ff2a-f44f-11eb-9951-a87eeabdefba"
ADDRESS_NODEGROUP_ID = "87d39b25-f44f-11eb-95e5-a87eeabdefba"
GARDEN_NUMBER_NODE_ID = "2c2d02fc-3aae-11ef-91fd-0242ac120003"
COUNTY_NODE_ID = "8bfe714e-3ec2-11ef-9023-0242ac140007"



class GardenNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")

        if resource_instance_id:
            references_tile = Tile.objects.filter(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
            ).first()
            county_tile = Tile.objects.filter(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=ADDRESS_NODEGROUP_ID,
            ).first()

            if county_tile and references_tile:
                county_name_tile = models.Value.objects.filter(
                    valueid= county_tile.data.get(COUNTY_NODE_ID)
                ).first()
                county_name = county_name_tile.value
                county_abbreviation = GardenNumber(county_name).abbreviate_county(county_name)
                garden_number = references_tile.data.get(GARDEN_NUMBER_NODE_ID, None)
                abbreviation = None
                if garden_number:
                    abbreviation = (
                        garden_number
                        .get("en")
                        .get("value")
                        .split("-")[0]
                    )
                if county_abbreviation == abbreviation:
                    if references_tile.data.get(GARDEN_NUMBER_NODE_ID, None):
                        id = (
                            references_tile.data.get(GARDEN_NUMBER_NODE_ID, None)
                            .get("en")
                            .get("value")
                        )
                        print("Historic Parks and Garden Number has already been generated: ", id)
                        return JSONResponse(
                            {
                                "message": "Historic Parks and Garden has already been generated",
                                "gardenNumber": id,
                            }
                        )
            
        self.county_name = ""

        if county_tile:
            county_name_tile = models.Value.objects.filter(
                valueid= county_tile.data.get(COUNTY_NODE_ID)
            ).first()

            self.county_name = county_name_tile.value

        else:
            raise ValueError("No county was found")

        gn = GardenNumber(county_name=self.county_name)
        garden_number = gn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "gardenNumber": garden_number})