from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.hb_number import HbNumber
from arches.app.models import models


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
HB_NUMBER_NODE_ID = "250002fe-3aae-11ef-91fd-0242ac120003"


class HbNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        selected_ward_district_id = data.get("selectedWardDistrictId")

        ward_district_text = models.Value.objects.filter(
            valueid=selected_ward_district_id
        ).first()
        hn = HbNumber(ward_distict_text=ward_district_text.value)
        hb_number = hn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "hbNumber": hb_number})
