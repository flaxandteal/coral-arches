from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models

COMPOSITE_SCORE_NODEGROUP_ID = "eabbfd96-0c4f-11ef-a9bf-0242ac140006"
CONDITION_SCORE_NODE_ID = "73679068-0c52-11ef-a9bf-0242ac140006"
RISK_SCORE_NODE_ID = "094eb7ce-0c52-11ef-8f48-0242ac140006"
TOTAL_SCORE_NODE_ID = "a1daff8e-0c52-11ef-a9bf-0242ac140006"

SCORE_LOOKUP = {
    "d81fa421-35f3-4f30-95fa-c042f424c83a": 1,
    "56342ba4-538c-4650-8285-23af0a3cc523": 2,
    "7b758df3-5722-4c76-8785-ea9a715e420e": 3,
    "d2db1732-5b6e-4a7d-b84f-8bff6e541cff": 4,
    "ef491947-178e-4f62-92ac-192fa6424592": 5,
}

details = {
    "functionid": "3b10dd80-bad0-4cf2-9d50-7c8200f3f13d",
    "name": "Calculate Composite Score Function",
    "type": "node",
    "description": "Watches the composite score nodegroup and updates the total score depending on the value selected in the dropdowns.",
    "defaultconfig": {"triggering_nodegroups": [COMPOSITE_SCORE_NODEGROUP_ID]},
    "classname": "CalculateCompositeScoreFunction",
    "component": "",
}


class CalculateCompositeScoreFunction(BaseFunction):
    def post_save(self, tile, request, context):
        condition_score = SCORE_LOOKUP.get(tile.data.get(CONDITION_SCORE_NODE_ID), 0)
        risk_score = SCORE_LOOKUP.get(tile.data.get(RISK_SCORE_NODE_ID), 0)

        total_score = condition_score + risk_score

        if total_score != tile.data[TOTAL_SCORE_NODE_ID]:
            tile.data[TOTAL_SCORE_NODE_ID] = total_score
            tile.save()
