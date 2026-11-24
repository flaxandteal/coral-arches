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

# (key, HA Number, site name). A merge consumes both, so each run starts them afresh.
PAIR = (
    ("base", "HA/90", "Merge Test Base"),
    ("other", "HA/91", "Merge Test Other"),
)


def text(value):
    return {"en": {"value": value, "direction": "ltr"}}


class Command(BaseCommand):
    help = (
        "Recreate two throwaway Heritage Assets (HA/90 Merge Test Base, HA/91 Merge Test "
        "Other) for the Merge workflow spec to merge. Any earlier copies are deleted first. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def handle(self, *args, **options):
        require_test_environment("seed_test_merge_pair")

        # Tile post-save functions dereference request.user, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        for key, ha_number, site_name in PAIR:
            resource_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"coral-e2e:merge-{key}"))
            for existing in Resource.objects.filter(pk=resource_id):
                existing.delete(user=request.user)

            Resource(resourceinstanceid=resource_id, graph_id=HERITAGE_ASSET_GRAPH).save(request=request)
            self._tile(resource_id, HA_SYSTEM_REFERENCE_NODEGROUP,
                       {HA_SYSTEM_REFERENCE_NUMBER_NODE: text(ha_number)}, request)
            self._tile(resource_id, NAME_NODEGROUP, {NAME_NODE: text(site_name)}, request)
            # The workflow pickers search Elasticsearch.
            Resource.objects.get(pk=resource_id).index()
            self.stdout.write(self.style.SUCCESS(f"Seeded {ha_number} {site_name} ({resource_id})"))

    def _tile(self, resource_id, nodegroup_id, values, request):
        data = {
            str(node.pk): None
            for node in Node.objects.filter(nodegroup_id=nodegroup_id).exclude(datatype="semantic")
        }
        data.update(values)
        Tile(tileid=uuid.uuid4(), resourceinstance_id=resource_id, nodegroup_id=nodegroup_id,
             data=data).save(request=request)
