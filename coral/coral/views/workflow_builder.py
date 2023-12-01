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
