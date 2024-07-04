from django.views.generic import View
import json
from arches.app.models.tile import Tile
from arches.app.utils.response import JSONResponse
from coral.utils.ha_number import HaNumber


SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "325a430a-efe4-11eb-810b-a87eeabdefba"


class HaNumberView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")

        if resource_instance_id:
            sys_ref_tile = Tile.objects.filter(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
            ).first()

            if sys_ref_tile and sys_ref_tile.data.get(
                SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None
            ):
                print("Heritage Asset ID has already been generated: ", id)
                id = (
                    sys_ref_tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, None)
                    .get("en")
                    .get("value")
                )
                return JSONResponse(
                    {
                        "message": "Heritage Asset ID has already been generated",
                        "haNumber": id,
                    }
                )

        hn = HaNumber()
        ha_number = hn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "haNumber": ha_number})
