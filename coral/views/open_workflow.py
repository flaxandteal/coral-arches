from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from django.forms.models import model_to_dict

logger = logging.getLogger(__name__)


class OpenWorkflow(View):
    # def find_workflow_history(self, resource_instance_id):
    #     # FIXME: What if a resource id appears in another workflows history
    #     # FIXME: Get upstream Arches workflow slug into the database table
    #     histories = models.WorkflowHistory.objects.all().order_by("-created")
    #     found_history = None
    #     for history in histories:
    #         for componentdata in history.componentdata.values():
    #             if "value" not in componentdata:
    #                 continue
    #             if type(componentdata["value"]) == list:
    #                 for manycomponentdata in componentdata["value"]:
    #                     if (
    #                         manycomponentdata.get("resourceInstanceId")
    #                         == resource_instance_id
    #                     ):
    #                         found_history = history
    #                         break
    #                 else:
    #                     continue
    #                 break
    #             elif (
    #                 componentdata["value"]["resourceInstanceId"] == resource_instance_id
    #             ):
    #                 found_history = history
    #                 break
    #         else:
    #             continue
    #         break
    #     return found_history

    # def update_existing_history(self, history):
    #     # Refresh tiles with latest data
    #     for key, componentdata in history.componentdata.items():
    #         if type(componentdata["value"]) == list:
    #             # FIXME: Currently if a many workflow card is editted from outside the workflow
    #             # the results won't be updated into the workflow. Something like this might work
    #             # but don't have the time at the moment.
    #             #
    #             # print('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX componentdata[value]: ', componentdata['value'])
    #             # nodegroup_id = componentdata['value'][0].get('nodegroupId')
    #             # print('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX nodegroup: ', nodegroup_id)
    #             # tiles = models.TileModel.objects.filter(resourceinstance=resource_instance_id, nodegroup=nodegroup_id)
    #             # print('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX tiles: ', tiles)
    #             # componentdata["value"] = list(tiles)
    #             remove_tile_ids = []
    #             for i in range(len(componentdata["value"])):
    #                 manycomponentdata = componentdata["value"][i]
    #                 tile_id = manycomponentdata.get("tileId") or manycomponentdata.get(
    #                     "tileid"
    #                 )
    #                 tile = None
    #                 try:
    #                     tile = models.TileModel.objects.get(pk=tile_id)
    #                 except models.TileModel.DoesNotExist:
    #                     remove_tile_ids.append(tile_id)
    #                     continue
    #                 manycomponentdata["data"] = tile.data

    #             componentdata["value"] = list(
    #                 filter(
    #                     lambda data: (data.get("tileId") or data.get("tileid"))
    #                     not in remove_tile_ids,
    #                     componentdata["value"],
    #                 )
    #             )

    #         else:
    #             tile = models.TileModel.objects.get(pk=componentdata["value"]["tileId"])
    #             componentdata["value"]["tileData"] = json.dumps(tile.data)
    #     return history

    # def get_resource(self, resource_id):
    #     resource = None
    #     try:
    #         resource = Resource.objects.filter(pk=resource_id).first()
    #     except Resource.DoesNotExist:
    #         raise f"Resource ID ({resource_id}) does not exist"
    #     return resource

    # def get(self, request):
    #     resource_instance_id = request.GET.get("resource-id")
    #     workflow_id = request.GET.get("workflow-id")
    #     workflow_slug = request.GET.get("workflow-slug")

    #     found_history = self.find_workflow_history(resource_instance_id)
    #     print("found_history: ", found_history)

    #     if found_history:
    #         print("Taking found history path")
    #         found_history = self.update_existing_history(found_history)
    #         found_history.completed = False
    #         found_history.workflowid = workflow_id
    #         return JSONResponse(found_history)

    #     resource = self.get_resource(pk=resource_instance_id)
    #     print("resource: ", resource)

    #     resource_tiles = Tile.objects.filter(
    #         resourceinstance=resource.resourceinstanceid
    #     )
    #     print("resource_tiles: ", resource_tiles)



    # def get_node_configuration(self):
    #     nodes = self.graph.node_set.all().select_related("nodegroup")
    #     for node in nodes:
    #         self.nodes[str(node.nodeid)] = node
    #         if node.is_collector:
    #             nodegroup_id = str(node.nodegroup.nodegroupid)
    #             self.nodegroups[nodegroup_id] = node.nodegroup

    workflow_step_data = {}
    workflow_component_data = {}
    step_mapping = []
    step_config = []
    grouped_tiles = {}

    def get_plugin(self, plugin_slug):
        plugin = None
        try:
            plugin = models.Plugin.objects.filter(slug=plugin_slug).first()
        except models.Plugin.DoesNotExist:
            raise f"Plugin slug ({plugin_slug}) does not exist"
        return plugin

    def get_resource(self, resource_id):
        resource = None
        try:
            resource = Resource.objects.filter(pk=resource_id).first()
        except Resource.DoesNotExist:
            raise f"Resource ID ({resource_id}) does not exist"
        return resource

    def generate_step_data_structure(self, step_config):
        workflow_step_data = {}
        step_mapping = []
        for step in step_config:
            step_name = step["name"]
            workflow_step_data[step_name] = {"componentIdLookup": {}}

            # Tends to only contain one index but using loop for saftey
            for layout_section in step["layoutSections"]:
                for component_config in layout_section["componentConfigs"]:
                    unique_instance_name = component_config["uniqueInstanceName"]
                    required_parent_tiles = component_config["parameters"].get(
                        "requiredParentTiles", []
                    )
                    data_lookup_id = str(uuid.uuid4())
                    workflow_step_data[step_name]["componentIdLookup"][
                        unique_instance_name
                    ] = data_lookup_id
                    step_mapping.append(
                        {
                            "unique_instance_name": unique_instance_name,
                            "nodegroup_id": component_config["parameters"].get('nodegroupid'),
                            "tiles_managed": component_config["tilesManaged"],
                            "data_lookup_id": data_lookup_id,
                            "required_parent_tiles": required_parent_tiles,
                        }
                    )
        return workflow_step_data, step_mapping

    def group_tiles(self, tiles):
        grouped_tiles = {}
        for tile in tiles:
            nodegroup_id = str(tile.nodegroup.nodegroupid)
            if nodegroup_id not in grouped_tiles:
                grouped_tiles[nodegroup_id] = []
            grouped_tiles[nodegroup_id].append(tile)
        return grouped_tiles

    def get_parent_tile_lookups(self, required_parent_tiles, grouped_tiles):
        lookup_tile_ids = {}
        for lookup in required_parent_tiles:
            nodegroup_id = lookup["parentNodegroupId"]
            lookup_name = lookup["lookupName"]
            tiles = grouped_tiles.get(nodegroup_id, [])
            tile = tiles[0] if len(tiles) else None
            if tile:
                lookup_tile_ids[lookup_name] = str(tile.tileid)
        return lookup_tile_ids

    def post(self, request):
        # For some reason I need to reset the class defaults every time
        # a request is sent. It will persist the data and add it onto the
        # next workflow generation?
        self.workflow_step_data = {}
        self.workflow_component_data = {}
        self.step_mapping = []
        self.step_config = []
        self.grouped_tiles = {}

        resource_id = request.GET.get("resource-id")
        workflow_id = request.GET.get("workflow-id")
        workflow_slug = request.GET.get("workflow-slug")
        user_id = request.user.pk

        # Get step data from plugin

        data = json.loads(request.body.decode("utf-8"))
        step_config = data.get("stepConfig")
        print('step_config: ', step_config)
        if step_config:
            self.step_config = step_config
        else:
            plugin = self.get_plugin(workflow_slug)
            self.step_config = plugin.config["stepData"]  # <-- This is confusing

        # Generate the structure for step data

        self.workflow_step_data, self.step_mapping = self.generate_step_data_structure(
            self.step_config
        )

        # Get all the resources tiles

        self.resource = self.get_resource(resource_id)
        resource_tiles = Tile.objects.filter(resourceinstance=self.resource)

        # Loop through tiles and add them to the component data lookup

        self.grouped_tiles = self.group_tiles(resource_tiles)

        idx = 1
        for map_data in self.step_mapping:
            print("running step mapping: ", idx)
            idx += 1
            nodegroup_id = map_data["nodegroup_id"]
            data_lookup_id = map_data["data_lookup_id"]
            tiles = self.grouped_tiles.get(nodegroup_id, [])
            if not len(tiles):
                continue

            parent_tile_lookups = self.get_parent_tile_lookups(
                map_data["required_parent_tiles"], self.grouped_tiles
            )

            if map_data["tiles_managed"] == "one":
                # FIXME: In this case the workflow only wants one tile but
                # if the cardinality allows for multiple how do we
                # decide which tile is the one that should be displayed
                tile = tiles[0]
                component_data = {
                    "nodegroupId": nodegroup_id,
                    "resourceInstanceId": resource_id,
                    "tileId": str(tile.tileid),
                    "tileData": json.dumps(tile.data),
                }
                result = {**component_data, **parent_tile_lookups}
                self.workflow_component_data[data_lookup_id] = {"value": result}
                continue

            # FIXME: Many tiles current dosen't support addtional saved data!
            if map_data["tiles_managed"] == "many":
                self.workflow_component_data[data_lookup_id] = {
                    "value": list(
                        map(
                            lambda tile: {
                                "data": tile.data,
                                "nodegroup_id": str(tile.nodegroup.nodegroupid),
                                "parenttile_id": (
                                    str(tile.parenttile.tileid)
                                    if tile.parenttile
                                    else None
                                ),
                                "provisionaledits": None,
                                "resourceinstance_id": str(
                                    tile.resourceinstance.resourceinstanceid
                                ),
                                "sortorder": 0,
                                "tileid": str(tile.tileid),
                                "tiles": [],
                            },
                            tiles,
                        )
                    )
                }
                continue

        workflow_history = {
            "user": user_id,
            "completed": False,
            "workflowid": workflow_id,
            "componentdata": self.workflow_component_data,
            "stepdata": self.workflow_step_data,
        }

        return JSONResponse(
            workflow_history
            # {
            #     "message": "Generated workflow history from resource ID",
            #     "workflowHistory": workflow_history
            #     # "groupedTiles": self.grouped_tiles,
            #     # # "stepData": self.step_config,
            #     # "workflowStepData": self.workflow_step_data,
            #     # "workflowComponentData": self.workflow_component_data,
            #     # "stepMapping": self.step_mapping,
            # }
        )


# {
#     "workflowid": "100c229c-6a52-4413-ba4a-2dd1c7086dda",
#     "completed": false,
#     "componentdata": {
#         "3323e206-b50c-4159-82a3-1ae5759d5c64": {
#             "value": [
#                 {
#                     "data": {
#                         "98ac6c12-ba0a-11ee-987d-0242ac180006": "b81d4b16-0633-4d7a-b4b2-5c2d3e2e782e",
#                         "98ac7874-ba0a-11ee-987d-0242ac180006": "59a0c936-3f60-44f9-9e37-67b6ed0f4fa4",
#                         "98ac7af4-ba0a-11ee-987d-0242ac180006": "586a2776-7f4a-4be9-9219-3a9896c7f965",
#                         "98ac7e00-ba0a-11ee-987d-0242ac180006": "2024-02-15",
#                         "98ac8008-ba0a-11ee-987d-0242ac180006": "2024-02-29",
#                         "98ac81a2-ba0a-11ee-987d-0242ac180006": [
#                             {
#                                 "inverseOntologyProperty": "ac41d9be-79db-4256-b368-2f4559cfbe55",
#                                 "ontologyProperty": "ac41d9be-79db-4256-b368-2f4559cfbe55",
#                                 "resourceId": "6ad549c6-5e29-4052-9c70-30c94cd7d686",
#                                 "resourceXresourceId": "76a09b43-d7aa-46b2-9739-82cb4468c876"
#                             }
#                         ],
#                         "98ac830a-ba0a-11ee-987d-0242ac180006": "d3b75e3a-638e-490e-8d1b-bbb5c504ce94",
#                         "98ac8472-ba0a-11ee-987d-0242ac180006": "abb5cae5-f2b9-4fbb-bbbc-f64083094014",
#                         "98ac85d0-ba0a-11ee-987d-0242ac180006": "fc0f5902-ec10-48ad-a445-15cf14e67acb"
#                     },
#                     "nodegroup_id": "98ac662c-ba0a-11ee-987d-0242ac180006",
#                     "parenttile_id": null,
#                     "provisionaledits": null,
#                     "resourceinstance_id": "9df635e7-403d-4034-b1c7-e19321f2f29a",
#                     "sortorder": 0,
#                     "tileid": "cd91bde7-52d0-47b1-bf5d-ffa8a7a278b7",
#                     "tiles": []
#                 }
#             ]
#         }
#     }
# }

# {
#     "completed": false,
#     "componentdata": {
#         "2e3b4682-0e92-4400-8666-7d820d7ef8b6": {
#             "value": [
#                 {
#                     "nodegroupId": "074effd0-b5e8-11ee-8e91-0242ac120006",
#                     "resourceInstanceId": "a7968224-4482-4b4c-a2f8-dc5e1eb443fe",
#                     "tileData": "{\"074f05d4-b5e8-11ee-8e91-0242ac120006\":\"daa4cddc-8636-4842-b836-eb2e10aabe18\",\"074f0746-b5e8-11ee-8e91-0242ac120006\":{\"en\":{\"direction\":\"ltr\",\"value\":\"adwdadawda\"}},\"074f0a16-b5e8-11ee-8e91-0242ac120006\":null,\"074f0b7e-b5e8-11ee-8e91-0242ac120006\":\"f666c25d-90a4-4b1d-bca6-465a7e4815ce\",\"074f0cdc-b5e8-11ee-8e91-0242ac120006\":\"6fbe3775-e51d-4f90-af53-5695dd204c9a\"}",
#                     "tileId": "6ca64dde-f720-4724-b94e-e3db3f6bc3db"
#                 }
#             ]
#         },
#         "4f4c77ba-c00f-4901-85a7-5a7123521885": {
#             "value": [
#                 {
#                     "nodegroupId": "89bf628e-b552-11ee-805b-0242ac120006",
#                     "resourceInstanceId": "a7968224-4482-4b4c-a2f8-dc5e1eb443fe",
#                     "tileData": "{\"89bf6c48-b552-11ee-805b-0242ac120006\":{\"en\":{\"direction\":\"ltr\",\"value\":\"dawddddddddddddawd\"}},\"89bf6e64-b552-11ee-805b-0242ac120006\":\"35508b82-062a-469f-830a-6040c5e5eb8c\",\"89bf6fd6-b552-11ee-805b-0242ac120006\":\"6fbe3775-e51d-4f90-af53-5695dd204c9a\"}",
#                     "tileId": "01b991a1-b766-4ba5-bef2-abe5e5b402bd"
#                 }
#             ]
#         },
#         "8afa6d86-38f6-49f1-a034-990b8b17bc19": {
#             "value": [
#                 {
#                     "nodegroupId": "ba39c036-b551-11ee-94ee-0242ac120006",
#                     "resourceInstanceId": "a7968224-4482-4b4c-a2f8-dc5e1eb443fe",
#                     "tileData": "{\"ba3a0262-b551-11ee-94ee-0242ac120006\":0,\"ba3a03e8-b551-11ee-94ee-0242ac120006\":\"7346be23-bff6-42dc-91d0-7c5182aa0031\",\"ba3a055a-b551-11ee-94ee-0242ac120006\":\"1992741b-cc36-4613-b04e-943fa8c9d6fa\",\"ba3a083e-b551-11ee-94ee-0242ac120006\":{\"en\":{\"direction\":\"ltr\",\"value\":\"ENF/2024/tYP9zq\"}},\"ba3a09a6-b551-11ee-94ee-0242ac120006\":\"7346be23-bff6-42dc-91d0-7c5182aa0031\",\"ba3a0c76-b551-11ee-94ee-0242ac120006\":\"7346be23-bff6-42dc-91d0-7c5182aa0031\",\"ba3a0dde-b551-11ee-94ee-0242ac120006\":\"1992741b-cc36-4613-b04e-943fa8c9d6fa\",\"ba3a0f46-b551-11ee-94ee-0242ac120006\":\"1992741b-cc36-4613-b04e-943fa8c9d6fa\",\"ba3a10ae-b551-11ee-94ee-0242ac120006\":null}",
#                     "tileId": "d8ab5b11-ff73-4880-98d8-f4b7e526dd05"
#                 }
#             ]
#         }
#     },
#     "stepdata": {
#         "enforcement-details": {
#             "componentIdLookup": {
#                 "associated-resources": "96ca98c6-b975-4f15-84ff-138b3dae448a",
#                 "case-reference": "2e3b4682-0e92-4400-8666-7d820d7ef8b6",
#                 "flagged-by": "17c8f144-3622-400d-a027-f992199951f3",
#                 "flagged-date": "5952ab7d-1248-4604-a773-d005419a00c3",
#                 "reason-description": "4f4c77ba-c00f-4901-85a7-5a7123521885"
#             },
#             "locked": false,
#             "stepId": "005202da-2cb2-482e-98a5-f7ecd2df23d5"
#         },
#         "initial-step": {
#             "componentIdLookup": {
#                 "system-reference": "8afa6d86-38f6-49f1-a034-990b8b17bc19"
#             },
#             "locked": false,
#             "stepId": "197e17f1-dbfe-4795-b125-dea4be6a5422"
#         }
#     },
#     "user_id": 1,
#     "workflowid": "db28ec03-1229-4efe-8ffb-f94a9fd172d7"
# }
