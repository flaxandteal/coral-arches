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

        # 'monument' is the root node
        # 'monument_revision' only exists on monument
        exlucded_aliases = ["monument", "monument_revision"]

        rev_graph = None
        graph = None
        if resource:
            graph_id = resource.graph_id
            graph = Graph.objects.filter(pk=graph_id).first()

            revision_graph_id = "4262df46-eabf-11ed-9e22-72d420f37f11"
            rev_graph = Graph.objects.filter(pk=revision_graph_id).first()

            for node in graph.nodes.values():
                if node.alias in exlucded_aliases:
                    continue
                if node.alias not in mapping:
                    mapping[node.alias] = {
                        "monument": {
                            "nodegroup_id": str(node.nodegroup_id),
                            "node_id": str(node.nodeid),
                        },
                        "revision": {},
                    }

            for node in rev_graph.nodes.values():
                if node.alias in exlucded_aliases:
                    continue
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

        tiles = Tile.objects.filter(resourceinstance=resource_instance_id)

        remapped_tiles = []

        new_rev_resource = Resource.objects.create(
            graph=rev_graph,
        )
        print("new_rev_resource: ", new_rev_resource.resourceinstanceid)

        new_resource_id = str(new_rev_resource.resourceinstanceid)

        # new_location_data_tile = {
        #     "data": {},
        #     "tileid": None,
        #     "resourceinstance": new_resource_id,
        #     "nodegroup": "426401a0-eabf-11ed-9e22-72d420f37f11",
        #     "parenttile_id": None,
        #     "provisionaledits": None,
        #     "sortorder": 0,
        #     "tiles": [],
        # }
        new_location_data_tile, success = Tile.objects.get_or_create(
            resourceinstance_id=new_resource_id,
            nodegroup_id="426401a0-eabf-11ed-9e22-72d420f37f11",
            data={},
        )

        for edge in rev_graph.edges.values():
            print("edge: ", edge.rangenode_id)

        location_data_nodegroups = [
            str(edge.rangenode_id)
            for edge in rev_graph.edges.values()
            if str(edge.domainnode_id) == "426401a0-eabf-11ed-9e22-72d420f37f11"
        ]
        print("location_data_nodegroups: ", location_data_nodegroups)

        location_data_tile_exists = False
        for tile in tiles:
            new_tile = copy.deepcopy(tile)
            new_tile = new_tile.serialize()

            nodegroup_id = str(new_tile["nodegroup_id"])
            found_mapping = nodegroup_map[nodegroup_id]

            # This ignores the system ref nodegroup from MONUMENT
            # to allow a new one to be created for MONUMENT REVISION
            if found_mapping[nodegroup_id] == "42635b60-eabf-11ed-9e22-72d420f37f11":
                continue

            # Location data MONUMENT nodegroup id
            if nodegroup_id == "87d39b2e-f44f-11eb-9a4a-a87eeabdefba":
                location_data_tile_exists = True
                continue

            if not found_mapping:
                print("WARNING: Mapping not found ", tile)
                continue

            # nodegroup from the tiles endpoint has no _id at the end
            del new_tile["nodegroup_id"]
            del new_tile["resourceinstance_id"]
            new_tile["nodegroup"] = found_mapping[nodegroup_id]

            new_data = {}

            for key, value in new_tile["data"].items():
                if key not in found_mapping:
                    print("WARNING: Key not in found mapping ", key, value)
                new_data[found_mapping[key]] = value

            if new_tile["parenttile_id"]:
                print("had parent tile: ", dict(new_tile))

            new_tile["data"] = new_data
            new_tile["tileid"] = None

            print('new_tile["nodegroup"]: ', new_tile["nodegroup"])
            if new_tile["nodegroup"] in location_data_nodegroups:
                print("true! this tile is part of location data")
                print("new_location_data_tile: ", new_location_data_tile)
                print("new_location_data_tile.tileid: ", new_location_data_tile.tileid)
                new_tile["parenttile_id"] = new_location_data_tile.tileid
            else:
                new_tile["parenttile_id"] = None

            new_tile["resourceinstance"] = new_resource_id

            remapped_tiles.append(new_tile)

        # # "data": {},
        # # "nodegroup_id": "f0550a8c-8e04-11ee-85e6-0242ac190002",
        # # "parenttile_id": null,
        # # "provisionaledits": null,
        # # "resourceinstance_id": "def2bb9d-d4da-4113-9b86-9e871d4be0e9",
        # # "sortorder": 0,
        # # "tileid": "7036b4c7-9e85-44d8-afd0-079df143bb2c",
        # # "tiles": []
        # # if not location_data_tile_exists:
        # print("creating location data tile")
        # new_location_data_tile = {
        #     "data": {},
        #     "tileid": None,
        #     "resourceinstance": new_resource_id,
        #     "nodegroup": "426401a0-eabf-11ed-9e22-72d420f37f11",
        #     "parenttile_id": None,
        #     "provisionaledits": None,
        #     "sortorder": 0,
        #     "tiles": [],
        # }

        for tile in remapped_tiles:
            tile, success = Tile.objects.get_or_create(
                resourceinstance_id=tile["resourceinstance"],
                nodegroup_id=tile["nodegroup"],
                data=tile["data"],
                parenttile=new_location_data_tile if tile["parenttile_id"] else None,
            )

        # tile, success = Tile.objects.get_or_create(
        #     resourceinstance_id=new_resource_id,
        #     nodegroup_id="426401a0-eabf-11ed-9e22-72d420f37f11",
        #     data={},
        # )
        # print("tile: ", tile)

        # new_location_data_tile["tileid"] = tile.tileid

        # remapped_tiles.append(new_location_data_tile)

        return JSONResponse(
            {
                # "resource": resource,
                # "graph": graph,
                # "rev_graph": rev_graph,
                # "mapping": mapping,
                # "graph.nodes": graph.nodes,
                # "tiles_orig": tiles,
                # "nodegroup_map": nodegroup_map,
                "resourceinstance_id": new_resource_id,
                "tiles": remapped_tiles,
            }
        )
