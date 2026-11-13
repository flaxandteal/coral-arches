from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.garden_number import GardenNumber
from coral.utils.reference_values import reference_label


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
COUNTY_NODEGROUP_ID = "87d3ff2a-f44f-11eb-9951-a87eeabdefba"
ADDRESS_NODEGROUP_ID = "87d39b25-f44f-11eb-95e5-a87eeabdefba"
GARDEN_NUMBER_NODE_ID = "1edc61a9-b64b-51ae-9077-536908761903"
COUNTY_NODE_ID = "87d3ff32-f44f-11eb-aa82-a87eeabdefba"


def resolve_county(county_value, posted_label=None):
    """GardenNumber for the county in a reference tile value; the posted label is only a fallback.

    Raises ValueError when there is no county or it is not one the numbering knows.
    """
    county_name = reference_label(county_value) or posted_label
    if not county_name:
        raise ValueError("No county was found")
    return GardenNumber(county_name=county_name)


def bad_request(message):
    return JSONResponse({"message": message}, status=400)


class GardenNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        if not resource_instance_id:
            return bad_request("No resource instance id was provided")

        county_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=ADDRESS_NODEGROUP_ID,
        ).first()
        if not county_tile:
            return bad_request("No county was found: the resource has no address")

        try:
            gn = resolve_county(
                county_tile.data.get(COUNTY_NODE_ID), data.get("selectedCountyLabel")
            )
        except ValueError as error:
            return bad_request(f"Could not work out the county: {error}")

        references_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
        ).first()
        garden_number = references_tile and references_tile.data.get(GARDEN_NUMBER_NODE_ID)
        if garden_number:
            existing = garden_number.get("en").get("value")
            if existing.split("-")[0] == gn.county_abbreviation:
                return JSONResponse(
                    {
                        "message": "Historic Parks and Garden has already been generated",
                        "gardenNumber": existing,
                    }
                )

        garden_number = gn.generate_id_number(resource_instance_id)
        return JSONResponse({"message": "Generated ID", "gardenNumber": garden_number})
