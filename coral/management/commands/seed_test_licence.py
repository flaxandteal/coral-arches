import uuid

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from arches.app.models.models import Node, ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

from coral.management.commands.seed_test_issue_report import (
    PERSON_FULL_NAME_NODE,
    PERSON_NAME_NODEGROUP,
)
from coral.utils.reference_values import reference_value
from coral.utils.test_seed_guard import require_test_environment

LICENCE_GRAPH = "cc5da227-24e7-4088-bb83-a564c4331efd"
ACTIVITY_GRAPH = "b9e0701e-5463-11e9-b5f5-000d3ab1e588"

LICENCE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:licence"))
SITE_ID = str(uuid.uuid5(uuid.NAMESPACE_URL, "coral-e2e:licence-site"))

# Kept clear of "AE": licence_number_function takes the newest number containing it as
# the last one issued, so a test number there would derail real numbering.
LICENCE_NUMBER = "LIC-TEST-001"
CM_NUMBER = "CM-TEST-LIC"
SITE_NAME = "Test Excavation Site"
LICENSEE_NAME = "Test Person"

LICENCE_NAME_NODEGROUP = "59d65ec0-48b9-11ee-84da-0242ac140007"
LICENCE_NAME_NODE = "59d6676c-48b9-11ee-84da-0242ac140007"
LICENCE_NUMBER_NODEGROUP = "6de3741e-c502-11ee-86cf-0242ac180006"
LICENCE_NUMBER_NODE = "9a9e198c-c502-11ee-af34-0242ac180006"
STAGE_NODEGROUP = "4f0f655c-48cf-11ee-8e4e-0242ac140007"
STAGE_NODE = "a79fedae-bad5-11ee-900d-0242ac180006"
GRANTED_LIST_ITEM = "1b180b5b-14e9-5361-91db-5f13e95ea176"
CM_NODEGROUP = "b84fa9c6-bad2-11ee-b3f2-0242ac180006"
CM_NUMBER_NODE = "b84fb182-bad2-11ee-b3f2-0242ac180006"
CONTACTS_NODEGROUP = "6d290832-5891-11ee-a624-0242ac120004"
LICENSEE_NODE = "6d294784-5891-11ee-a624-0242ac120004"
ASSOCIATED_ACTIVITY_NODEGROUP = "a9f53f00-48b6-11ee-85af-0242ac140007"

SITE_NAME_NODEGROUP = "4a7bba1d-9938-11ea-86aa-f875a44e0e11"
SITE_NAME_NODE = "4a7be135-9938-11ea-b0e2-f875a44e0e11"


def text(value):
    return {"en": {"value": value, "direction": "ltr"}}


class Command(BaseCommand):
    help = (
        f"Create a granted Licence ({LICENCE_NUMBER}) linked to an excavation site, for "
        "the Excavation Site Visit launcher to pick. Its CM number, site name and "
        "licensee fill the Site Visit step's licence panel. Re-running updates it in "
        "place. TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def handle(self, *args, **options):
        require_test_environment("seed_test_licence")

        licensee = Tile.objects.filter(
            nodegroup_id=PERSON_NAME_NODEGROUP,
            **{f"data__{PERSON_FULL_NAME_NODE}__en__value": LICENSEE_NAME},
        ).first()
        if licensee is None:
            raise CommandError(f"No Person named '{LICENSEE_NAME}' - seed the people first")

        try:
            granted = reference_value(GRANTED_LIST_ITEM)
        except Exception:
            granted = None
        if not granted:
            raise CommandError(f"List item '{GRANTED_LIST_ITEM}' (Granted) is not loaded")

        # Tile post-save functions dereference request.user, so hand them a real request.
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        self._resource(SITE_ID, ACTIVITY_GRAPH, request)
        self._tile(SITE_ID, SITE_NAME_NODEGROUP, {SITE_NAME_NODE: text(SITE_NAME)}, request)

        self._resource(LICENCE_ID, LICENCE_GRAPH, request)
        self._tile(LICENCE_ID, LICENCE_NAME_NODEGROUP,
                   {LICENCE_NAME_NODE: text(f"Excavation Licence {LICENCE_NUMBER}")}, request)
        self._tile(LICENCE_ID, LICENCE_NUMBER_NODEGROUP, {LICENCE_NUMBER_NODE: text(LICENCE_NUMBER)}, request)
        self._tile(LICENCE_ID, CM_NODEGROUP, {CM_NUMBER_NODE: text(CM_NUMBER)}, request)
        self._tile(LICENCE_ID, CONTACTS_NODEGROUP,
                   {LICENSEE_NODE: [{"resourceId": str(licensee.resourceinstance_id)}]}, request)
        self._tile(LICENCE_ID, ASSOCIATED_ACTIVITY_NODEGROUP,
                   {ASSOCIATED_ACTIVITY_NODEGROUP: [{"resourceId": SITE_ID}]}, request)
        # Granted without a Cur D decision tile, so licence_number_function issues no number of its own.
        self._tile(LICENCE_ID, STAGE_NODEGROUP, {STAGE_NODE: granted}, request)

        # The launcher lists licences from Elasticsearch.
        Resource.objects.get(pk=SITE_ID).index()
        Resource.objects.get(pk=LICENCE_ID).index()

        self.stdout.write(self.style.SUCCESS(
            f"Seeded granted Licence {LICENCE_NUMBER} ({LICENCE_ID}) for site '{SITE_NAME}'"
        ))

    def _resource(self, resource_id, graph_id, request):
        if not ResourceInstance.objects.filter(pk=resource_id).exists():
            Resource(resourceinstanceid=resource_id, graph_id=graph_id).save(request=request)

    def _tile(self, resource_id, nodegroup_id, values, request):
        tile = Tile.objects.filter(resourceinstance_id=resource_id, nodegroup_id=nodegroup_id).first()
        if tile is None:
            tile = Tile(
                tileid=uuid.uuid5(uuid.NAMESPACE_URL, f"coral-e2e:{resource_id}:{nodegroup_id}"),
                resourceinstance_id=resource_id,
                nodegroup_id=nodegroup_id,
                data={
                    str(node.pk): None
                    for node in Node.objects.filter(nodegroup_id=nodegroup_id).exclude(datatype="semantic")
                },
            )
        tile.data.update(values)
        tile.save(request=request)
