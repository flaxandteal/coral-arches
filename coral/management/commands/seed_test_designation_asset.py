import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.test import RequestFactory

from arches.app.models.models import Node
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

from coral.management.commands.seed_test_issue_report import (
    HA_SYSTEM_REFERENCE_NODEGROUP,
    HA_SYSTEM_REFERENCE_NUMBER_NODE,
    HERITAGE_ASSET_GRAPH,
)
from coral.utils.test_seed_guard import require_test_environment

NAME_NODEGROUP = "676d47f9-9c1c-11ea-9aa0-f875a44e0e11"
NAME_NODE = "676d47ff-9c1c-11ea-b07f-f875a44e0e11"

RESOURCE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:designation"))
# Heritage Asset Revision's link back to the asset it revises.
REVISION_PARENT_NODE = "6375be6e-dc64-11ee-924e-0242ac120006"
HA_NUMBER = "HA/92"
SITE_NAME = "Designation Test"


def text(value):
    return {"en": {"value": value, "direction": "ltr"}}


class Command(BaseCommand):
    help = (
        f"Create a Heritage Asset ({HA_NUMBER} {SITE_NAME}) for the HA Designation spec, "
        "which applies revisions to it - kept apart so that does not change the assets "
        "other specs read. Recreated, without revisions, on every run, since applying one rewrites it. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def handle(self, *args, **options):
        require_test_environment("seed_test_designation_asset")
        # Tile post-save functions dereference request.user, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        revisions = Tile.objects.filter(
            nodegroup_id=REVISION_PARENT_NODE,
            data__contains={REVISION_PARENT_NODE: [{"resourceId": RESOURCE_ID}]},
        ).values_list("resourceinstance_id", flat=True)
        for resource in Resource.objects.filter(pk__in=[*revisions, RESOURCE_ID]):
            resource.delete(user=request.user)

        Resource(resourceinstanceid=RESOURCE_ID, graph_id=HERITAGE_ASSET_GRAPH).save(request=request)
        for nodegroup_id, values in (
            (HA_SYSTEM_REFERENCE_NODEGROUP, {HA_SYSTEM_REFERENCE_NUMBER_NODE: text(HA_NUMBER)}),
            (NAME_NODEGROUP, {NAME_NODE: text(SITE_NAME)}),
        ):
            data = {
                str(node.pk): None
                for node in Node.objects.filter(nodegroup_id=nodegroup_id).exclude(datatype="semantic")
            }
            data.update(values)
            Tile(tileid=uuid.uuid4(), resourceinstance_id=RESOURCE_ID, nodegroup_id=nodegroup_id,
                 data=data).save(request=request)
        # The launcher searches Elasticsearch.
        Resource.objects.get(pk=RESOURCE_ID).index()
        self.stdout.write(self.style.SUCCESS(f"Seeded {HA_NUMBER} {SITE_NAME} ({RESOURCE_ID})"))
