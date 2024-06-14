from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from copy import deepcopy
from arches.app.utils.data_management.resources.exporter import ResourceExporter

logger = logging.getLogger(__name__)


class MergeResources(View):
    merge_map = {}
    nodegroups = {}
    parent_nodegroups = []
    graph = None
    parent_tiles_merge_map = {}
    parent_tiles_map = {}
    base_resource = None
    merge_resource = None
    nodes = {}

    def populate_merge_map(self, target, tiles):
        for tile in tiles:
            nodegroup_id = str(tile.nodegroup_id)
            if nodegroup_id not in self.merge_map:
                parent_nodegroup_id = (
                    str(self.nodegroups[nodegroup_id].parentnodegroup_id)
                    if self.nodegroups[nodegroup_id].parentnodegroup_id
                    else None
                )
                if (
                    parent_nodegroup_id
                    and parent_nodegroup_id not in self.parent_nodegroups
                ):
                    self.parent_nodegroups.append(parent_nodegroup_id)
                self.merge_map[nodegroup_id] = {
                    "base_tiles": [],
                    "merge_tiles": [],
                    "cardinality": self.nodegroups[nodegroup_id].cardinality,
                    "parent_nodegroup_id": parent_nodegroup_id,
                }
            self.merge_map[nodegroup_id][target].append(tile)

    def get_node_configuration(self):
        nodes = self.graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            self.nodes[str(node.nodeid)] = node
            if node.is_collector:
                nodegroup_id = str(node.nodegroup.nodegroupid)
                self.nodegroups[nodegroup_id] = node.nodegroup

    def remove_parent_nodegroup_tiles(self):
        for nodegroup_id in self.parent_nodegroups:
            if nodegroup_id in self.merge_map:
                self.parent_tiles_merge_map[nodegroup_id] = self.merge_map[nodegroup_id]
                del self.merge_map[nodegroup_id]

    def discover_parent_tile(self, tile):
        parent_tile = None
        if tile.parenttile:
            parent_nodegroup_id = str(tile.parenttile.nodegroup.nodegroupid)
            parent_merge_data = self.parent_tiles_merge_map[parent_nodegroup_id]

            # Check if a parent tile exists on the base resource and if
            # it does use it as the parent tile. Otherwise create a
            # new one to be used as the parent tile
            if parent_merge_data["cardinality"] == "1":
                base_parent_tile = (
                    parent_merge_data["base_tiles"][0]
                    if len(parent_merge_data["base_tiles"])
                    else None
                )
                if base_parent_tile:
                    parent_tile = base_parent_tile
                else:
                    parent_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        data={},
                        nodegroup=tile.parenttile.nodegroup,
                    )
                    parent_tile.save()
                    parent_merge_data["base_tiles"].append(parent_tile)

            # Check for an existing parent tile that was indexed aganist
            # the parent tile id from the merge resource. If it exists
            # use that parent tile otherwise create a new parent tile
            if parent_merge_data["cardinality"] == "n":
                merge_parent_tile_id = str(tile.parenttile.tileid)
                if merge_parent_tile_id not in self.parent_tiles_map:
                    parent_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        data={},
                        nodegroup=tile.parenttile.nodegroup,
                    )
                    parent_tile.save()
                    self.parent_tiles_map[merge_parent_tile_id] = parent_tile
                else:
                    parent_tile = self.parent_tiles_map[merge_parent_tile_id]

        return parent_tile

    def get_resource(self, resource_id):
        resource = None
        try:
            resource = Resource.objects.filter(pk=resource_id).first()
        except Resource.DoesNotExist:
            raise f"Resource ID ({resource_id}) does not exist"
        return resource

    def get_nodegroup(self, nodegroup_id):
        nodegroup = None
        try:
            nodegroup = models.NodeGroup.objects.filter(pk=nodegroup_id).first()
        except models.NodeGroup.DoesNotExist:
            raise f"Nodegroup ID ({nodegroup_id}) does not exist"
        return nodegroup

    def merge_default(self, base_node_value, merge_node_value):
        if base_node_value != None:
            return base_node_value
        return merge_node_value

    def merge_resource_instance_list(self, base_node_value, merge_node_value):
        resource_map = {}
        for resource in base_node_value:
            if resource["resourceId"] not in resource_map:
                resource_map[resource["resourceId"]] = resource
        for resource in merge_node_value:
            if resource["resourceId"] not in resource_map:
                resource_map[resource["resourceId"]] = resource
        return list(resource_map.values())

    def merge_list(self, base_node_value, merge_node_value):
        return list(set(base_node_value + merge_node_value))

    def merge_geojson_feature_collection(self, base_node_value, merge_node_value):
        feature_map = {}
        result = deepcopy(merge_node_value)
        for feature in base_node_value["features"] + merge_node_value["features"]:
            if feature["id"] not in feature_map:
                feature_map[feature["id"]] = feature
        result["features"] = list(feature_map.values())
        return result

    def merge_tile_data(self, base_tile_data, merge_tile_data):
        result = deepcopy(merge_tile_data)
        #
        # Keep in mind there might be more datatypes that
        # require a custom merge strategy other than overwrite
        # the existing node value.
        #
        # semantic - Not used
        # string - Overwrite
        # number - Overwrite
        # file-list - Unchecked - Will need custom can't test currently
        # concept - Overwrite
        # concept-list - Custom needed
        # geojson-feature-collection - Custom needed
        # date - Overwrite
        # node-value - Overwrite
        # edtf - Overwrite
        # annotation - Overwrite
        # url - Overwrite
        # resource-instance - Overwrite
        # resource-instance-list - Custom needed
        # boolean - Overwrite
        # domain-value - Overwrite
        # domain-value-list - Custom needed
        # bngcentrepoint - Overwrite
        # user - Overwrite

        # An ideal implementation would be for datatypes objects to require a
        # function that can merge two of the same together. This would mean
        # that newly created datatypes will be setup and ready to be merged
        # by calling their exclusive merge function.

        for node_id in base_tile_data.keys():
            datatype = self.nodes[node_id].datatype
            match datatype:
                case "resource-instance-list":
                    result[node_id] = self.merge_resource_instance_list(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
                    break
                case "concept-list":
                    result[node_id] = self.merge_list(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
                    break
                case "domain-value-list":
                    result[node_id] = self.merge_list(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
                    break
                case "geojson-feature-collection":
                    result[node_id] = self.merge_geojson_feature_collection(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
                case _:
                    result[node_id] = self.merge_default(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
        return result

    def jsonify_original_resources(
        self, base_resource_id, merge_resource_id, merge_tracker_resource_id
    ):
        resource_exporter = ResourceExporter("json", configs=None, single_file=False)
        base_json_file = resource_exporter.export(
            graph_id=self.graph.graphid,
            resourceinstanceids=[base_resource_id],
            languages=None,
        )
        merge_json_file = resource_exporter.export(
            graph_id=self.graph.graphid,
            resourceinstanceids=[merge_resource_id],
            languages=None,
        )

        base_json =  base_json_file[0]['outputfile'].getvalue()
        merge_json =  merge_json_file[0]['outputfile'].getvalue()

        base_resource_nodegroup = self.get_nodegroup(
            "07cf7760-f197-11ee-9b0c-0242ac170006"
        )
        merge_resource_nodegroup = self.get_nodegroup(
            "3d1a1858-f197-11ee-9b0c-0242ac170006"
        )

        merge_tracker_resource = self.get_resource(merge_tracker_resource_id)

        base_resource_tile = Tile(
            resourceinstance=merge_tracker_resource,
            data={
                "07cf7760-f197-11ee-9b0c-0242ac170006": {
                    "en": {
                        "value": base_json
                    }
                }
            },
            nodegroup=base_resource_nodegroup,
        )
        base_resource_tile.save()

        merge_resource_tile = Tile(
            resourceinstance=merge_tracker_resource,
            data={
                "3d1a1858-f197-11ee-9b0c-0242ac170006": {
                    "en": {
                        "value": merge_json
                    }
                }
            },
            nodegroup=merge_resource_nodegroup,
        )
        merge_resource_tile.save()

    def configure_tracker_relationship(
        self, base_resource_id, merge_resource_id, merge_tracker_resource_id
    ):
        merge_tracker_resource = self.get_resource(merge_tracker_resource_id)
        merge_tracker_associated_resources_nodegroup = self.get_nodegroup(
            "9967e2ea-cce2-11ee-af2a-0242ac180006"
        )
        associated_resources_tile = Tile(
            resourceinstance=merge_tracker_resource,
            data={
                "9967e2ea-cce2-11ee-af2a-0242ac180006": [
                    {
                        "resourceId": base_resource_id,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    },
                    {
                        "resourceId": merge_resource_id,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    },
                ]
            },
            nodegroup=merge_tracker_associated_resources_nodegroup,
        )
        associated_resources_tile.save()

    def merge_resources(
        self, base_resource_id, merge_resource_id, merge_tracker_resource_id
    ):
        if not base_resource_id or not merge_resource_id:
            raise "Missing base or merge resource ID"

        # Get resources from their resource IDs

        self.base_resource = self.get_resource(base_resource_id)
        self.merge_resource = self.get_resource(merge_resource_id)

        # Confirm graphs are identical then set graph

        if self.base_resource.graph != self.merge_resource.graph:
            raise "Cannot merge resources from different graphs"

        self.graph = self.base_resource.graph

        # Store an original copy of the the 2 resources

        if merge_tracker_resource_id:
            self.jsonify_original_resources(
                base_resource_id, merge_resource_id, merge_tracker_resource_id
            )

        # Grab all the tiles for both resources

        base_tiles = Tile.objects.filter(
            resourceinstance=self.base_resource.resourceinstanceid
        )
        merge_tiles = Tile.objects.filter(
            resourceinstance=self.merge_resource.resourceinstanceid
        )

        # Get nodegroups

        self.get_node_configuration()

        # Find which tiles are from the same nodegroup

        self.populate_merge_map("base_tiles", base_tiles)
        self.populate_merge_map("merge_tiles", merge_tiles)

        # Remove parent nodegroup tiles from the merge map we don't want to create additonal ones

        self.remove_parent_nodegroup_tiles()

        # Create new tiles for the base record from the existing merge tiles

        for nodegroup_id, merge_data in self.merge_map.items():
            if merge_data["cardinality"] == "1":
                # We should be safe to use index 0 because of the
                # cardinality validation only allowing 1 tile
                base_tile = (
                    merge_data["base_tiles"][0]
                    if len(merge_data["base_tiles"])
                    else None
                )
                merge_tile = (
                    merge_data["merge_tiles"][0]
                    if len(merge_data["merge_tiles"])
                    else None
                )

                # Create new tile
                if merge_tile and not base_tile:
                    parent_tile = self.discover_parent_tile(merge_tile)
                    new_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        parenttile=parent_tile,
                        data=merge_tile.data,
                        nodegroup=merge_tile.nodegroup,
                    )
                    new_tile.save()
                    continue

                # Merge data from base tile over the merge tile and update
                # the base tile with the merged data
                if base_tile and merge_tile:
                    merged_tile_data = self.merge_tile_data(
                        base_tile.data, merge_tile.data
                    )
                    base_tile.data = merged_tile_data
                    base_tile.save()
                    continue

            # Create the additional tiles for the base resource
            if merge_data["cardinality"] == "n":
                for tile in merge_data["merge_tiles"]:
                    parent_tile = self.discover_parent_tile(tile)
                    new_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        parenttile=parent_tile,
                        data=tile.data,
                        nodegroup=tile.nodegroup,
                    )
                    new_tile.save()

        # Create a new tile for the merge tracker and
        # relate the two resources used in the merge
        if merge_tracker_resource_id:
            self.configure_tracker_relationship(
                base_resource_id, merge_resource_id, merge_tracker_resource_id
            )

    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        base_resource_id = data.get("baseResourceId")
        merge_resource_id = data.get("mergeResourceId")
        merge_tracker_resource_id = data.get("mergeTrackerResourceId")

        self.merge_resources(
            base_resource_id, merge_resource_id, merge_tracker_resource_id
        )

        self.merge_resource.delete(user=request.user)

        return JSONResponse({"message": "Resources have been merged"})
