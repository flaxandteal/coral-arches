from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile
import re
import logging
import pdb

logger = logging.getLogger(__name__)

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
IHR_NUMBER_NODE_ID = "0b14fb28-961e-5817-9cac-c61073b58981"

details = {
    "functionid": "ea081ee0-6796-480c-bba4-2b8daaac660f",
    "name": "IHR Number Validation",
    "type": "node",
    "description": "Will validate the input IHR number for correct format and duplicates",
    "defaultconfig": {"triggering_nodegroups": [HERITAGE_ASSET_REFERENCES_NODEGROUP_ID]},
    "classname": "IHRValidationFunction",
    "component": "",
}


class IHRValidationFunction(BaseFunction):
    def save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        input_ihr_tile = tile.data.get(IHR_NUMBER_NODE_ID, None)

        if not input_ihr_tile:
            return
        
        input_ihr_string = input_ihr_tile.get("en").get("value")

        is_valid = self.is_valid_format(input_ihr_string) if input_ihr_string else False

        if not is_valid:
            raise ValueError("The IHR Number format is incorrect please format as 00000:000:00")

        ihr_string_query = {
            f"data__{IHR_NUMBER_NODE_ID}__icontains": input_ihr_string,
        }
        
        existing_tile = Tile.objects.filter(
            nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
            **ihr_string_query,
        ).exclude(resourceinstance_id=resource_instance_id).first()

        if existing_tile:
            raise ValueError("This IHR number has already been saved, please check your input")       


    def is_valid_format(self, ihr_number):
        pattern = r'^\d{5}:\d{3}:\d{2}$'
        return bool(re.match(pattern, ihr_number))
        