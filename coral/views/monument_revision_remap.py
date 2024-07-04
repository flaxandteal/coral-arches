from django.views.generic import View
import logging
from arches.app.utils.response import JSONResponse
import json
from coral.utils.remap_resources import RemapResources
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from coral.tasks import remap_and_merge_revision_task, remap_monument_to_revision

logger = logging.getLogger(__name__)


class RemapMonumentToRevision(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        target_resource_id = data.get("targetResourceId")

        remap_monument_to_revision.delay(request.user.id, target_resource_id)

        return JSONResponse({
            "message":"Remap to revision has started this can take a few minutes to complete"
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