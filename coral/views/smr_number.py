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

        # Nismr Numbering is a `reference` (controlled list) node, so the client
        # sends the item's prefLabel directly. Older callers sent a concept valueid.
        map_sheet_id = data.get("selectedNismrLabel")
        if not map_sheet_id:
            value = models.Value.objects.filter(
                valueid=data.get("selectedNismrId")
            ).first()
            if not value:
                raise ValueError("No NISMR Numbering was selected")
            map_sheet_id = value.value

        sn = SmrNumber(map_sheet_id=map_sheet_id)
        smr_number = sn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "smrNumber": smr_number})
