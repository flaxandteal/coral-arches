import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from arches.app.models.models import Node, ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

from coral.utils.test_seed_guard import require_test_environment

HERITAGE_ASSET_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"

# "HA System Reference" - carries the HA/NN number the assets are picked by.
HA_SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
HA_SYSTEM_REFERENCE_NUMBER_NODE = "325a430a-efe4-11eb-810b-a87eeabdefba"

# "Issue Report" is a parent (semantic, cardinality n) nodegroup on the Heritage
# Asset with an "Issue Reference" child holding the reference number. The
# launcher lists one option per child tile, labelled with that number, and hands
# the workflow the child's PARENT tile id -- see getParentTileOptions() in
# coral/media/js/views/components/plugins/open-issue-report-workflow.js.
ISSUE_REPORT_NODEGROUP = "7f835acf-5601-5dae-ac0f-6f030fc50ee7"
ISSUE_REFERENCE_NODEGROUP = "3497eaa2-fa47-59fa-a890-035b7c211278"
ISSUE_REFERENCE_NUMBER_NODE = "b075893b-848d-5520-9d52-3c3dfbecde16"
ISSUE_REFERENCE_TYPE_NODE = "b05b1e23-2f4f-56b7-be2a-296598698818"
ISSUE_REFERENCE_METATYPE_NODE = "50f2077e-b08e-5475-b028-0e323dbef26d"

PERSON_GRAPH = "22477f01-1a44-11e9-b0a9-000d3ab1e588"
PERSON_NAME_NODEGROUP = "4110f741-1a44-11e9-885e-000d3ab1e588"
PERSON_FULL_NAME_NODE = "5f8ded26-7ef9-11ea-8e29-f875a44e0e11"
CONTACT_PERSON_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:issue-report-contact"))
CONTACT_PERSON_NAME = "E2E Issue Contact"

# "Contacts" on the Heritage Asset -- --reset restores this to the snapshot
# below (the seeded contact as Field Worker, Occupier and Owner) since cypress
# runs add entries to these resource-instance-list nodes.
CONTACTS_NODEGROUP = "d62dd807-4739-59d7-91d1-e13038eb6eec"
CONTACTS_RESET_DATA = {
    "228bcd2f-4ca5-57ef-8149-9014d6edef51": [  # Field Worker
        {"resourceId": CONTACT_PERSON_ID}
    ],
    "45182ab1-5cf5-5c6c-9c84-a6c96f8d6e05": None,  # Owner Role Metatype
    "5cdca874-d8b8-57a7-af04-e87a1ad6ae82": [  # Occupier
        {"resourceId": CONTACT_PERSON_ID}
    ],
    "63061d5e-f81a-5eb7-b700-4c4eee7d7fbb": None,  # Agent Role Type
    "76638f35-434b-5d70-96ea-26f42833fb47": [  # Owner
        {"resourceId": CONTACT_PERSON_ID}
    ],
    "802fcd65-42f7-517b-9647-16fb0e2e2506": None,  # Agent
    "81e17dca-83a5-5d0d-bd90-2cafec54eec3": None,  # Applicant
    "89d00a8d-742a-5104-bb0d-707e7fa3da3a": None,  # Agent Role Metatype
    "9596d269-a186-53e8-bd3d-f210185134d4": None,  # Occupier Role Type
    "9ecc0c78-d53e-582b-8a2a-85dd98e26b15": None,  # Applicant Role Type
    "c438d94d-d15a-5539-89da-a1db565b47fa": None,  # Applicant Role Metatype
    "dbcfd526-bfe8-57b1-a53a-329dc665c033": None,  # Occupier Metatype
    "dc8887bd-7f36-5ee8-a6c7-ec68b39ceebc": None,  # Field Worker Role Type
    "ece88193-fd7b-567d-8e0f-943832aadf9f": None,  # Field Worker Role Metatype
    "eff5ab33-3b30-5372-9afe-504162666bf0": None,  # Owner Role Type
}


class Command(BaseCommand):
    help = (
        "Give a Heritage Asset an Issue Report so the Issue Report workflow's "
        "launcher has one to open. 'Start New' now creates its own, so this is "
        "no longer the only way in - it exists so a spec can exercise 'Open "
        "Selected' against a known reference (ISSUE-TEST-001) rather than one it "
        "just made. The launcher reads the asset list from Elasticsearch, so the "
        "resource is reindexed here. "
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
        parser.add_argument(
            "--reset",
            action="store_true",
            help=(
                "Before seeding, delete every Issue Report tile (and its "
                "descendants) on the Heritage Asset except --reference-number, "
                "and put the HA's Contacts tile back to what this seed writes. "
                "Lets a cypress run start from a known HA/03 state."
            ),
        )

    def handle(self, *args, **options):
        require_test_environment("seed_test_issue_report")
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

        self._ensure_contact_person(request)
        if options["reset"]:
            self._reset(resource_id, reference_number, request)

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

    def _ensure_contact_person(self, request):
        if not ResourceInstance.objects.filter(pk=CONTACT_PERSON_ID).exists():
            Resource(resourceinstanceid=CONTACT_PERSON_ID, graph_id=PERSON_GRAPH).save(
                request=request
            )
        name = Tile.objects.filter(
            resourceinstance_id=CONTACT_PERSON_ID, nodegroup_id=PERSON_NAME_NODEGROUP
        ).first()
        if name is None:
            name = Tile(
                tileid=uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:issue-report-contact:name"),
                resourceinstance_id=CONTACT_PERSON_ID,
                nodegroup_id=PERSON_NAME_NODEGROUP,
                data={
                    str(node.pk): None
                    for node in Node.objects.filter(
                        nodegroup_id=PERSON_NAME_NODEGROUP
                    ).exclude(datatype="semantic")
                },
            )
        name.data[PERSON_FULL_NAME_NODE] = {
            "en": {"value": CONTACT_PERSON_NAME, "direction": "ltr"}
        }
        name.save(request=request)
        Resource.objects.get(pk=CONTACT_PERSON_ID).index()

    def _reset(self, resource_id, keep_reference_number, request):
        roots = list(
            Tile.objects.filter(
                resourceinstance_id=resource_id, nodegroup_id=ISSUE_REPORT_NODEGROUP
            )
        )
        removed = 0
        for root in roots:
            reference = Tile.objects.filter(
                parenttile_id=root.tileid, nodegroup_id=ISSUE_REFERENCE_NODEGROUP
            ).first()
            number = (
                ((reference.data or {}).get(ISSUE_REFERENCE_NUMBER_NODE) or {})
                .get("en", {})
                .get("value")
                if reference
                else None
            )
            if number == keep_reference_number:
                continue
            # Tile.delete() already recurses through self.tiles (its children),
            # so one call removes the whole Issue Report/Location/Work
            # Proposed/... tree rooted at this parent tile.
            root.delete(request=request)
            removed += 1

        contacts = Tile.objects.filter(
            resourceinstance_id=resource_id, nodegroup_id=CONTACTS_NODEGROUP
        ).first()
        if contacts is not None:
            contacts.data = CONTACTS_RESET_DATA
            contacts.save(request=request)

        self.stdout.write(
            self.style.SUCCESS(
                f"Reset: removed {removed} Issue Report(s), kept "
                f"'{keep_reference_number}', restored Contacts tile "
                f"({'found' if contacts else 'none on this HA'})"
            )
        )
