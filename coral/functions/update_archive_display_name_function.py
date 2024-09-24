from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile

SYSTEM_REF_NODEGROUP = "3bdc39f8-9a93-11ea-b807-f875a44e0e11"
ARCHIVE_SOURCE_NAME_NODEGROUP = "145f9615-9ad2-11ea-b4d3-f875a44e0e11"
DISPLAY_NAME_NODEGROUP = "b5d2204c-442b-11ef-a57a-0242ac120002"

ARCHIVE_SOURCE_NAME_NODE = "145f961b-9ad2-11ea-bf90-f875a44e0e11"
RESOURCE_ID_NODE = "3bdc39fc-9a93-11ea-8cee-f875a44e0e11"
DISPLAY_NAME_NODE = "eb0b2aec-442b-11ef-a57a-0242ac120002"

details = {
    "functionid": "d9444f81-578e-43e6-9585-bd549a374585",
    "name": "Update Archive Display Name",
    "type": "node",
    "description": "Will update the display name depending on whether the source name is present",
    "defaultconfig": {"triggering_nodegroups": [SYSTEM_REF_NODEGROUP, ARCHIVE_SOURCE_NAME_NODEGROUP]},
    "classname": "UpdateArchiveDisplayName",
    "component": "",
}

class UpdateArchiveDisplayName(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        resource_id_name = tile.data.get(RESOURCE_ID_NODE, None)
        source_name = tile.data.get(ARCHIVE_SOURCE_NAME_NODE, None)

        name_data = source_name if source_name else resource_id_name

        try:
            display_tile =  Tile.objects.get(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=DISPLAY_NAME_NODEGROUP
            )
        except:
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=DISPLAY_NAME_NODEGROUP,
                data = { DISPLAY_NAME_NODE: name_data }
            )
            return

        if display_tile:
            if display_tile.data.get(DISPLAY_NAME_NODE) != name_data:
                display_tile.data[DISPLAY_NAME_NODE] = name_data
                display_tile.save()
        

        
