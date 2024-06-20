from django.views.generic import View
import logging
from arches.app.utils.response import JSONResponse
import json
from coral.tasks import merge_resources_task


logger = logging.getLogger(__name__)


class MergeResourcesView(View):
    def post(self, request):
        data = json.loads(request.body.decode("utf-8"))
        base_resource_id = data.get("baseResourceId")
        merge_resource_id = data.get("mergeResourceId")
        merge_tracker_resource_id = data.get("mergeTrackerResourceId")

        merge_resources_task.delay(
            user_id=request.user.id,
            base_resource_id=base_resource_id,
            merge_resource_id=merge_resource_id,
            merge_tracker_resource_id=merge_tracker_resource_id,
        )

        return JSONResponse({"message": "Resources have begun merging"})
