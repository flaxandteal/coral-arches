from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.smr_number import SmrNumber
from arches.app.models import models


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
SMR_NUMBER_NODE_ID = "158e1ed2-3aae-11ef-a2d0-0242ac120003"


class SmrNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        selected_nismr_id = data.get("selectedNismrId")

        map_sheet_id = models.Value.objects.filter(valueid=selected_nismr_id).first()

        if resource_instance_id:
            references_tile = Tile.objects.filter(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
            ).first()

            if references_tile and references_tile.data.get(SMR_NUMBER_NODE_ID, None):
                id = (
                    references_tile.data.get(SMR_NUMBER_NODE_ID, None)
                    .get("en")
                    .get("value")
                )
                print("SMR Number has already been generated: ", id)
                return JSONResponse(
                    {
                        "message": "SMR Number has already been generated",
                        "haNumber": id,
                    }
                )

        sn = SmrNumber(map_sheet_id=map_sheet_id.value)
        smr_number = sn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "smrNumber": smr_number})