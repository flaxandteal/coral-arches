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


class MonumentRevisionRemap(View):
    MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
    MONUMENT_REVISION_GRAPH_ID = "4262df46-eabf-11ed-9e22-72d420f37f11"
    monument_resource = None
    nodes = {"monument": {}, "revision": {}}
    alias_mapping = {}
    exlucded_aliases = [
        "monument",
        "monument_revision",
        # "associated_monument_revisions", # Will be used to track revision history
    ]

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
            if not map_data["monument"] and not map_data["revision"]:
                missing_map[alias] = "Missing monument and revision mapping"
                continue
            if not map_data["monument"]:
                missing_map[alias] = "Missing monument mapping"
                continue
            if not map_data["revision"]:
                missing_map[alias] = "Missing revision mapping"
                continue
        return missing_map

    def id_alias_map_with_node_id(self):
        node_mapping = {}
        for value in self.alias_mapping.values():
            node_id = value["monument"]["node_id"] if value["monument"] else None
            if node_id:
                node_mapping[node_id] = value
        return node_mapping

    def get_node_configuration(self, target, graph):
        nodes = graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            alias = node.alias
            if alias in self.exlucded_aliases:
                continue
            node_id = str(node.nodeid)
            nodegroup_id = str(node.nodegroup.nodegroupid) if node.nodegroup else None
            if alias not in self.alias_mapping:
                self.alias_mapping[alias] = {"monument": None, "revision": None}
            self.alias_mapping[alias][target] = {
                "node_id": node_id,
                "nodegroup_id": nodegroup_id,
                "alias": alias,
                "node": node,
            }

    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        monument_resource_id = data.get("monumentResourceId")
        monument_resource = self.get_resource(monument_resource_id)

        monument_graph = self.get_graph(self.MONUMENT_GRAPH_ID)
        revision_graph = self.get_graph(self.MONUMENT_REVISION_GRAPH_ID)

        self.get_node_configuration("monument", monument_graph)
        self.get_node_configuration("revision", revision_graph)

        missing_map = self.missing_alias_map()
        node_mapping = self.id_alias_map_with_node_id()

        monument_tiles = Tile.objects.filter(resourceinstance=monument_resource)

        revision_resource = Resource.objects.create(graph=revision_graph)
        revision_resource_id = str(revision_resource.resourceinstanceid)

        failed_node_data = {}
        for tile in monument_tiles:
            try:
                tile_nodegroup_id = str(tile.nodegroup.nodegroupid)
                revision_nodegroup = node_mapping[tile_nodegroup_id]["revision"][
                    "node"
                ].nodegroup
                data = deepcopy(tile.data)
                for data_node_id in tile.data.keys():
                    revision_node_id = node_mapping[data_node_id]["revision"]["node_id"]
                    if not revision_node_id:
                        failed_node_data[data_node_id] = node_mapping[data_node_id]
                        raise Exception("Revision node ID does not exist")
                    data[revision_node_id] = data[data_node_id]
                    del data[data_node_id]
                new_tile = Tile(
                    tileid=uuid.uuid4(),
                    resourceinstance=revision_resource,
                    parenttile=None,  # HOw ??????????
                    data=data,
                    nodegroup=revision_nodegroup,
                )
                new_tile.save()
            except Exception as e:
                print(e)

        return JSONResponse(
            {
                "message": "Monument has been remapped successfully",
                "monumentResourceId": monument_resource_id,
                "revisionResourceId": revision_resource_id,
                # "aliasMapping": self.alias_mapping,
                # "nodeMapping": node_mapping,
                "missingMap": missing_map,
                "failedNodeData": failed_node_data,
            }
        )
