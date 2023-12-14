from django.views.generic import View
from arches.app.utils.response import JSONResponse, HttpResponse
from arches.app.models.resource import Resource
from arches.app.models.graph import Graph
from arches.app.utils.permission_backend import get_createable_resource_types
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from arches.app.views import api
import json
import uuid
from django.views.generic import View
from django.utils.translation import ugettext as _
from arches.app.models import models
from arches.app.models.graph import Graph
from arches.app.models.resource import Resource
from arches.app.models.system_settings import settings
from arches.app.utils.response import JSONResponse
from arches.app.utils.betterJSONSerializer import JSONSerializer, JSONDeserializer
from arches.app.utils.permission_backend import (
    user_is_resource_reviewer,
)
from django.utils import translation


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


class WorkflowBuilderCardOverride(api.Card):
    def get(self, request, resourceid):
        try:
            resource_instance = Resource.objects.get(pk=resourceid)
            graph = resource_instance.graph
        except Resource.DoesNotExist:
            graph = models.GraphModel.objects.get(pk=resourceid)
            resourceid = None
            resource_instance = None
            pass

        nodegroups = []
        editable_nodegroups = []
        nodes = graph.node_set.all().select_related("nodegroup")
        for node in nodes:
            if node.is_collector:
                added = False
                if request.user.has_perm("write_nodegroup", node.nodegroup):
                    editable_nodegroups.append(node.nodegroup)
                    nodegroups.append(node.nodegroup)
                    added = True
                if not added and request.user.has_perm(
                    "read_nodegroup", node.nodegroup
                ):
                    nodegroups.append(node.nodegroup)

        user_is_reviewer = user_is_resource_reviewer(request.user)

        if resource_instance is None:
            tiles = []
            displayname = _("New Resource")
        else:
            displayname = resource_instance.displayname()
            if displayname == "undefined":
                displayname = _("Unnamed Resource")
            if (
                str(resource_instance.graph_id)
                == settings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID
            ):
                displayname = _("System Settings")

            tiles = resource_instance.tilemodel_set.order_by("sortorder").filter(
                nodegroup__in=nodegroups
            )
            provisionaltiles = []
            for tile in tiles:
                append_tile = True
                isfullyprovisional = False
                if tile.provisionaledits is not None:
                    if len(list(tile.provisionaledits.keys())) > 0:
                        if len(tile.data) == 0:
                            isfullyprovisional = True
                        if user_is_reviewer is False:
                            if str(request.user.id) in tile.provisionaledits:
                                tile.provisionaledits = {
                                    str(request.user.id): tile.provisionaledits[
                                        str(request.user.id)
                                    ]
                                }
                                tile.data = tile.provisionaledits[str(request.user.id)][
                                    "value"
                                ]
                            else:
                                if isfullyprovisional is True:
                                    # if the tile IS fully provisional and the current user is not the owner,
                                    # we don't send that tile back to the client.
                                    append_tile = False
                                else:
                                    # if the tile has authoritative data and the current user is not the owner,
                                    # we don't send the provisional data of other users back to the client.
                                    tile.provisionaledits = None
                if append_tile is True:
                    provisionaltiles.append(tile)
            tiles = provisionaltiles

        serialized_graph = None
        if graph.publication:
            user_language = translation.get_language()
            published_graph = models.PublishedGraph.objects.get(
                publication=graph.publication, language=user_language
            )
            serialized_graph = published_graph.serialized_graph

        if serialized_graph:
            serialized_cards = serialized_graph["cards"]
            cardwidgets = [
                widget
                for widget in models.CardXNodeXWidget.objects.filter(
                    pk__in=[
                        widget_dict["id"] for widget_dict in serialized_graph["widgets"]
                    ]
                )
            ]
        else:
            cards = (
                graph.cardmodel_set.order_by("sortorder")
                .filter(nodegroup__in=nodegroups)
                .prefetch_related("cardxnodexwidget_set")
            )
            serialized_cards = JSONSerializer().serializeToPython(cards)
            cardwidgets = [
                widget
                for widget in [
                    card.cardxnodexwidget_set.order_by("sortorder").all()
                    for card in cards
                ]
            ]

        editable_nodegroup_ids = [
            str(nodegroup.pk) for nodegroup in editable_nodegroups
        ]
        for card in serialized_cards:
            card["is_writable"] = False
            if str(card["nodegroup_id"]) in editable_nodegroup_ids:
                card["is_writable"] = True

        my_tiles = []
        for card in serialized_cards:
            if card["name"] == "Location Data":
                my_tiles.append(
                    {
                        "data": {},
                        "nodegroup_id": card["nodegroup_id"],
                        "parenttile_id": None,
                        "provisionaledits": None,
                        "resourceinstance_id": uuid.uuid4(),
                        "sortorder": 0,
                        "tileid": "dummy-id",
                    }
                )

        context = {
            "resourceid": resourceid,
            "displayname": displayname,
            "tiles": tiles + my_tiles,
            "cards": serialized_cards,
            "nodegroups": nodegroups,
            "nodes": nodes.filter(nodegroup__in=nodegroups),
            "cardwidgets": cardwidgets,
            "datatypes": models.DDataType.objects.all(),
            "userisreviewer": user_is_reviewer,
            "widgets": models.Widget.objects.all(),
            "card_components": models.CardComponent.objects.all(),
        }

        return JSONResponse(context, indent=4)


class WorkflowBuilderWorkflowPlugins(View):
    def __init__(self):
        pass

    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))

        try:
            uuid.UUID(data["pluginid"])
        except:
            data["pluginid"] = str(uuid.uuid4())
            print("Registering plugin with pluginid: {}".format(data["pluginid"]))

        instance = models.Plugin(
            pluginid=data["pluginid"],
            name=data["name"],
            icon=data["icon"],
            component=data["component"],
            componentname=data["componentname"],
            config=data["config"],
            slug=data["slug"],
            sortorder=data["sortorder"],
        )

        instance.save()

        return JSONResponse(data)

    def get(self, request):
        slug = request.GET.get("slug")
        if slug:
            workflow = models.Plugin.objects.get(slug=slug)
            return JSONResponse(workflow)
        instances = None
        try:
            instances = models.Plugin.objects.all()
        except Exception as e:
            print(e)

        workflow_builder_plugins = []
        for instance in instances:
            if "stepData" in instance.config:
                workflow_builder_plugins.append(instance)

        return JSONResponse({"workflows": workflow_builder_plugins})


class WorkflowBuilderPluginExport(View):
    def get(self, request):
        slug = request.GET.get("slug")
        plugin = models.Plugin.objects.get(slug=slug)
        filename = f"{slug}.json"
        json_data = json.dumps(
            {
                "pluginid": str(plugin.pluginid),
                "name": plugin.name,
                "icon": plugin.icon,
                "component": plugin.component,
                "componentname": plugin.componentname,
                "config": plugin.config,
                "slug": plugin.slug,
                "sortorder": plugin.sortorder,
            },
            indent=2,
        )
        response = HttpResponse(json_data, content_type="application/json")
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response
