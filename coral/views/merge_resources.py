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
        parent_nodegroups = []

        for tile in base_tiles:
            nodegroup_id = str(tile.nodegroup_id)
            if nodegroup_id not in merge_map:
                parent_nodegroup_id = (
                    str(nodegroups[nodegroup_id].parentnodegroup_id)
                    if nodegroups[nodegroup_id].parentnodegroup_id
                    else None
                )
                if parent_nodegroup_id and parent_nodegroup_id not in parent_nodegroups:
                    parent_nodegroups.append(parent_nodegroup_id)
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
                if parent_nodegroup_id and parent_nodegroup_id not in parent_nodegroups:
                    parent_nodegroups.append(parent_nodegroup_id)
                merge_map[nodegroup_id] = {
                    "base_tiles": [],
                    "merge_tiles": [tile],
                    "cardinality": nodegroups[nodegroup_id].cardinality,
                    "parent_nodegroup_id": parent_nodegroup_id,
                }
                continue
            merge_map[nodegroup_id]["merge_tiles"].append(tile)

        # Remove parent nodegroup tiles from the merge map

        existing_parent_tiles = {}

        for nodegroup_id in parent_nodegroups:
            merge_data = merge_map[nodegroup_id]
            for tile in merge_data["base_tiles"]:
                existing_parent_tiles[str(tile.tileid)] = tile
            for tile in merge_data["merge_tiles"]:
                existing_parent_tiles[str(tile.tileid)] = tile
            del merge_map[nodegroup_id]

        print("merge_map: ", merge_map)

        # Create new tiles for the base record from the existing merge tiles

        parent_tiles_map = {}

        for nodegroup_id, merge_data in merge_map.items():
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

                # No change required
                if base_tile and not merge_tile:
                    print("no base tile and no merge tile")
                    continue

                # Create new tile
                if merge_tile and not base_tile:
                    print("merge tile exists without base tile")

                    parent_tile = None
                    if merge_tile.parenttile:
                        print("tile has parent tile")
                        base_parent_tile = Tile.objects.filter(
                            resourceinstance=base_resource,
                            nodegroup=merge_tile.parenttile.nodegroup,
                        ).first()
                        if base_parent_tile:
                            print("base had an existing parent tile")
                            parent_tile = base_parent_tile
                        else:
                            print("creating a parent tile to be used for the base")
                            parent_tile = Tile(
                                tileid=uuid.uuid4(),
                                resourceinstance=base_resource,
                                data={},
                                nodegroup=merge_tile.parenttile.nodegroup,
                            )
                            parent_tile.save()

                    new_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=base_resource,
                        parenttile=parent_tile,  # FIXME: This needs to be supported
                        data=merge_tile.data,
                        nodegroup=merge_tile.nodegroup,
                    )
                    new_tile.save()
                    continue

                # Overwrite data on the base tile
                if base_tile and merge_tile:
                    print("base tile and merge tile exist")
                    base_tile.data = merge_tile.data
                    base_tile.save()
                    continue

            # Create the additional tiles for the base resource
            if merge_data["cardinality"] == "n":
                print("cadinality n")
                for tile in merge_data["merge_tiles"]:
                    parent_tile = None
                    if tile.parenttile:
                        print("tile has parent tile")
                        base_parent_tile = Tile.objects.filter(
                            resourceinstance=base_resource,
                            nodegroup=tile.parenttile.nodegroup,
                        ).first()
                        if base_parent_tile:
                            print("base had an existing parent tile")
                            parent_tile = base_parent_tile
                        else:
                            print("creating a parent tile to be used for the base")
                            parent_tile = Tile(
                                tileid=uuid.uuid4(),
                                resourceinstance=base_resource,
                                data={},
                                nodegroup=tile.parenttile.nodegroup,
                            )
                            parent_tile.save()

                    new_tile = Tile(
                        tileid=uuid.uuid4(),
                        resourceinstance=base_resource,
                        parenttile=parent_tile,  # FIXME: This needs to be supported
                        data=tile.data,
                        nodegroup=tile.nodegroup,
                    )
                    new_tile.save()


        return JSONResponse(
            {"message": "Resources have been merged"}
            # {
            #     base_resource: base_resource,
            #     merge_resource: merge_resource,
            #     base_tiles: base_tiles,
            #     merge_tiles: merge_tiles,
            #     merge_map: merge_map,
            # }
        )
