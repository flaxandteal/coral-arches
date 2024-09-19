from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile

PLANNING_REFERENCE_NODEGROUP_ID = "b4974044-c768-11ee-a945-0242ac180006"
PLANNING_REFERENCE_NODE_ID = "b4974a58-c768-11ee-a945-0242ac180006"

SYSTEM_REFERENCES_NODEGROUP_ID = "b37552ba-9527-11ea-96b5-f875a44e0e11"
SYSTEM_REFERENCE_RESOURCE_NODE_ID = "b37552be-9527-11ea-9213-f875a44e0e11"

DISPLAY_NAME_NODEGROUP_ID = "ce0f99d2-768f-11ef-9d14-0242ac120006"
DISPLAY_NAME_NODE_ID = "e25f6192-768f-11ef-a1f7-0242ac120006"

details = {
    "functionid": "9e1bf441-64eb-4642-a77f-4e77da4f070d",
    "name": "Update Planning Name",
    "type": "node",
    "description": "Will watch the Planning Reference field for changes and when it changes the planning consultation name will update.",
    "defaultconfig": {
        "triggering_nodegroups": [
            SYSTEM_REFERENCES_NODEGROUP_ID,
            PLANNING_REFERENCE_NODEGROUP_ID,
        ]
    },
    "classname": "UpdatePlanningNameFunction",
    "component": "",
}


class UpdatePlanningNameFunction(BaseFunction):
    def get_system_reference_tile(self, resource_instance_id):
        system_reference_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=SYSTEM_REFERENCES_NODEGROUP_ID,
        ).first()
        return system_reference_tile

    def get_planning_reference_tile(self, resource_instance_id):
        planning_reference_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=PLANNING_REFERENCE_NODEGROUP_ID,
        ).first()
        return planning_reference_tile

    def get_ha_display_name_tile(self, resource_instance_id):
        display_name_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=DISPLAY_NAME_NODEGROUP_ID,
        ).first()
        if not display_name_tile:
            display_name_tile = Tile.get_blank_tile_from_nodegroup_id(
                DISPLAY_NAME_NODEGROUP_ID, resourceid=resource_instance_id
            )
            display_name_tile.save()
        return display_name_tile

    def get_localised_string_value(self, tile, node_id):
        if not tile:
            return None
        node_value = tile.data.get(node_id, None)
        if node_value:
            return node_value.get("en", {}).get("value", None)
        return node_value

    def value_as_localised_string(self, value):
        return {"en": {"value": value, "direction": "ltr"}}

    def post_save(self, tile, request, context):
        if context and context.get("escape_function", False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        planning_reference_tile = self.get_planning_reference_tile(resource_instance_id)
        system_reference_tile = self.get_system_reference_tile(resource_instance_id)
        display_name_tile = self.get_ha_display_name_tile(resource_instance_id)

        planning_ref_value = None
        if planning_reference_tile:
            planning_ref_value = self.get_localised_string_value(
                planning_reference_tile, PLANNING_REFERENCE_NODE_ID
            )

        resource_id_value = None
        if system_reference_tile:
            resource_id_value = self.get_localised_string_value(
                system_reference_tile, SYSTEM_REFERENCE_RESOURCE_NODE_ID
            )

        if planning_ref_value:
            display_name_tile.data[DISPLAY_NAME_NODE_ID] = (
                self.value_as_localised_string(planning_ref_value)
            )
            display_name_tile.save()
            return

        display_name_tile.data[DISPLAY_NAME_NODE_ID] = self.value_as_localised_string(
            resource_id_value
        )
        display_name_tile.save()
