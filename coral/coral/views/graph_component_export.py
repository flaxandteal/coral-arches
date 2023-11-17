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


class GraphComponentExport(View):
    def __init__(self):
        pass

    def get(self, request):
        graph_id = request.GET.get("graph-id")
        graph = Graph.objects.filter(pk=graph_id).first()

        alias_to_node_id = {}

        for node in graph.nodes.values():
            nodegroup_id = str(node.nodegroup_id)
            if nodegroup_id not in alias_to_node_id:
                alias_to_node_id[nodegroup_id] = {}
            alias_to_node_id[nodegroup_id][node.alias] = str(node.nodeid)

        component_configs = {}

        for nodegroup_id, alias_nodes in alias_to_node_id.items():
            component_configs[nodegroup_id] = {
                "componentName": "default-card",
                "uniqueInstanceName": nodegroup_id,
                "tilesManaged": "one",
                "parameters": {
                    "graphid": graph_id,
                    "nodegroupid": nodegroup_id,
                    "resourceid": "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    "hiddenNodes": [
                        f"'{node_id2}', // {alias2}"
                        for alias2, node_id2 in alias_nodes.items()
                    ],
                },
            }

        # Uncomment to get JSON response of data
        # return JSONResponse(
        #     {
        #         "graph": graph,
        #         "alias_to_node_id": alias_to_node_id,
        #         "component_configs": component_configs,
        #     }
        # )

        filename = f"{graph.name}-component-configs.json"
        json_data = json.dumps(component_configs, indent=2)
        response = HttpResponse(json_data, content_type="application/json")
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response
