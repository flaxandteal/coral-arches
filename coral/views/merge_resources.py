from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

logger = logging.getLogger(__name__)


class MergeResources(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        base_resource_id = data.get("baseResourceId")
        merge_resource_id = data.get("mergeResourceId")

        print("base_resource_id: ", base_resource_id)
        print("merge_resource_id: ", merge_resource_id)

        if not base_resource_id or not merge_resource_id:
            raise "Missing base or merge resource ID"

        # Get resources from their resource IDs

        base_resource = None
        try:
            base_resource = Resource.objects.filter(pk=base_resource_id).first()
        except Resource.DoesNotExist:
            return JSONResponse({"error": "Base resource ID does not exist"})
        print("base_resource: ", base_resource)

        merge_resource = None
        try:
            merge_resource = Resource.objects.filter(pk=merge_resource_id).first()
        except Resource.DoesNotExist:
            return JSONResponse({"error": "Merge resource ID does not exist"})
        print("merge_resource: ", merge_resource)

        # Confirm graphs are identical

        if base_resource.graph != merge_resource.graph:
            raise "Cannot merge resources from different graphs"

        graph = base_resource.graph

        # Grab all the tiles for both resources

        base_tiles = Tile.objects.filter(
            resourceinstance=base_resource.resourceinstanceid
        )
        merge_tiles = Tile.objects.filter(
            resourceinstance=merge_resource.resourceinstanceid
        )

        print("base_tiles: ", base_tiles)
        print("merge_tiles: ", merge_tiles)

        # Get nodegroups

        nodegroups = {}
        nodes = graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            if node.is_collector:
                nodegroup_id = str(node.nodegroup.nodegroupid)
                if nodegroup_id in nodegroups:
                    print("Nodegroup ID is already present in the dict: ", nodegroup_id)
                nodegroups[nodegroup_id] = node.nodegroup

        print("nodegroups: ", nodegroups)

        # Find which tiles are from the same nodegroup

        merge_map = {}

        for tile in base_tiles:
            nodegroup_id = str(tile.nodegroup_id)
            if nodegroup_id not in merge_map:
                parent_nodegroup_id = (
                    str(nodegroups[nodegroup_id].parentnodegroup_id)
                    if nodegroups[nodegroup_id].parentnodegroup_id
                    else None
                )
                merge_map[nodegroup_id] = {
                    "base_tiles": [tile],
                    "merge_tiles": [],
                    "cardinality": nodegroups[nodegroup_id].cardinality,
                    "parent_nodegroup_id": parent_nodegroup_id,
                }
                continue
            merge_map[nodegroup_id]["base_tiles"].append(tile)

        for tile in merge_tiles:
            nodegroup_id = str(tile.nodegroup_id)
            if nodegroup_id not in merge_map:
                parent_nodegroup_id = (
                    str(nodegroups[nodegroup_id].parentnodegroup_id)
                    if nodegroups[nodegroup_id].parentnodegroup_id
                    else None
                )
                merge_map[nodegroup_id] = {
                    "base_tiles": [],
                    "merge_tiles": [tile],
                    "cardinality": nodegroups[nodegroup_id].cardinality,
                    "parent_nodegroup_id": parent_nodegroup_id,
                }
                continue
            merge_map[nodegroup_id]["merge_tiles"].append(tile)

        print("merge_map: ", merge_map)

        # Create new tiles for the base record from the existing merge tiles

        for nodegroup_id, merge_data in merge_map.items():
            if merge_data['cardinality'] == 1:
                # Base will take precidence most likely no code is needed
                pass
            if merge_data['cardinality'] == 'n':
                # Create the additional tiles for the base resource
                pass

        return JSONResponse(
            {
                base_resource: base_resource,
                merge_resource: merge_resource,
                base_tiles: base_tiles,
                merge_tiles: merge_tiles,
                merge_map: merge_map,
            }
        )
