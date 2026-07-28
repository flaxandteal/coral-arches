import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from arches.app.models.models import ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

HERITAGE_ASSET_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"

# "Heritage Asset References" nodegroup and the reference nodes it holds.
HA_REFERENCES_NODEGROUP = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
SMR_NUMBER_NODE = "158e1ed2-3aae-11ef-a2d0-0242ac120003"
IHR_NUMBER_NODE = "1de9abf0-3aae-11ef-91fd-0242ac120003"
HB_NUMBER_NODE = "250002fe-3aae-11ef-91fd-0242ac120003"
HISTORIC_PARKS_NODE = "2c2d02fc-3aae-11ef-91fd-0242ac120003"

# NOTE: the Risk Assessment launcher filters Heritage Assets on node
# 74ef37e0-37b5-11ef-9263-0242ac150006 ("Recommended designation, identification
# and protection") == concept value 8da10724-1bd3-c095-6d4d-fb8657574b40. That
# value does not exist in the loaded reference data (arches rejects it with
# "This UUID is not an available concept value"), so that workflow cannot be
# seeded here — see the skipped spec in cypress/e2e/10_risk_assessment.


class Command(BaseCommand):
    help = (
        "Give a Heritage Asset an SMR Number so the State Care Condition Survey "
        "workflow's launcher can find it — it searches for Heritage Assets with a "
        "non-null SMR Number, so without this the Cypress E2E spec has nothing to "
        "select. The launcher queries Elasticsearch, so the resource is reindexed "
        "here. TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--smr-number",
            default="SMR-TEST-001",
            help="SMR Number value to set (default: SMR-TEST-001).",
        )
        parser.add_argument(
            "--resource-id",
            default=None,
            help="Heritage Asset resourceinstanceid to seed (default: the first one found).",
        )

    def handle(self, *args, **options):
        smr_number = options["smr_number"]
        resource_id = options["resource_id"]

        if resource_id:
            try:
                resource = ResourceInstance.objects.get(pk=resource_id)
            except (ResourceInstance.DoesNotExist, ValueError):
                raise CommandError(f"No resource instance '{resource_id}'")
        else:
            resource = (
                ResourceInstance.objects.filter(graph_id=HERITAGE_ASSET_GRAPH)
                .order_by("resourceinstanceid")
                .first()
            )
            if resource is None:
                raise CommandError("No Heritage Asset resource instances found")

        # Tile post-save functions (coral's notification manager among them)
        # dereference request.user unconditionally, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        message = self._upsert(
            resource,
            request,
            HA_REFERENCES_NODEGROUP,
            {SMR_NUMBER_NODE: {"en": {"value": smr_number, "direction": "ltr"}}},
            blanks=[IHR_NUMBER_NODE, HB_NUMBER_NODE, HISTORIC_PARKS_NODE],
            label=f"SMR Number '{smr_number}'",
        )

        # The launcher queries Elasticsearch rather than the database, so the
        # resource has to be reindexed for the new value to be findable.
        Resource.objects.get(pk=resource.resourceinstanceid).index()

        self.stdout.write(self.style.SUCCESS(message))
        self.stdout.write(
            self.style.SUCCESS(f"Reindexed Heritage Asset {resource.resourceinstanceid}")
        )

    def _upsert(self, resource, request, nodegroup_id, data, blanks, label):
        tile = Tile.objects.filter(
            resourceinstance_id=resource.resourceinstanceid,
            nodegroup_id=nodegroup_id,
        ).first()

        if tile is None:
            tile = Tile(
                tileid=uuid.uuid4(),
                resourceinstance_id=resource.resourceinstanceid,
                nodegroup_id=nodegroup_id,
                data={**data, **{node: None for node in blanks}},
            )
            action = "Created"
        else:
            tile.data.update(data)
            action = "Updated"

        tile.save(request=request)
        return f"{action} {label} on Heritage Asset {resource.resourceinstanceid}"
