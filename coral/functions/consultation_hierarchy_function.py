from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models
from coral.utils.reference_values import reference_value, selected_list_item_ids

HIERARCHY_TYPE_NODEGROUP = "3e16208d-9560-5998-8ba1-203cd599a5d8"
HIERARCHY_TYPE_NODE = HIERARCHY_TYPE_NODEGROUP

HIERARCHY_STATUATORY = "609367b4-8a68-5f5c-8713-409d33629213"
HIERARCHY_NON_STATUATORY = "34315588-70f4-5643-a4fb-c5ee13a8aa37"

APPLICATION_TYPE_NODEGROUP = "54de6acc-8895-11ea-9067-f875a44e0e11"
APPLICATION_TYPE_NODE = APPLICATION_TYPE_NODEGROUP

# UNRESOLVED, same defect as Consultation Action Type. Application Type keeps its id but
# is now bound to arches-her's 44-item Application Type list, which has no "F - Full" /
# "O - Outline" / "RM - Reserved Matter". The nearest equivalents are Full Planning
# Application (486bfab0-b238-426e-8548-8d92ed796f4a), Outline Planning Consent
# (494840a9-983d-4645-9cef-f8816b86c5dd) and Reserved Details
# (95756cfd-4424-4b68-921e-5b0190097164), but that is a mapping decision for the data
# owner, not a rename. Until it is settled every consultation is treated as
# non-statutory, which is what the old ids already do.
STATUTORY_VALUES = [
    "7b87dd7a-7573-4417-9691-0875a783e8c2", # F - Full
    "32d2e13f-31fb-4031-9bbb-cd159c76a28e", # O - Outline
    "83fe6c2e-bfbb-4a75-8a46-df8baf05e999", # RM - Reserved Matter
]


details = {
    "functionid": "3461bdcc-c5cd-4e5f-8a79-5f621fbbd6ba",
    "name": "Consultation Hierarchy Function",
    "type": "node",
    "description": "Watches the consultation application type nodegroup and sets the correct hierarchy based on that.",
    "defaultconfig": {"triggering_nodegroups": [APPLICATION_TYPE_NODEGROUP]},
    "classname": "ConsultationHierarchyFunction",
    "component": "",
}


class ConsultationHierarchyFunction(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        application_type = selected_list_item_ids(tile.data.get(APPLICATION_TYPE_NODE))

        if not application_type:
            hierarchy_value = None
        elif application_type & set(STATUTORY_VALUES):
            hierarchy_value = reference_value(HIERARCHY_STATUATORY)
        else:
            hierarchy_value = reference_value(HIERARCHY_NON_STATUATORY)

        hierarchy_tile = None
        try:
            hierarchy_tile = Tile.objects.get(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HIERARCHY_TYPE_NODEGROUP,
            )
        except Tile.DoesNotExist:
            hierarchy_tile = None
        
        if not hierarchy_tile:
            hierarchy_tile = Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=HIERARCHY_TYPE_NODEGROUP,
                data={
                    HIERARCHY_TYPE_NODEGROUP: hierarchy_value
                },
            )
        else:
            hierarchy_tile.data[HIERARCHY_TYPE_NODEGROUP] = hierarchy_value
            hierarchy_tile.save()

