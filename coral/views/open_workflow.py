from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

logger = logging.getLogger(__name__)


class OpenWorkflow(View):
    workflow_step_data = {}
    workflow_component_data = {}
    step_mapping = []
    step_config = []
    grouped_tiles = {}
    nodes = {}
    nodegroups = {}
    setup_workflows = {
        "licensing-workflow": "setup_licensing_workflow",
    }

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
                    unique_instance_name = component_config.get("uniqueInstanceName")
                    if unique_instance_name:
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
                                "nodegroup_id": component_config["parameters"].get(
                                    "nodegroupid"
                                ),
                                "tiles_managed": component_config["tilesManaged"],
                                "data_lookup_id": data_lookup_id,
                                "required_parent_tiles": required_parent_tiles,
                            }
                        )
        return workflow_step_data, step_mapping

    def group_tiles(self, tiles):
        for tile in tiles:
            nodegroup_id = str(tile.nodegroup.nodegroupid)

            parent_tile_ids = self.open_config.get("parentTileIds", {})
            parent_nodegroup_id = (
                str(tile.parenttile.nodegroup.nodegroupid) if tile.parenttile else None
            )

            if parent_nodegroup_id and parent_nodegroup_id in parent_tile_ids:
                parent_tile_id = str(tile.parenttile.tileid)
                if parent_tile_id != parent_tile_ids[parent_nodegroup_id]:
                    continue

            if nodegroup_id not in self.grouped_tiles:
                self.grouped_tiles[nodegroup_id] = []
            self.grouped_tiles[nodegroup_id].append(tile)

    def get_parent_tile_lookups(self, required_parent_tiles, grouped_tiles):
        lookup_tile_ids = {}
        for lookup in required_parent_tiles:
            nodegroup_id = lookup["parentNodegroupId"]
            lookup_name = lookup["lookupName"]
            tiles = grouped_tiles.get(nodegroup_id, [])

            tile = None
            parent_tile_ids = self.open_config.get("parentTileIds", {})
            if parent_tile_ids and nodegroup_id in parent_tile_ids:
                tile_id = parent_tile_ids.get(nodegroup_id)
                if tile_id:
                    for t in tiles:
                        if str(t.tileid) == tile_id:
                            tile = t
                            # Found the correct tile
                            break
                else:
                    # No tile id exists so creating new
                    tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.resource,
                        data={},
                        nodegroup=self.nodegroups[nodegroup_id],
                        sortorder=None,
                    )
                    tile.save()
                    self.group_tiles([tile])
            else:
                if len(tiles):
                    tile = tiles[0]
                else:
                    tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.resource,
                        data={},
                        nodegroup=self.nodegroups[nodegroup_id],
                        sortorder=None,
                    )
                    tile.save()

            if tile:
                lookup_tile_ids[lookup_name] = str(tile.tileid)

        return lookup_tile_ids

    def get_node_configuration(self, graph):
        nodes = graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            self.nodes[str(node.nodeid)] = node
            if node.is_collector:
                nodegroup_id = str(node.nodegroup.nodegroupid)
                self.nodegroups[nodegroup_id] = node.nodegroup

    def setup_licensing_workflow(self):
        LICENSE_SYSTEM_REFERENCE_NODEGROUP = "991c3c74-48b6-11ee-85af-0242ac140007"
        LICENSE_RESOURCE_ID_NODE = "991c49b2-48b6-11ee-85af-0242ac140007"
        LICENSE_DECISION_NODEGROUP = "2749ea5a-48cb-11ee-be76-0242ac140007"
        LICENSE_APPLICATION_DETAILS = "4f0f655c-48cf-11ee-8e4e-0242ac140007"
        LICENSE_CM_REFERENCE_NODEGROUP = "b84fa9c6-bad2-11ee-b3f2-0242ac180006"
        ACTIVITY_SYSTEM_REFERENCE_NODEGROUP = "e7d695ff-9939-11ea-8fff-f875a44e0e11"
        ACTIVITY_RESOURCE_ID_NODE = "e7d69603-9939-11ea-9e7f-f875a44e0e11"
        ACTIVITY_LOCATION_DATA_NODEGROUP = "a5416b49-f121-11eb-8e2c-a87eeabdefba"

        # Get the application id used for the license and activity

        license_system_reference_tile = Tile.objects.filter(
            resourceinstance=self.resource, nodegroup=LICENSE_SYSTEM_REFERENCE_NODEGROUP
        ).first()

        app_id = (
            license_system_reference_tile.data.get(LICENSE_RESOURCE_ID_NODE)
            .get("en")
            .get("value")
        )

        # Lookup the activity that contains the same application id

        query_activity_resource_id = {
            f"data__{ACTIVITY_RESOURCE_ID_NODE}__en__value__contains": app_id,
        }
        activity_system_reference_tile = Tile.objects.filter(
            nodegroup_id=ACTIVITY_SYSTEM_REFERENCE_NODEGROUP,
            **query_activity_resource_id,
        ).first()

        activity_resource = activity_system_reference_tile.resourceinstance
        activity_resource_id = str(activity_resource.resourceinstanceid)

        activity_tiles = Tile.objects.filter(resourceinstance=activity_resource)
        self.group_tiles(activity_tiles)

        # Grab all the needed tiles

        location_data_tile, success = Tile.objects.get_or_create(
            resourceinstance=activity_resource,
            nodegroup=ACTIVITY_LOCATION_DATA_NODEGROUP,
        )
        decision_tile, success = Tile.objects.get_or_create(
            resourceinstance=self.resource,
            nodegroup=LICENSE_DECISION_NODEGROUP,
        )
        application_details_tile, success = Tile.objects.get_or_create(
            resourceinstance=self.resource,
            nodegroup=LICENSE_APPLICATION_DETAILS,
        )
        cm_reference_tile, success = Tile.objects.get_or_create(
            resourceinstance=self.resource,
            nodegroup=LICENSE_CM_REFERENCE_NODEGROUP,
        )

        # Store the tile IDs in an object

        self.additional_saved_values[LICENSE_SYSTEM_REFERENCE_NODEGROUP] = {
            "activityResourceId": activity_resource_id,
            "activityLocationTileId": str(location_data_tile.tileid),
            "decisionTileId": str(decision_tile.tileid),
            "applicationDetailsTileId": str(application_details_tile.tileid),
            "cmRefTileId": str(cm_reference_tile.tileid),
        }

    def post(self, request):
        # For some reason I need to reset the class defaults every time
        # a request is sent. It will persist the data and add it onto the
        # next workflow generation?
        self.workflow_step_data = {}
        self.workflow_component_data = {}
        self.step_mapping = []
        self.step_config = []
        self.grouped_tiles = {}
        self.additional_saved_values = {}
        self.open_config = {}
        self.nodes = {}
        self.nodegroups = {}

        data = json.loads(request.body.decode("utf-8"))
        step_config = data.get("stepConfig")
        resource_id = data.get("resourceId")
        workflow_id = data.get("workflowId")
        workflow_slug = data.get("workflowSlug")
        self.open_config = data.get("openConfig", {})
        user_id = request.user.pk

        # Get step data from plugin

        if step_config:
            self.step_config = step_config
        else:
            plugin = self.get_plugin(workflow_slug)
            self.step_config = plugin.config["stepData"]  # <-- This is confusing

        # Get all the resources tiles

        self.resource = self.get_resource(resource_id)
        resource_tiles = Tile.objects.filter(resourceinstance=self.resource)

        # Get node configs

        self.get_node_configuration(self.resource.graph)

        # If setup required

        if workflow_slug in self.setup_workflows:
            setup_function = getattr(self, self.setup_workflows[workflow_slug], None)
            setup_function()

        # Generate the structure for step data

        self.workflow_step_data, self.step_mapping = self.generate_step_data_structure(
            self.step_config
        )

        # Loop through tiles and add them to the component data lookup

        self.group_tiles(resource_tiles)

        for map_data in self.step_mapping:
            nodegroup_id = map_data["nodegroup_id"]
            data_lookup_id = map_data["data_lookup_id"]
            tiles = self.grouped_tiles.get(nodegroup_id, [])
            if not len(tiles):
                continue

            parent_tile_lookups = self.get_parent_tile_lookups(
                map_data["required_parent_tiles"], self.grouped_tiles
            )

            addtional_data = self.additional_saved_values.get(nodegroup_id, {})

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
                result = {**component_data, **parent_tile_lookups, **addtional_data}
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

        return JSONResponse(workflow_history)
