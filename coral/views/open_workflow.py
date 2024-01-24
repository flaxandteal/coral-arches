from django.views.generic import View
import logging
from arches.app.models import models
from arches.app.utils.response import JSONResponse, HttpResponse
import json
import uuid

logger = logging.getLogger(__name__)


class OpenWorkflow(View):
    def get(self, request):
        resource_instance_id = request.GET.get("resource-id")
        workflow_id = request.GET.get("workflow-id")
        histories = models.WorkflowHistory.objects.all()

        # Find workflow structure
        # FIXME: What if a resource id appears in another workflows history
        # FIXME: Get upstream Arches workflow slug into the database table
        # FIXME: Need to handle many tiles being stored as arrays
        found_history = None
        for history in histories:
            for componentdata in history.componentdata.values():
                if "value" not in componentdata:
                    continue
                if type(componentdata["value"]) == list:
                    for manycomponentdata in componentdata["value"]:
                        if (
                            manycomponentdata["resourceinstance_id"]
                            == resource_instance_id
                        ):
                            found_history = history
                            break
                elif (
                    componentdata["value"]["resourceInstanceId"] == resource_instance_id
                ):
                    found_history = history
                    break
        
        # return JSONResponse(found_history)
        # Refresh tiles with latest data
        for componentdata in found_history.componentdata.values():
            if type(componentdata["value"]) == list:
                for manycomponentdata in componentdata["value"]:
                    tile = models.TileModel.objects.get(pk=manycomponentdata["tileid"])
                    manycomponentdata["data"] = tile.data
            else:
                tile = models.TileModel.objects.get(pk=componentdata["value"]["tileId"])
                componentdata["value"]["tileData"] = json.dumps(tile.data)

        found_history.completed = False
        found_history.workflowid = workflow_id

        new_history = models.WorkflowHistory(
            workflowid=found_history.workflowid,
            stepdata=found_history.stepdata,
            componentdata=found_history.componentdata,
            completed=found_history.completed,
            user=request.user
        )

        new_history.save()

        return JSONResponse(new_history)


# {
#     "completed": False,
#     "componentdata": {
#         "1926c7a5-3fba-4472-83bf-1b888ec1a1b9": {
#             "value": {
#                 "nodegroupId": "ba39c036-b551-11ee-94ee-0242ac120006",
#                 "resourceInstanceId": "aaa84273-24fb-4f2b-9db1-c004939d3b4c",
#                 "tileData": '{"ba3a0262-b551-11ee-94ee-0242ac120006":0,"ba3a03e8-b551-11ee-94ee-0242ac120006":"7346be23-bff6-42dc-91d0-7c5182aa0031","ba3a055a-b551-11ee-94ee-0242ac120006":"1992741b-cc36-4613-b04e-943fa8c9d6fa","ba3a083e-b551-11ee-94ee-0242ac120006":{"en":{"direction":"ltr","value":"ENF/2024/qHbsN0"}},"ba3a09a6-b551-11ee-94ee-0242ac120006":"7346be23-bff6-42dc-91d0-7c5182aa0031","ba3a0c76-b551-11ee-94ee-0242ac120006":"7346be23-bff6-42dc-91d0-7c5182aa0031","ba3a0dde-b551-11ee-94ee-0242ac120006":"1992741b-cc36-4613-b04e-943fa8c9d6fa","ba3a0f46-b551-11ee-94ee-0242ac120006":"1992741b-cc36-4613-b04e-943fa8c9d6fa","ba3a10ae-b551-11ee-94ee-0242ac120006":null}',
#                 "tileId": "8cad9193-e495-4a06-802f-22deba29b26b",
#             }
#         },
#         "49e092be-0dcf-4f62-b3b0-f18804583f94": {
#             "value": {
#                 "nodegroupId": "f0b99550-b551-11ee-805b-0242ac120006",
#                 "resourceInstanceId": "aaa84273-24fb-4f2b-9db1-c004939d3b4c",
#                 "tileData": '{"f0b9dd08-b551-11ee-805b-0242ac120006":"b81d4b16-0633-4d7a-b4b2-5c2d3e2e782e","f0b9edd4-b551-11ee-805b-0242ac120006":[{"inverseOntologyProperty":"","ontologyProperty":"","resourceId":"8dc15034-e11a-4507-ba9f-77ea8e81b45f","resourceXresourceId":"9626c793-94ab-4ad3-a4cd-43bd5a99bac6"}],"f0b9eff0-b551-11ee-805b-0242ac120006":"d3b75e3a-638e-490e-8d1b-bbb5c504ce94","f0b9f2ac-b551-11ee-805b-0242ac120006":"a3d09202-655f-452d-b2e1-25664033d971","f0b9f496-b551-11ee-805b-0242ac120006":"b2489138-dcc5-4151-999e-977809179bb3"}',
#                 "tileId": "776c77b3-7daf-4b04-a084-cfd9b8aa2b54",
#             }
#         },
#         "8dbd7d6d-e8d3-4636-abf2-82aa708ab687": {
#             "value": {
#                 "nodegroupId": "a78e548a-b554-11ee-805b-0242ac120006",
#                 "resourceInstanceId": "aaa84273-24fb-4f2b-9db1-c004939d3b4c",
#                 "tileData": '{"a78e548a-b554-11ee-805b-0242ac120006":[{"inverseOntologyProperty":"ac41d9be-79db-4256-b368-2f4559cfbe55","ontologyProperty":"ac41d9be-79db-4256-b368-2f4559cfbe55","resourceId":"8dc15034-e11a-4507-ba9f-77ea8e81b45f","resourceXresourceId":"334b919d-5f41-4431-be05-11a38d5789a6"}]}',
#                 "tileId": "360728ef-36c7-41a4-bd00-83208ca77aaf",
#             }
#         },
#         "e6c2caa9-0f38-4135-a338-179ce7760e01": {
#             "value": {
#                 "nodegroupId": "074effd0-b5e8-11ee-8e91-0242ac120006",
#                 "resourceInstanceId": "aaa84273-24fb-4f2b-9db1-c004939d3b4c",
#                 "tileData": '{"074f05d4-b5e8-11ee-8e91-0242ac120006":"daa4cddc-8636-4842-b836-eb2e10aabe18","074f0746-b5e8-11ee-8e91-0242ac120006":{"en":{"direction":"ltr","value":"casea w12123"}},"074f0a16-b5e8-11ee-8e91-0242ac120006":null,"074f0b7e-b5e8-11ee-8e91-0242ac120006":"f666c25d-90a4-4b1d-bca6-465a7e4815ce","074f0cdc-b5e8-11ee-8e91-0242ac120006":"6fbe3775-e51d-4f90-af53-5695dd204c9a"}',
#                 "tileId": "92c740ec-d798-46a9-9560-0d9f5d5562bf",
#             }
#         },
#         "f079b825-dd60-4a7d-bcc0-16cd5364d20c": {
#             "value": {
#                 "nodegroupId": "89bf628e-b552-11ee-805b-0242ac120006",
#                 "resourceInstanceId": "aaa84273-24fb-4f2b-9db1-c004939d3b4c",
#                 "tileData": '{"89bf6c48-b552-11ee-805b-0242ac120006":{"en":{"direction":"ltr","value":"awdawdawdawd"}},"89bf6e64-b552-11ee-805b-0242ac120006":"35508b82-062a-469f-830a-6040c5e5eb8c","89bf6fd6-b552-11ee-805b-0242ac120006":"6fbe3775-e51d-4f90-af53-5695dd204c9a"}',
#                 "tileId": "cf7fa6b7-5d9b-4931-a486-7309b0e133e6",
#             }
#         },
#     },
#     "stepdata": {
#         "088b8e62-614a-4756-8eaa-24aea7543269": {
#             "componentIdLookup": {
#                 "967ef37c-56df-4566-8480-31593fe0ba5d": "1926c7a5-3fba-4472-83bf-1b888ec1a1b9"
#             },
#             "locked": False,
#             "stepId": "a9ff16c1-2f46-4154-83c8-56079e753a31",
#         },
#         "ee3ece72-c916-4114-a33e-6bc12aea2f9b": {
#             "componentIdLookup": {
#                 "1c7bdf04-6875-40b5-8e74-b72906acbc86": "8a5e4064-db01-49f6-a576-694e6128a5d5",
#                 "75bf121f-d931-4939-b6da-ee8fab5dc3f2": "f079b825-dd60-4a7d-bcc0-16cd5364d20c",
#                 "97bc42fd-14a4-446f-bf0b-1824c6ee6850": "49e092be-0dcf-4f62-b3b0-f18804583f94",
#                 "b431a949-01e2-44a6-bcab-511a94a9e0f5": "8dbd7d6d-e8d3-4636-abf2-82aa708ab687",
#                 "c9e8f671-755f-4a2f-8359-538b46c1cf5a": "e6c2caa9-0f38-4135-a338-179ce7760e01",
#             },
#             "locked": False,
#             "stepId": "ff30e0ee-416e-451e-b35c-ef5a49cfb55d",
#         },
#     },
#     "user_id": 1,
#     "workflowid": "2af09eeb-331f-45e9-b184-a3c821c91a8f",
# }
