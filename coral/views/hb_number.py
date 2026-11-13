from django.views.generic import View
import json
from arches.app.models.tile import Tile
from django.db.models.fields.json import KT
from arches.app.utils.response import JSONResponse
from coral.utils.hb_number import HbNumber
from coral.utils.hb_number_suffix import HbNumberSuffix
from arches.app.models import models
import re


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
HB_NUMBER_NODE_ID = "4b9883ef-9aad-559a-bd84-e4bb7b94a358"


class HbNumberView(View):
    def get(self, request):
        """List the HB numbers a suffix can be appended to.

        Only the numbers themselves are pulled back: there are tens of thousands of
        references tiles, and fetching each one in full to read a single node made the
        request slow enough to be worth avoiding.
        """
        hb_numbers = (
            Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                **{f"data__{HB_NUMBER_NODE_ID}__en__value__regex": r'^HB\d'},
            )
            .annotate(hb_number=KT(f"data__{HB_NUMBER_NODE_ID}__en__value"))
            .values_list("hb_number", flat=True)
            .distinct()
        )

        # Suffixed numbers are offered as their base number, so "HB16/04/049 A" and
        # "HB16/04/049" are one entry.
        base_numbers = sorted(
            {re.sub(r'[a-zA-Z]+$', '', hb_number).strip() for hb_number in hb_numbers}
        )

        return JSONResponse(
            {"hbNumbers": [{'text': num, 'id': num} for num in base_numbers]}
        )
    
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        resource_instance_id = data.get("resourceInstanceId")
        
        method = data.get("method")
        if method == "append":
            hb_number = data.get("selectedHBNumber")
            hns = HbNumberSuffix(hb_number=hb_number)
            hb_number = hns.append_id_suffix(resource_instance_id)

        else:
            # Wards and Districts is a `reference` (controlled list) node, so the
            # client sends the item's prefLabel directly. Older callers sent a
            # concept valueid.
            ward_district_text = data.get("selectedWardDistrictLabel")
            if not ward_district_text:
                value = models.Value.objects.filter(
                    valueid=data.get("selectedWardDistrictId")
                ).first()
                if not value:
                    raise ValueError("No Ward and District Numbering was selected")
                ward_district_text = value.value

            hn = HbNumber(ward_distict_text=ward_district_text)
            hb_number = hn.generate_id_number(resource_instance_id)

        return JSONResponse({"message": "Generated ID", "hbNumber": hb_number})
