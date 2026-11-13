from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.reference_values import selected_list_item_ids

COMPOSITE_SCORE_NODEGROUP_ID = "b218c165-a03e-5bae-ac5a-8422a91af211"
CONDITION_SCORE_NODE_ID = "d1cd09d6-bc22-59e6-b840-46e8a1514442"
RISK_SCORE_NODE_ID = "402dc4cb-4825-5a2b-8366-a5aea6045054"
TOTAL_SCORE_NODE_ID = "dabcfb5c-a7d0-5224-b824-da3ab24c7d00"

# Both nodes shared one set of domain options before v8. They now have a controlled list
# each, so 1-5 are different ids per node and a single lookup can no longer serve both.
CONDITION_SCORE_LOOKUP = {
    "22839192-d6c1-585e-8d47-5dd65a56b656": 1,
    "267f7834-7c3e-5de6-977c-732d929ab071": 2,
    "8f51b776-615d-5ee3-966d-649a630eeccd": 3,
    "118b6274-57ab-5f30-9e98-d6382370704c": 4,
    "269e214f-012e-5053-8d9d-5bcc7e428d49": 5,
}

RISK_SCORE_LOOKUP = {
    "be6b45d4-c644-5e9b-9d8b-7e8b36bf31a2": 1,
    "42b793c1-6df2-5951-92df-ba7fc1900926": 2,
    "10566173-79b9-5cb0-abcc-17883dd6c3f2": 3,
    "1ee9a656-7bad-5c9c-b182-ed0166e2598c": 4,
    "37935aa8-578f-5766-a2df-3ddf71fef536": 5,
}


def _score(value, lookup):
    selected = selected_list_item_ids(value)
    return next((lookup[item] for item in selected if item in lookup), 0)


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
        condition_score = _score(tile.data.get(CONDITION_SCORE_NODE_ID), CONDITION_SCORE_LOOKUP)
        risk_score = _score(tile.data.get(RISK_SCORE_NODE_ID), RISK_SCORE_LOOKUP)

        total_score = condition_score * risk_score

        if total_score != tile.data.get(TOTAL_SCORE_NODE_ID):
            tile.data[TOTAL_SCORE_NODE_ID] = total_score
            tile.save()
