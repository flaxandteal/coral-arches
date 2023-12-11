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
from django.http import HttpRequest, HttpResponse
from arches.app.utils.permission_backend import get_createable_resource_types
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer


class WorkflowBuilder(View):
    def __init__(self):
        pass

    def get(self, request):
        createable = get_createable_resource_types(request.user)
        resources = JSONSerializer().serialize(
            createable,
            exclude=[
                "functions",
                "ontology",
                "isactive",
                "isresource",
                "version",
                "deploymentdate",
                "deploymentfile",
                "author",
            ],
        )

        return JSONResponse({"resources": JSONDeserializer().deserialize(resources)})


class WorkflowBuilderGraphComponents(View):
    def __init__(self):
        pass

    def get(self, request):
        graph_id = request.GET.get("graph-id")
        graph = Graph.objects.filter(pk=graph_id).first()

        alias_to_node_id = {}

        for node in graph.nodes.values():
            nodegroup_id = str(node.nodegroup_id)
            node_id = str(node.nodeid)
            if nodegroup_id not in alias_to_node_id:
                alias_to_node_id[nodegroup_id] = {}
            if node_id == nodegroup_id:
                alias_to_node_id[nodegroup_id]["semantic_name"] = node.name
            if node.datatype == "semantic":
                continue
            alias_to_node_id[nodegroup_id][node.alias] = node_id

        component_configs = []

        for nodegroup_id, alias_nodes in alias_to_node_id.items():
            component_configs.append(
                {
                    "componentName": "default-card",
                    "uniqueInstanceName": nodegroup_id,
                    "tilesManaged": "one",
                    "parameters": {
                        "renderContext": "workflow",
                        "resourceid": "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                        "graphid": graph_id,
                        "nodegroupid": nodegroup_id,
                        "semanticName": alias_nodes["semantic_name"]
                        if alias_nodes.get("semantic_name")
                        else "No semantic name",
                        # "hiddenNodes": [
                        #     f"{node_id2}"
                        #     for alias2, node_id2 in alias_nodes.items()
                        #     if alias2 != "semantic_name"
                        # ],
                    },
                }
            )

        return JSONResponse(
            {
                "graph": graph,
                "alias_to_node_id": alias_to_node_id,
                "component_configs": component_configs,
            }
        )
