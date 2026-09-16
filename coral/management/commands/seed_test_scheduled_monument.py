import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from arches.app.models.models import ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches_controlled_lists.models import ListItem

from coral.utils.test_seed_guard import require_test_environment

HERITAGE_ASSET_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"

# "Designation and Protection Assignment" nodegroup and the "Recommended
# designation, identification and protection" reference node it holds.
DESIGNATION_NODEGROUP = "6af2a0cb-efc5-11eb-8436-a87eeabdefba"
RECOMMENDED_DESIGNATION_NODE = "5aa9d22a-29c6-5de0-8119-84ee1e93081f"
SCHEDULED_MONUMENT_LIST_ITEM = "1e898077-9144-9ef0-b6e1-08f4e4881972"


class Command(BaseCommand):
    help = (
        "Give a Heritage Asset a Recommended Designation of 'Scheduled Monument' so "
        "the Risk Assessment workflow's launcher can find it — it searches for "
        "Heritage Assets with that designation, so without this the Cypress E2E spec "
        "has nothing to select. The launcher queries Elasticsearch, so the resource "
        "is reindexed here. TEST ENVIRONMENTS ONLY - never run this against a real "
        "deployment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--resource-id",
            default=None,
            help="Heritage Asset resourceinstanceid to seed (default: the first one found).",
        )

    def handle(self, *args, **options):
        require_test_environment("seed_test_scheduled_monument")
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

        try:
            list_item = ListItem.objects.get(pk=SCHEDULED_MONUMENT_LIST_ITEM)
        except ListItem.DoesNotExist:
            raise CommandError(
                f"List item '{SCHEDULED_MONUMENT_LIST_ITEM}' (Scheduled Monument) "
                "is not loaded - check the controlled list package data."
            )

        # Tile post-save functions (coral's notification manager among them)
        # dereference request.user unconditionally, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        value = {RECOMMENDED_DESIGNATION_NODE: [list_item.build_tile_value()]}

        tile = Tile.objects.filter(
            resourceinstance_id=resource.resourceinstanceid,
            nodegroup_id=DESIGNATION_NODEGROUP,
        ).first()

        if tile is None:
            tile = Tile(
                tileid=uuid.uuid4(),
                resourceinstance_id=resource.resourceinstanceid,
                nodegroup_id=DESIGNATION_NODEGROUP,
                data=value,
            )
            action = "Created"
        else:
            tile.data.update(value)
            action = "Updated"

        tile.save(request=request)

        # The launcher queries Elasticsearch rather than the database, so the
        # resource has to be reindexed for the new value to be findable.
        Resource.objects.get(pk=resource.resourceinstanceid).index()

        self.stdout.write(
            self.style.SUCCESS(
                f"{action} Recommended Designation 'Scheduled Monument' on Heritage "
                f"Asset {resource.resourceinstanceid}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f"Reindexed Heritage Asset {resource.resourceinstanceid}")
        )
