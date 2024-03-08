from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models
import json
import uuid
from arches.app.models.resource import Resource
from arches.app.models.graph import Graph
from arches.app.models.tile import Tile
from copy import deepcopy
from coral.views.merge_resources import MergeResources


REVISION_COMPLETE_NODEGROUP = "3c51740c-dbd0-11ee-8835-0242ac120006"
APPROVED_BY_NODE = "ad22dad6-dbd0-11ee-b0db-0242ac120006"
APPROVED_ON_NODE = "0cd0998c-dbd6-11ee-b0db-0242ac120006"
COMPLETED_BY_NODE = "3b267ffe-dbd1-11ee-b0db-0242ac120006"
COMPLETED_ON_NODE = "af5fd406-dbd1-11ee-b0db-0242ac120006"

PARENT_MONUMENT_NODEGROUP = "6375be6e-dc64-11ee-924e-0242ac120006"
PARENT_MONUMENT_NODE = PARENT_MONUMENT_NODEGROUP


details = {
    "functionid": "abde9ed3-1f84-4df4-9a32-e32527ba2aba",
    "name": "Apply Revision Function",
    "type": "node",
    "description": "Watches the Revision Complete nodegroup for the correct values to apply.",
    "defaultconfig": {"triggering_nodegroups": [REVISION_COMPLETE_NODEGROUP]},
    "classname": "ApplyRevisionFunction",
    "component": "",
}


class ApplyRevisionFunction(BaseFunction):
    MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
    MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
    monument_resource = None
    revision_resource = None
    nodes = {"monument": {}, "revision": {}}
    alias_mapping = {}
    node_mapping = {}
    exlucded_aliases = [
        "monument",
        "monument_revision",
        "parent_monument",
        "complete_revision",
        "approved_date",
        "approved_date_qualifier",
        "approved_date_qualifier_metatype",
        "approved_on",
        "completion_date",
        "completion_date_qualifier",
        "completion_date_qualifier_metatype",
        "completed_on",
        "completer",
        "completer_role_type",
        "completer_role_metatype",
        "completed_by",
        "approver_n1",
        "approver_role_type_n1",
        "approver_role_metatype",
        "approved_by_n1",
    ]
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
        self.node_mapping = {}
        for value in self.alias_mapping.values():
            node_id = value["revision"]["node_id"] if value["revision"] else None
            if node_id:
                self.node_mapping[node_id] = value
        return self.node_mapping

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
            parent_nodegroup_id = str(node.nodegroup.parentnodegroup_id)
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

    def get_parent_tile(self, tile, resource):
        parent_tile = None

        parent_nodegroup_id = (
            str(tile.nodegroup.parentnodegroup_id)
            if tile.nodegroup.parentnodegroup_id
            else None
        )
        if not parent_nodegroup_id:
            return parent_tile

        monument_parent_tile_id = str(tile.parenttile.tileid)
        if monument_parent_tile_id in self.created_parent_tiles:
            return self.created_parent_tiles[monument_parent_tile_id]

        revision_parent_nodegroup = self.node_mapping[parent_nodegroup_id]["monument"][
            "node"
        ].nodegroup

        parent_tile = Tile(
            tileid=uuid.uuid4(),
            resourceinstance=resource,
            parenttile=None,
            data={},
            nodegroup=revision_parent_nodegroup,
        )
        parent_tile.save()
        self.created_parent_tiles[monument_parent_tile_id] = parent_tile

        return parent_tile

    def generate_random_id(self, prefix, nodegroup_id, node_id, resource):
        import random
        import string
        from datetime import datetime

        unique = False
        while not unique:
            current_year = datetime.now().year
            random_suffix = "".join(
                random.choice(string.ascii_letters + string.digits) for _ in range(6)
            )
            id_format = f"{prefix}/{current_year}/{random_suffix}"
            node_value_query = {
                f"data__{node_id}__en__value__icontains": id_format,
            }
            query_result = Tile.objects.filter(
                nodegroup_id=nodegroup_id,
                **node_value_query,
            ).exclude(resourceinstance_id=resource)
            if len(query_result):
                continue
            unique = True
        return id_format

    def post_save(self, tile, request, context):
        self.revision_resource = tile.resourceinstance

        data = tile.data

        # Approved On 0cd0998c-dbd6-11ee-b0db-0242ac120006
        # Approved By ad22dad6-dbd0-11ee-b0db-0242ac120006
        # Completed By 3b267ffe-dbd1-11ee-b0db-0242ac120006
        # Completed On af5fd406-dbd1-11ee-b0db-0242ac120006

        if (
            not data["0cd0998c-dbd6-11ee-b0db-0242ac120006"]
            or not data["ad22dad6-dbd0-11ee-b0db-0242ac120006"]
            or not data["3b267ffe-dbd1-11ee-b0db-0242ac120006"]
            or not data["af5fd406-dbd1-11ee-b0db-0242ac120006"]
        ):
            return

        parent_monumnet_tile = Tile.objects.filter(
            resourceinstance_id=self.revision_resource,
            nodegroup_id=PARENT_MONUMENT_NODEGROUP,
        ).first()

        monument_node = parent_monumnet_tile.data[PARENT_MONUMENT_NODE]
        monument_resource_id = monument_node[0].get("resourceId")

        self.monument_resource = self.get_resource(monument_resource_id)

        # Get graph data and node configurations

        monument_graph = self.get_graph(self.MONUMENT_GRAPH_ID)
        revision_graph = self.get_graph(self.MONUMENT_REVISION_GRAPH_ID)

        self.get_node_configuration("monument", monument_graph)
        self.get_node_configuration("revision", revision_graph)

        # Map aliases with node ids

        self.node_mapping = self.id_alias_map_with_node_id()

        # Get tiles for both resources

        revision_tiles = Tile.objects.filter(resourceinstance=self.revision_resource)
        # monument_tiles = Tile.objects.filter(resourceinstance=self.monument_resource)

        self.new_monument_resource = Resource.objects.create(graph=monument_graph)
        new_monument_resource_id = str(self.new_monument_resource.resourceinstanceid)

        for tile in revision_tiles:
            tile_nodegroup_id = str(tile.nodegroup.nodegroupid)
            if tile_nodegroup_id in self.parent_nodegroup_ids:
                continue

            node_map = self.node_mapping.get(tile_nodegroup_id, None)
            if node_map:
                monument_nodegroup = self.node_mapping[tile_nodegroup_id]["monument"][
                    "node"
                ].nodegroup
            else:
                continue

            data = deepcopy(tile.data)

            failed_node_data = {}
            parent_tile = self.get_parent_tile(tile, self.new_monument_resource)
            try:
                for data_node_id in tile.data.keys():
                    monument_node_id = self.node_mapping[data_node_id]["monument"][
                        "node_id"
                    ]
                    if not monument_node_id:
                        failed_node_data[data_node_id] = self.node_mapping[data_node_id]
                        raise Exception("Monument node ID does not exist")
                    data[monument_node_id] = data[data_node_id]
                    del data[data_node_id]

                new_tile = Tile(
                    tileid=uuid.uuid4(),
                    resourceinstance=self.new_monument_resource,
                    parenttile=parent_tile,
                    data=data,
                    nodegroup=monument_nodegroup,
                )
                new_tile.save()
            except Exception as e:
                print("Failed while remapping the monument tile data: ", e)
                continue

        MERGE_RESOURCE_TRACKER_GRAPH_ID = "d9318eb6-f28d-427c-b061-6fe3021ce8aa"
        merge_resource_tracker_graph = self.get_graph(MERGE_RESOURCE_TRACKER_GRAPH_ID)
        merge_tracker_resource = Resource.objects.create(
            graph=merge_resource_tracker_graph
        )
        merge_tracker_associated_resources_nodegroup = self.get_nodegroup(
            "9967e2ea-cce2-11ee-af2a-0242ac180006"
        )
        merge_tracker_associated_resources_nodegroup = self.get_nodegroup(
            "9967e2ea-cce2-11ee-af2a-0242ac180006"
        )
        associated_resources_tile = Tile(
            resourceinstance=merge_tracker_resource,
            data={
                "9967e2ea-cce2-11ee-af2a-0242ac180006": [
                    {
                        "resourceId": str(self.revision_resource.resourceinstanceid),
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    },
                    {
                        "resourceId": str(self.monument_resource.resourceinstanceid),
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    },
                ]
            },
            nodegroup=merge_tracker_associated_resources_nodegroup,
        )
        associated_resources_tile.save()

        # FIXME: Need to configure a system reference number for the tracker resource

        # TRACKER_SYSTEM_REF_NODEGROUP = "d31655e2-ccdf-11ee-9264-0242ac180006"
        # TRACKER_SYSTEM_REF_NODE_VALUE = "d3168288-ccdf-11ee-9264-0242ac180006"
        # merge_tracker_sys_ref = Tile(
        #     resourceinstance=merge_tracker_resource,
        #     data={},
        #     nodegroup=self.get_nodegroup(TRACKER_SYSTEM_REF_NODEGROUP),
        #     sortorder=None,
        # )
        # merge_tracker_sys_ref.sortorder = 0
        # print('merge_tracker_sys_ref.data: ', merge_tracker_sys_ref.data)
        # merge_tracker_sys_ref.data[TRACKER_SYSTEM_REF_NODE_VALUE] = {
        #     "en": self.generate_random_id(
        #         "MR",
        #         TRACKER_SYSTEM_REF_NODEGROUP,
        #         TRACKER_SYSTEM_REF_NODE_VALUE,
        #         str(merge_tracker_resource.resourceinstanceid),
        #     ),
        #     "direction": "ltr",
        # }
        # merge_tracker_sys_ref.save()

        MergeResources().merge_resources(
            monument_resource_id, new_monument_resource_id, None
        )

        self.new_monument_resource.delete(user=request.user)
