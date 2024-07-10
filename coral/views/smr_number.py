from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.smr_number import SmrNumber
from arches.app.models import models


SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "325a430a-efe4-11eb-810b-a87eeabdefba"


class SmrNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        selected_nismr_id = data.get("selectedNismrId")

        print("resource_instance_id: ", resource_instance_id)
        print("selected_nismr_id: ", selected_nismr_id)

        value = models.Value.objects.filter(valueid=selected_nismr_id).first()

        print('value: ', value)
        print('value.value: ', value.value)

        # if resource_instance_id:
        #     sys_ref_tile = Tile.objects.filter(
        #         resourceinstance_id=resource_instance_id,
        #         nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
        #     ).first()

        #     if sys_ref_tile and sys_ref_tile.data.get(
        #         SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None
        #     ):
        #         id = (
        #             sys_ref_tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None)
        #             .get("en")
        #             .get("value")
        #         )
        #         print("Heritage Asset ID has already been generated: ", id)
        #         return JSONResponse(
        #             {
        #                 "message": "Heritage Asset ID has already been generated",
        #                 "haNumber": id,
        #             }
        #         )

        # sn = SmrNumber()
        # smr_number = sn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "smrNumber": None})
