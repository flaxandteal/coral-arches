from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from arches.app.models.models import ResourceInstance
from arches.app.models.tile import Tile

from coral.tasks import remap_monument_to_revision
from coral.utils.test_seed_guard import require_test_environment

HERITAGE_ASSET_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"

# "HA System Reference" - carries the HA/NN number the assets are picked by.
HA_SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
HA_SYSTEM_REFERENCE_NUMBER_NODE = "325a430a-efe4-11eb-810b-a87eeabdefba"

# Revision's link back to its parent Heritage Asset, and the revision's own
# soft-delete flag -- see coral/views/monument_revision_remap.py and
# coral/tasks.py:remap_monument_to_revision.
REVISION_PARENT_MONUMENT_NODEGROUP = "6375be6e-dc64-11ee-924e-0242ac120006"
REVISION_DELETED_NODEGROUP = "9e59e355-07f0-4b13-86c8-7aa12c04a5e3"


class Command(BaseCommand):
    help = (
        "Give a Heritage Asset an open Monument Revision, built by the same "
        "remap_monument_to_revision task the designation launcher's "
        "'/remap-monument-to-revision' uses, so the designation workflow can be "
        "tested without waiting for the async build. Running it again is a "
        "no-op if an open revision already exists. "
        "TEST ENVIRONMENTS ONLY - never run this against a real deployment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--ha-number",
            default="HA/04",
            help="HA Number of the Heritage Asset to seed (default: HA/04).",
        )

    def handle(self, *args, **options):
        require_test_environment("seed_test_ha_revision")
        ha_number = options["ha_number"]

        system_ref = Tile.objects.filter(
            nodegroup_id=HA_SYSTEM_REFERENCE_NODEGROUP,
            resourceinstance__graph_id=HERITAGE_ASSET_GRAPH,
            **{
                f"data__{HA_SYSTEM_REFERENCE_NUMBER_NODE}__en__value": ha_number,
            },
        ).first()
        if system_ref is None:
            raise CommandError(f"No Heritage Asset with HA Number '{ha_number}'")

        ha_id = str(system_ref.resourceinstance_id)
        if not ResourceInstance.objects.filter(pk=ha_id).exists():
            raise CommandError(f"No resource instance '{ha_id}'")

        open_revision = self._find_open_revision(ha_id)
        if open_revision is not None:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{ha_number} already has an open revision ({open_revision})"
                )
            )
            return

        user = User.objects.filter(is_superuser=True).order_by("id").first()
        if user is None:
            raise CommandError("No superuser to run the remap as")

        result = remap_monument_to_revision(user.id, ha_id)
        if not result or not result.get("remapped"):
            raise CommandError(f"remap_monument_to_revision did not remap {ha_number}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Built revision {result['destinationResourceId']} for {ha_number}"
            )
        )

    def _find_open_revision(self, ha_id):
        """Revision resourceinstance id whose parent_monument is ha_id and isn't deleted, else None."""
        revision_ids = Tile.objects.filter(
            nodegroup_id=REVISION_PARENT_MONUMENT_NODEGROUP,
            data__contains={
                REVISION_PARENT_MONUMENT_NODEGROUP: [{"resourceId": ha_id}]
            },
        ).values_list("resourceinstance_id", flat=True)

        open_tile = Tile.objects.filter(
            resourceinstance_id__in=revision_ids,
            nodegroup_id=REVISION_DELETED_NODEGROUP,
            **{f"data__{REVISION_DELETED_NODEGROUP}": False},
        ).first()
        return open_tile.resourceinstance_id if open_tile else None
