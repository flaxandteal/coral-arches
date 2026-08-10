from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.smr_number import SmrNumber
from arches.app.models import models


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
SMR_NUMBER_NODE_ID = "d146451b-9140-5f81-b3de-9005acc01e28"


class SmrNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        selected_nismr_id = data.get("selectedNismrId")

        map_sheet_id = models.Value.objects.filter(valueid=selected_nismr_id).first()
        sn = SmrNumber(map_sheet_id=map_sheet_id.value)
        smr_number = sn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "smrNumber": smr_number})
