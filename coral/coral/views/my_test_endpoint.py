from django.views.generic import View
from arches.app.utils.response import JSONResponse

# from django.http import HttpRequest, HttpResponse
import time
import json
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models.graph import Graph

# MONUMENT_GRAPH_ID = '076f9381-7b00-11e9-8d6b-80000b44d1d9'


class MyTestEndpoint(View):
    def __init__(self):
        pass

    def get(self, request):
        resource_instance_id = request.GET.get("resource-id")
        resource = None

        if resource_instance_id:
            try:
                resource = Resource.objects.filter(
                    pk=resource_instance_id).first()
            except Resource.DoesNotExist:
                return JSONResponse({"error": "Resource does not exist"})

        mapping = {}

        graph = None
        if resource:
            graph_id = resource.graph_id
            graph = Graph.objects.filter(pk=graph_id).first()

            revision_graph_id = "4262df46-eabf-11ed-9e22-72d420f37f11"
            rev_graph = Graph.objects.filter(pk=revision_graph_id).first()

            for node in graph.nodes.values():
                if node.alias not in mapping:
                    mapping[node.alias] = {
                        "monument": {
                            "nodegroup_id": node.nodegroup_id,
                            "node_id": node.nodeid,
                        },
                        "revision": {},
                    }

            for node in rev_graph.nodes.values():
                if node.alias not in mapping:
                    mapping[node.alias] = {
                        "monument": {},
                        "revision": {
                            "nodegroup_id": node.nodegroup_id,
                            "node_id": node.nodeid,
                        },
                    }
                else:
                    mapping[node.alias]["revision"] = {
                        "nodegroup_id": node.nodegroup_id,
                        "node_id": node.nodeid,
                    }

        tiles = Tile.objects.filter(resourceinstance=resource_instance_id)

        remapped_tiles = []

        for tile in tiles:
            pass

        return JSONResponse(
            {
                "resource": resource,
                "graph": graph,
                "rev_graph": rev_graph,
                "mapping": mapping,
                "graph.nodes": graph.nodes,
                "tiles": tiles,
            }
        )
