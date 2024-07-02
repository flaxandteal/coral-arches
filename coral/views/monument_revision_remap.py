from django.views.generic import View
import logging
from arches.app.utils.response import JSONResponse
import json
from coral.utils.remap_resources import RemapResources
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

logger = logging.getLogger(__name__)


class RemapMonumentToRevision(View):
    def post(self, request):
        MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"

        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")

        rr = RemapResources(
            target_graph_id=MONUMENT_GRAPH_ID,
            destination_graph_id=MONUMENT_REVISION_GRAPH_ID,
            excluded_aliases = [
                "monument",
                "monument_revision"
            ],
            target_resource_id=target_resource_id
        )

        result = rr.remap_resources(request.user)

        REVISION_PARENT_MONUMENT_NODEGROUP_ID = "6375be6e-dc64-11ee-924e-0242ac120006"
        parent_target_nodegroup = models.NodeGroup.objects.filter(pk=REVISION_PARENT_MONUMENT_NODEGROUP_ID).first()
        destination_resource = Resource.objects.filter(pk=result['destinationResourceId']).first()
        parent_target_tile = Tile(
            resourceinstance=destination_resource,
            data={
                REVISION_PARENT_MONUMENT_NODEGROUP_ID: [
                    {
                        "resourceId": target_resource_id,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    }
                ]
            },
            nodegroup=parent_target_nodegroup,
        )
        parent_target_tile.save()

        return JSONResponse(result)


class RemapRevisionToMonument(View):
    def post(self, request):
        MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"

        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")

        rr = RemapResources(
            target_graph_id=MONUMENT_REVISION_GRAPH_ID,
            destination_graph_id=MONUMENT_GRAPH_ID,
            excluded_aliases = [
                "monument",
                "monument_revision",
                "parent_monument"
            ],
            target_resource_id=target_resource_id
        )

        result = rr.remap_resources(request.user)

        return JSONResponse(result)