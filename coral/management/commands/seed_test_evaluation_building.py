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
REFERENCES_NODEGROUP = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
HB_NUMBER_NODE = "4b9883ef-9aad-559a-bd84-e4bb7b94a358"

RESOURCE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:evaluation-building"))
HA_NUMBER = "HA/93"
HB_NUMBER = "HB/TEST/001"
SITE_NAME = "Evaluation Test"


def text(value):
    return {"en": {"value": value, "direction": "ltr"}}


class Command(BaseCommand):
    help = (
        f"Recreate a Heritage Asset with an HB Number ({HB_NUMBER} {SITE_NAME}) for the "
        "Evaluation Meeting spec - its launcher only lists buildings with one, and none of "
        "the baseline seed has. Recreated on every run so meetings do not pile up on it. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def handle(self, *args, **options):
        require_test_environment("seed_test_evaluation_building")
        # Tile post-save functions dereference request.user, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        for existing in Resource.objects.filter(pk=RESOURCE_ID):
            existing.delete(user=request.user)

        Resource(resourceinstanceid=RESOURCE_ID, graph_id=HERITAGE_ASSET_GRAPH).save(request=request)
        for nodegroup_id, values in (
            (HA_SYSTEM_REFERENCE_NODEGROUP, {HA_SYSTEM_REFERENCE_NUMBER_NODE: text(HA_NUMBER)}),
            (NAME_NODEGROUP, {NAME_NODE: text(SITE_NAME)}),
            (REFERENCES_NODEGROUP, {HB_NUMBER_NODE: text(HB_NUMBER)}),
        ):
            tile = Tile.objects.filter(resourceinstance_id=RESOURCE_ID, nodegroup_id=nodegroup_id).first()
            if tile is None:
                tile = Tile(
                    tileid=uuid.uuid4(), resourceinstance_id=RESOURCE_ID, nodegroup_id=nodegroup_id,
                    data={
                        str(node.pk): None
                        for node in Node.objects.filter(nodegroup_id=nodegroup_id).exclude(datatype="semantic")
                    },
                )
            tile.data.update(values)
            tile.save(request=request)
        # The launcher searches Elasticsearch.
        Resource.objects.get(pk=RESOURCE_ID).index()
        self.stdout.write(self.style.SUCCESS(f"Seeded {HB_NUMBER} {SITE_NAME} ({RESOURCE_ID})"))
