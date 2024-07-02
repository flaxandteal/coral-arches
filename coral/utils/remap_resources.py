from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.graph import Graph
from arches.app.models.tile import Tile
from copy import deepcopy

logger = logging.getLogger(__name__)





class RemapResources:
 MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
    MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
    target_resource = None
    destination_resource = None
    nodes = {"target": {}, "destination": {}}
    alias_mapping = {}
    node_mapping = {}
    excluded_aliases = [
        "monument",
        "monument_revision",
        "approvals",
        "designation_descriptions"
    ]
    # Will populate from excluded aliases, you only need to provide 
    # the parent nodegroups alias to exclude the tiles from the remapping process
    excluded_nodegroup_ids = [] 
    parent_nodegroup_ids = []
    created_parent_tiles = {}

    def get_resource(self, resource_id):
        resource = None
        try:
            resource = Resource.objects.filter(pk=resource_id).first()
        except Resource.DoesNotExist:
            raise f"Resource ID ({resource_id}) does not exist"
        return resource

    def get_graph(self, graph_id):
        graph = None
        try:
            graph = Graph.objects.filter(pk=graph_id).first()
        except Graph.DoesNotExist:
            raise f"Graph ID ({graph_id}) does not exist"
        return graph

    def missing_alias_map(self):
        missing_map = {}
        for alias, map_data in self.alias_mapping.items():
            if not map_data["target"] and not map_data["destination"]:
                missing_map[alias] = "Missing target and destination mapping"
                # If there is none for both then there shouldn't be a tile
                # to get processed
                continue
            if not map_data["target"]:
                missing_map[alias] = "Missing target mapping"
                # Exclude the parent nodegroup so the tile won't get processed
                self.excluded_nodegroup_ids.append(map_data["destination"]["nodegroup_id"])
                continue
            if not map_data["destination"]:
                missing_map[alias] = "Missing destination mapping"
                # Exclude the parent nodegroup so the tile won't get processed
                self.excluded_nodegroup_ids.append(map_data["target"]["nodegroup_id"])
                continue
        return missing_map

    def id_alias_map_with_node_id(self):
        self.node_mapping = {}
        for value in self.alias_mapping.values():
            node_id = value["target"]["node_id"] if value["target"] else None
            if node_id:
                self.node_mapping[node_id] = value
        return self.node_mapping

    def get_node_configuration(self, target, graph):
        nodes = graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            print('node: ', node)
            alias = node.alias
            nodegroup_id = str(node.nodegroup.nodegroupid) if node.nodegroup else None
            if alias in self.excluded_aliases:
                if nodegroup_id: 
                    self.excluded_nodegroup_ids.append(nodegroup_id)
                continue
            node_id = str(node.nodeid)
            if alias not in self.alias_mapping:
                self.alias_mapping[alias] = {"target": None, "destination": None}
            parent_nodegroup_id = (
                str(node.nodegroup.parentnodegroup_id)
                if node.nodegroup.parentnodegroup_id
                else None
            )
            self.alias_mapping[alias][target] = {
                "node_id": node_id,
                "nodegroup_id": nodegroup_id,
                "alias": alias,
                "node": node,
                "parent_nodegroup": parent_nodegroup_id,
            }
            if (
                parent_nodegroup_id
                and parent_nodegroup_id not in self.parent_nodegroup_ids
            ):
                self.parent_nodegroup_ids.append(parent_nodegroup_id)

    def get_nodegroup(self, nodegroup_id):
        nodegroup = None
        try:
            nodegroup = models.NodeGroup.objects.filter(pk=nodegroup_id).first()
        except models.NodeGroup.DoesNotExist:
            raise f"Nodegroup ID ({nodegroup_id}) does not exist"
        return nodegroup

    def get_parent_nodegroup_from_tile(self, tile):
        return (
            str(tile.nodegroup.parentnodegroup_id)
            if tile.nodegroup.parentnodegroup_id
            else None
        )

    def get_parent_tile(self, tile):
        parent_tile = None
        parent_nodegroup_id = self.get_parent_nodegroup_from_tile(tile)

        if not parent_nodegroup_id:
            return parent_tile

        target_parent_tile_id = str(tile.parenttile.tileid)
        if target_parent_tile_id in self.created_parent_tiles:
            return self.created_parent_tiles[target_parent_tile_id]

        destination_parent_nodegroup = self.node_mapping[parent_nodegroup_id]["destination"][
            "node"
        ].nodegroup

        parent_tile = Tile(
            tileid=uuid.uuid4(),
            resourceinstance=self.destination_resource,
            parenttile=None,
            data={},
            nodegroup=destination_parent_nodegroup,
        )
        parent_tile.save()
        self.created_parent_tiles[target_parent_tile_id] = parent_tile

        return parent_tile

    def post(self, request):
        # Some how these requests manage to maintain state from the previous
        self.target_resource = None
        self.destination_resource = None
        self.nodes = {"target": {}, "destination": {}}
        self.alias_mapping = {}
        self.node_mapping = {}
        self.excluded_nodegroup_ids = [] 
        self.parent_nodegroup_ids = []
        self.created_parent_tiles = {}

        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")
        self.target_resource = self.get_resource(target_resource_id)

        target_graph = self.get_graph(self.MONUMENT_GRAPH_ID)
        destination_graph = self.get_graph(self.MONUMENT_REVISION_GRAPH_ID)

        if (
            self.target_resource.graph != target_graph
            and self.target_resource.graph != destination_graph
        ):
            raise "The resource ID provided does not belong to Monument or Monument Revision"

        if self.target_resource.graph == destination_graph:
            return JSONResponse(
                {
                    "message": "This is a remapped Monument",
                    "destinationResourceId": str(
                        self.target_resource.resourceinstanceid
                    ),
                }
            )

        self.get_node_configuration("target", target_graph)
        self.get_node_configuration("destination", destination_graph)

        missing_map = self.missing_alias_map()
        self.node_mapping = self.id_alias_map_with_node_id()

        target_tiles = list(
            Tile.objects.filter(resourceinstance=self.target_resource)
        )

        self.destination_resource = Resource.objects.create(
            graph=destination_graph, principaluser=request.user
        )
        destination_resource_id = str(self.destination_resource.resourceinstanceid)

        # Sort tiles so that the very top level parent tiles are created first
        # this allows child parent tiles of the main parent tile to use the
        # correct parent tile they belong to

        parent_target_tiles = {}
        temp_parent_target_tiles = []
        temp_target_tiles = []
        for tile in target_tiles:
            tile_nodegroup_id = str(tile.nodegroup.nodegroupid)
            if tile_nodegroup_id not in self.parent_nodegroup_ids:
                temp_target_tiles.append(tile)
                continue
            parent_target_tiles[tile_nodegroup_id] = tile

        for parent_nodegroup_id in self.parent_nodegroup_ids:
            if parent_nodegroup_id not in parent_target_tiles:
                continue
            tile = parent_target_tiles[parent_nodegroup_id]
            temp_parent_target_tiles.append(tile)

        ordered_target_tiles = temp_parent_target_tiles + temp_target_tiles

        # Loop through the targets tiles and re-create them on the destination model
        # with the correct parent tile look ups
        for tile in ordered_target_tiles:
            tile_nodegroup_id = str(tile.nodegroup.nodegroupid)
            parent_nodegroup_id = self.get_parent_nodegroup_from_tile(tile)

            # If the nodegroup is a parent tile nodegroup and contains no
            # additional data. Continue and let a child tile create it if
            # it was missing from the look up
            if tile_nodegroup_id in self.parent_nodegroup_ids and not len(tile.data):
                continue
            
            # If the nodegroup id is part of the excluded which is created
            # from the excluded aliases continue to the next tile
            if tile_nodegroup_id in self.excluded_nodegroup_ids:
                continue

            node_map = self.node_mapping[tile_nodegroup_id]

            if not node_map["destination"]:
                continue

            if (
                parent_nodegroup_id is not None
                and parent_nodegroup_id not in self.node_mapping
            ):
                continue

            destination_nodegroup = node_map["destination"]["node"].nodegroup

            data = deepcopy(tile.data)
            parent_tile = self.get_parent_tile(tile)
            try:
                for data_node_id in tile.data.keys():
                    destination_node_id = self.node_mapping[data_node_id]["destination"]["node_id"]
                    data[destination_node_id] = data[data_node_id]
                    del data[data_node_id]

                new_tile = Tile(
                    tileid=uuid.uuid4(),
                    resourceinstance=self.destination_resource,
                    parenttile=parent_tile,
                    data=data,
                    nodegroup=destination_nodegroup,
                )
                new_tile.save()

                # If this is true, it means the parent tile had data and needed
                # that data to be remapped. We then add into the created parent
                # tiles dictionary for child tiles to look up
                if tile_nodegroup_id in self.parent_nodegroup_ids:
                    self.created_parent_tiles[str(tile.tileid)] = new_tile

            except Exception as e:
                print("Failed while remapping the target tile data: ", e)
                raise e

        parent_target_nodegroup = self.get_nodegroup(
            "6375be6e-dc64-11ee-924e-0242ac120006"
        )
        parent_target_tile = Tile(
            resourceinstance=self.destination_resource,
            data={
                "6375be6e-dc64-11ee-924e-0242ac120006": [
                    {
                        "resourceId": target_resource_id,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    }
                ]
            },
            nodegroup=parent_target_nodegroup,
        )
        parent_target_tile.save()

        return JSONResponse(
            {
                "message": "Target has been remapped successfully",
                "targetResourceId": target_resource_id,
                "destinationResourceId": destination_resource_id,
                # "aliasMapping": self.alias_mapping,
                # "nodeMapping": self.node_mapping,
                "missingMap": missing_map,
            }
        )
