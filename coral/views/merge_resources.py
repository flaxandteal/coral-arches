from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from copy import deepcopy

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

        print("nodes: ", self.nodes)
        print("nodegroups: ", self.nodegroups)

    def remove_parent_nodegroup_tiles(self):
        for nodegroup_id in self.parent_nodegroups:
            self.parent_tiles_merge_map[nodegroup_id] = self.merge_map[nodegroup_id]
            del self.merge_map[nodegroup_id]

        print("merge_map: ", self.merge_map)
        print("parent_tiles_merge_map: ", self.parent_tiles_merge_map)

    def discover_parent_tile(self, tile):
        parent_tile = None
        if tile.parenttile:
            print("tile has parent tile")
            parent_nodegroup_id = str(tile.parenttile.nodegroup.nodegroupid)
            parent_merge_data = self.parent_tiles_merge_map[parent_nodegroup_id]

            if parent_merge_data["cardinality"] == "1":
                print("parent cardinality was 1")
                base_parent_tile = (
                    parent_merge_data["base_tiles"][0]
                    if len(parent_merge_data["base_tiles"])
                    else None
                )
                if base_parent_tile:
                    print("base had an existing parent tile")
                    parent_tile = base_parent_tile
                else:
                    print("creating a parent tile to be used for the base")
                    parent_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        data={},
                        nodegroup=tile.parenttile.nodegroup,
                    )
                    parent_tile.save()
                    parent_merge_data["base_tiles"].append(parent_tile)

            if parent_merge_data["cardinality"] == "n":
                print("parent cardinality was n")

                merge_parent_tile_id = str(tile.parenttile.tileid)
                if merge_parent_tile_id not in self.parent_tiles_map:
                    print("parent tile has not been created on base")
                    parent_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=self.base_resource,
                        data={},
                        nodegroup=tile.parenttile.nodegroup,
                    )
                    parent_tile.save()
                    self.parent_tiles_map[merge_parent_tile_id] = parent_tile
                else:
                    print("parent tile exists on base")
                    parent_tile = self.parent_tiles_map[merge_parent_tile_id]
        return parent_tile

    def get_resource(self, resource_id):
        resource = None
        try:
            resource = Resource.objects.filter(pk=resource_id).first()
        except Resource.DoesNotExist:
            raise f"Resource ID ({resource_id}) does not exist"
        print("base_resource: ", self.base_resource)
        return resource

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

    def merge_tile_data(self, base_tile_data, merge_tile_data):
        result = deepcopy(merge_tile_data)
        for node_id in base_tile_data.keys():
            datatype = self.nodes[node_id].datatype
            match datatype:
                case "resource-instance-list":
                    result[node_id] = self.merge_resource_instance_list(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
                    break
                case _:
                    result[node_id] = self.merge_default(
                        base_tile_data[node_id], merge_tile_data[node_id]
                    )
        return result

    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        base_resource_id = data.get("baseResourceId")
        merge_resource_id = data.get("mergeResourceId")

        print("base_resource_id: ", base_resource_id)
        print("merge_resource_id: ", merge_resource_id)

        if not base_resource_id or not merge_resource_id:
            raise "Missing base or merge resource ID"

        # Get resources from their resource IDs

        self.base_resource = self.get_resource(base_resource_id)
        print("base_resource: ", self.base_resource)

        self.merge_resource = self.get_resource(merge_resource_id)
        print("base_resource: ", self.base_resource)

        # Confirm graphs are identical then set graph

        if self.base_resource.graph != self.merge_resource.graph:
            raise "Cannot merge resources from different graphs"

        self.graph = self.base_resource.graph

        # Grab all the tiles for both resources

        base_tiles = Tile.objects.filter(
            resourceinstance=self.base_resource.resourceinstanceid
        )
        merge_tiles = Tile.objects.filter(
            resourceinstance=self.merge_resource.resourceinstanceid
        )

        print("base_tiles: ", base_tiles)
        print("merge_tiles: ", merge_tiles)

        # Get nodegroups

        self.get_node_configuration()

        # Find which tiles are from the same nodegroup

        self.populate_merge_map("base_tiles", base_tiles)
        self.populate_merge_map("merge_tiles", merge_tiles)

        # Remove parent nodegroup tiles from the merge map we don't want to create additonal ones

        self.remove_parent_nodegroup_tiles()

        # Create new tiles for the base record from the existing merge tiles

        for nodegroup_id, merge_data in self.merge_map.items():
            print("remap nodegroup_id: ", nodegroup_id)
            if merge_data["cardinality"] == "1":
                print("cadinality 1")
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

                print("base_tile: ", base_tile)
                print("merge_tile: ", merge_tile)

                # Create new tile
                if merge_tile and not base_tile:
                    print("merge tile exists without base tile")
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
                    print("base tile and merge tile exist")
                    merged_tile_data = self.merge_tile_data(
                        base_tile.data, merge_tile.data
                    )
                    base_tile.data = merged_tile_data
                    base_tile.save()
                    continue

            # Create the additional tiles for the base resource
            if merge_data["cardinality"] == "n":
                print("cadinality n")
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

        return JSONResponse({"message": "Resources have been merged"})
