import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from arches.app.models.models import ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

HERITAGE_ASSET_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"

# "HA System Reference" - carries the HA/NN number the assets are picked by.
HA_SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
HA_SYSTEM_REFERENCE_NUMBER_NODE = "325a430a-efe4-11eb-810b-a87eeabdefba"

# "Issue Report" is a parent (semantic, cardinality n) nodegroup on the Heritage
# Asset with an "Issue Reference" child holding the reference number. The
# launcher lists one option per child tile, labelled with that number, and hands
# the workflow the child's PARENT tile id -- see getParentTileOptions() in
# coral/media/js/views/components/plugins/open-issue-report-workflow.js.
ISSUE_REPORT_NODEGROUP = "d3ff3fe6-d62b-11ee-9454-0242ac180006"
ISSUE_REFERENCE_NODEGROUP = "20017860-d711-11ee-9dd0-0242ac120006"
ISSUE_REFERENCE_NUMBER_NODE = "2001a33a-d711-11ee-9dd0-0242ac120006"
ISSUE_REFERENCE_TYPE_NODE = "2001a574-d711-11ee-9dd0-0242ac120006"
ISSUE_REFERENCE_METATYPE_NODE = "2001a6f0-d711-11ee-9dd0-0242ac120006"


class Command(BaseCommand):
    help = (
        "Give a Heritage Asset an Issue Report so the Issue Report workflow's "
        "launcher can open one. The launcher's 'Start New' button is hidden "
        "(disableStartNew is set on the openableWorkflows entry in "
        "coral/plugins/open-issue-report-workflow.json), so 'Open Selected' - "
        "and therefore an Issue Report that already exists on the asset - is the "
        "only way in, and a freshly seeded database has none. The launcher reads "
        "the asset list from Elasticsearch, so the resource is reindexed here. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--ha-number",
            default="HA/03",
            help="HA Number of the Heritage Asset to seed (default: HA/03).",
        )
        parser.add_argument(
            "--reference-number",
            default="ISSUE-TEST-001",
            help="Issue Reference Number to set (default: ISSUE-TEST-001).",
        )

    def handle(self, *args, **options):
        ha_number = options["ha_number"]
        reference_number = options["reference_number"]

        system_ref = Tile.objects.filter(
            nodegroup_id=HA_SYSTEM_REFERENCE_NODEGROUP,
            resourceinstance__graph_id=HERITAGE_ASSET_GRAPH,
            **{
                f"data__{HA_SYSTEM_REFERENCE_NUMBER_NODE}__en__value": ha_number,
            },
        ).first()
        if system_ref is None:
            raise CommandError(f"No Heritage Asset with HA Number '{ha_number}'")

        resource_id = system_ref.resourceinstance_id
        if not ResourceInstance.objects.filter(pk=resource_id).exists():
            raise CommandError(f"No resource instance '{resource_id}'")

        # Tile post-save functions (coral's notification manager among them)
        # dereference request.user unconditionally, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        existing = Tile.objects.filter(
            resourceinstance_id=resource_id,
            nodegroup_id=ISSUE_REFERENCE_NODEGROUP,
            **{
                f"data__{ISSUE_REFERENCE_NUMBER_NODE}__en__value": reference_number,
            },
        ).first()
        if existing is not None:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Issue Report '{reference_number}' already present on {ha_number}"
                )
            )
            return

        parent = Tile(
            tileid=uuid.uuid4(),
            resourceinstance_id=resource_id,
            nodegroup_id=ISSUE_REPORT_NODEGROUP,
            data={},
        )
        parent.save(request=request)

        child = Tile(
            tileid=uuid.uuid4(),
            resourceinstance_id=resource_id,
            nodegroup_id=ISSUE_REFERENCE_NODEGROUP,
            parenttile=parent,
            data={
                ISSUE_REFERENCE_NUMBER_NODE: {
                    "en": {"value": reference_number, "direction": "ltr"}
                },
                ISSUE_REFERENCE_TYPE_NODE: None,
                ISSUE_REFERENCE_METATYPE_NODE: None,
            },
        )
        child.save(request=request)

        # The launcher queries Elasticsearch rather than the database to list the
        # Heritage Assets, so the resource has to be reindexed.
        Resource.objects.get(pk=resource_id).index()

        self.stdout.write(
            self.style.SUCCESS(
                f"Created Issue Report '{reference_number}' on Heritage Asset "
                f"{ha_number} ({resource_id})"
            )
        )
