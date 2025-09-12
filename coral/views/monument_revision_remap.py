from django.views.generic import View
import logging
from arches.app.utils.response import JSONResponse
import json
from coral.utils.remap_resources import RemapResources
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from coral.tasks import remap_and_merge_revision_task, remap_monument_to_revision
import pdb
logger = logging.getLogger(__name__)


class RemapMonumentToRevision(View):
    def post(self, request):
        MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")
        resource = Resource.objects.filter(pk=target_resource_id).first()

        related_revisions = resource.get_related_resources(
            user=request.user,
            resourceinstance_graphid=MONUMENT_REVISION_GRAPH_ID
        )

        # Get the related revisions and check for any revisions that aren't deleted
        if related_revisions:
            related_resource_ids = [r['resourceinstanceid'] for r in related_revisions['related_resources']]

        open_revisions = Tile.objects.filter(
            resourceinstance_id__in=related_resource_ids,
            nodegroup_id = '9e59e355-07f0-4b13-86c8-7aa12c04a5e3',
            **{'data__9e59e355-07f0-4b13-86c8-7aa12c04a5e3':False} # Checks the deleted node on a designation
        ).exists()

        if open_revisions:
            return JSONResponse({
                "message": "A revision is already open for this Heritage Asset. Only one can be open at a time",
                "title": "Unable to create revision",
                "alert": "ep-alert-red",
                "started": True
            })

        if (MONUMENT_REVISION_GRAPH_ID == str(resource.graph.graphid)):
            return JSONResponse({
                "message": "This resource is already a revision",
                "title": "Unable to create revision",
                "alert": "ep-alert-red",
                "started" : False
            })
            

        remap_monument_to_revision.delay(request.user.id, target_resource_id)

        return JSONResponse({
            "message":"The Monument Revision is currently building. This process takes a few minutes.\n You will receive a notification when the process is complete.",
            "title": "Build Process Started",
            "alert": "ep-alert-blue",
            "started": True
        })


class RemapRevisionToMonument(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")

        remap_and_merge_revision_task.delay(
            user_id=request.user.id,
            target_resource_id=target_resource_id
        )

        return JSONResponse({
            "message": "Remap and merge process has started this can take up to five minutes to complete"
        })