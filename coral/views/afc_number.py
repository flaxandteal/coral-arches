from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.afc_number import AfcNumber


SYSTEM_REFERENCE_NODEGROUP = "b37552ba-9527-11ea-96b5-f875a44e0e11"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "b37552be-9527-11ea-9213-f875a44e0e11"


class AfcNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")

        afc = AfcNumber()
        afc_number = afc.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "afcNumber": afc_number})
    