from django.views.generic import View
from arches.app.utils.response import JSONResponse

# from django.http import HttpRequest, HttpResponse
import time
import json
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models.graph import Graph
import copy
import uuid

# MONUMENT_GRAPH_ID = '076f9381-7b00-11e9-8d6b-80000b44d1d9'


class MonumentRemapping(View):
    def __init__(self):
        pass

    def get(self, request):
        resource_instance_id = request.GET.get("resource-id")
        resource = None

        if resource_instance_id:
            try:
                resource = Resource.objects.filter(pk=resource_instance_id).first()
            except Resource.DoesNotExist:
                return JSONResponse({"error": "Resource does not exist"})

        mapping = {}
        nodegroup_map = {}

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
                            "nodegroup_id": str(node.nodegroup_id),
                            "node_id": str(node.nodeid),
                        },
                        "revision": {},
                    }

            for node in rev_graph.nodes.values():
                if node.alias not in mapping:
                    mapping[node.alias] = {
                        "monument": {},
                        "revision": {
                            "nodegroup_id": str(node.nodegroup_id),
                            "node_id": str(node.nodeid),
                        },
                    }
                else:
                    mapping[node.alias]["revision"] = {
                        "nodegroup_id": str(node.nodegroup_id),
                        "node_id": str(node.nodeid),
                    }

            for key, item in mapping.items():
                monument_nodegroup_id = item["monument"].get("nodegroup_id")
                if not monument_nodegroup_id:
                    print("WARNING: monument_nodegroup_id missing", key, item)
                if monument_nodegroup_id not in nodegroup_map:
                    nodegroup_map[monument_nodegroup_id] = {}

                monument_node_id = item["monument"].get("node_id")

                revision_nodegroup_id = item["revision"].get("nodegroup_id")
                if not revision_nodegroup_id:
                    print("WARNING: revision_nodegroup_id missing", key, item)
                revision_node_id = item["revision"].get("node_id")

                # nodegroup_map[monument_nodegroup_id]["alias"] = key
                nodegroup_map[str(monument_nodegroup_id)][
                    str(monument_nodegroup_id)
                ] = str(revision_nodegroup_id)
                nodegroup_map[str(monument_nodegroup_id)][str(monument_node_id)] = str(
                    revision_node_id
                )

                pass

        tiles = Tile.objects.filter(resourceinstance=resource_instance_id)

        remapped_tiles = []

        for tile in tiles:
            new_tile = copy.deepcopy(tile)
            new_tile = new_tile.serialize()
            print("new_tile: ", new_tile)

            nodegroup_id = str(new_tile["nodegroup_id"])

            found_mapping = nodegroup_map[nodegroup_id]
            print("found_mapping: ", found_mapping)

            print("nodegroup_id: ", nodegroup_id)
            print(
                "42635b60-eabf-11ed-9e22-72d420f37f11: ",
                nodegroup_id == "42635b60-eabf-11ed-9e22-72d420f37f11",
            )
            if found_mapping[nodegroup_id] == "42635b60-eabf-11ed-9e22-72d420f37f11":
                continue

            if not found_mapping:
                print("WARNING: Mapping not found ", tile)

            new_tile["nodegroup_id"] = found_mapping[nodegroup_id]

            new_data = {}

            for key, value in new_tile["data"].items():
                if key not in found_mapping:
                    print("WARNING: Key not in found mapping ", key, value)

                print("found_mapping[key]: ", found_mapping[(key)])

                new_data[found_mapping[key]] = value

            new_tile["data"] = new_data

            new_tile["tileid"] = None
            new_tile["resourceinstance_id"] = str(uuid.uuid4())

            remapped_tiles.append(new_tile)

        return JSONResponse(
            {
                # "resource": resource,
                # "graph": graph,
                # "rev_graph": rev_graph,
                # "mapping": mapping,
                # "graph.nodes": graph.nodes,
                # "tiles": tiles,
                # "nodegroup_map": nodegroup_map,
                "tiles": remapped_tiles,
            }
        )
