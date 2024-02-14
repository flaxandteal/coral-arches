from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid
from arches.app.models.resource import Resource

logger = logging.getLogger(__name__)


class MergeResources(View):
    def post(self, request):
        data = json.loads(request.body.decode('utf-8'))
        base_resource_id = data.get("baseResourceId")
        merge_resource_id = data.get("mergeResourceId")

        print("base_resource_id: ", base_resource_id)
        print("merge_resource_id: ", merge_resource_id)

        if not base_resource_id or not merge_resource_id:
            raise "Missing base or merge resource ID"

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

        # Step 2

        # Grab all the tiles for both resources

        # Find which tiles are from the same nodegroup

        # Create new tiles for the base record from the existing merge tiles

        return JSONResponse(
            {base_resource: base_resource, merge_resource: merge_resource}
        )
