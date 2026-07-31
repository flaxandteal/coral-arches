"""Seed coral's RBAC graph — Groups, their permissions, and one login per group.

`coral/pkg/business_data` only ships a subset of the Group resources (the
Enforcement, Excavation and Planning teams plus the Global/PUBLIC roots), so a
freshly bootstrapped database has no State Care, Archive, HARNI, Second Survey,
Records and Designation, Field Monument Warden or Ranger groups at all — and no
non-superuser accounts. Cypress can therefore only log in as `admin`, which is a
superuser and bypasses every permission check, so nothing permission-related is
actually observable.

This command imports the full Group export vendored at
`cypress/seed/permissions/` and gives every group a login, then rebuilds the
Casbin policy table so the permissions take effect.

TEST ENVIRONMENTS ONLY - never run this against a real deployment. It creates
accounts with a shared, published password and a shared, published TOTP secret.
"""

import json
import re
import tempfile
import uuid
from pathlib import Path

from django.contrib.auth.models import Group as DjangoGroup, User
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.test import RequestFactory

from django_otp.plugins.otp_totp.models import TOTPDevice

from arches.app.models.models import Node, ResourceInstance
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SOURCE = (
    PROJECT_ROOT / "cypress" / "seed" / "permissions" / "Group_Permission_2025-06-30.json"
)
DEFAULT_FIXTURE = PROJECT_ROOT / "cypress" / "fixtures" / "permission_users.json"

GROUP_GRAPH = "07883c9e-b25c-11e9-975a-a4d18cec433a"
GROUP_NAME_NODE = "127095f5-c05e-11e9-bb57-a4d18cec433a"
# The Members nodegroup is single-node, so nodegroup id == node id.
GROUP_MEMBERS_NODE = "bb2f7e1c-7029-11ee-885f-0242ac140008"
# Ditto for Django Group. Its tile value is an *integer auth_group PK*, and the
# export carries whatever PKs the source database happened to use, none of which
# exist here — see _remap_django_groups().
GROUP_DJANGO_GROUP_NODE = "5acdfb22-1135-11ef-a3bd-0242ac170006"

PERSON_GRAPH = "22477f01-1a44-11e9-b0a9-000d3ab1e588"
PERSON_NAME_NODEGROUP = "4110f741-1a44-11e9-885e-000d3ab1e588"
PERSON_FULL_NAME_NODE = "5f8ded26-7ef9-11ea-8e29-f875a44e0e11"
PERSON_USER_ACCOUNT_NODE = "b1f5c336-6a0e-11ee-b748-0242ac140009"

# Same RFC 6238 test key seed_test_totp gives admin, so cypress.config.js's
# single `generateOtp` task works for every seeded account.
TOTP_TEST_KEY = "3132333435363738393031323334353637383930"

# Fixed namespace so Person ids and resource-x-resource ids are stable across
# runs; re-running the command updates in place rather than duplicating.
SEED_NAMESPACE = uuid.UUID("f6c1b3a2-5f0e-4a3d-9c7b-1e2d3a4b5c6d")

USERNAME_PREFIX = "e2e_"
DEFAULT_PASSWORD = "coral-e2e-permissions"


def slugify_group(name):
    """Group display name -> username stem.

    The 2025-06-30 export wraps a few names in underscores (`_FMW Inspection_`,
    `_Heritage Asset Creator_`); those are stripped so the usernames read
    normally.
    """
    stem = re.sub(r"[^a-z0-9]+", "_", name.strip().lower())
    return stem.strip("_")


class Command(BaseCommand):
    help = (
        "Import the full coral Group/permission export and create one login per "
        "group (username e2e_<group name>, shared password and TOTP secret), then "
        "rebuild the Casbin policy table. TEST ENVIRONMENTS ONLY."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=str(DEFAULT_SOURCE),
            help=f"Group business-data export to import (default: {DEFAULT_SOURCE}).",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Password for every seeded account (default: {DEFAULT_PASSWORD}).",
        )
        parser.add_argument(
            "--fixture",
            default=str(DEFAULT_FIXTURE),
            help=(
                "Where to write the group -> username map Cypress reads "
                f"(default: {DEFAULT_FIXTURE}). Pass an empty string to skip."
            ),
        )
        parser.add_argument(
            "--no-users",
            action="store_true",
            help="Import the groups and permissions only; do not create logins.",
        )
        parser.add_argument(
            "--no-recalculate",
            action="store_true",
            help=(
                "Skip the apply_sets/recalculate_table pass. The import is inert "
                "without it — only useful when chaining several seed commands."
            ),
        )

    def handle(self, *args, **options):
        source = Path(options["source"])
        if not source.is_file():
            raise CommandError(f"No such business-data export: {source}")

        raw = json.loads(source.read_text())
        groups = [
            resource
            for resource in raw.get("business_data", {}).get("resources", [])
            if resource["resourceinstance"]["graph_id"] == GROUP_GRAPH
        ]
        if not groups:
            raise CommandError(f"{source} contains no Group resources")

        self._remap_django_groups(groups)

        users = {} if options["no_users"] else self._create_users(groups, options["password"])
        if users:
            # The Persons have to exist before the import: the Members tiles
            # point at them, and the importer writes resource-x-resource rows
            # for those references as it goes.
            self._create_persons(users)
            self._attach_members(groups, users)

        self._clear_tiles(groups)
        self._import(raw)

        if options["fixture"] and users:
            self._write_fixture(Path(options["fixture"]), users, options["password"])

        if not options["no_recalculate"]:
            self._recalculate()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(groups)} group(s) and {len(users)} login(s) from {source.name}"
            )
        )

    # -- groups ------------------------------------------------------------

    def _remap_django_groups(self, groups):
        """Point every Django Group tile at an auth_group row that exists here.

        The datatype resolves the tile value with `Group.objects.get(pk=...)`, so
        a stale PK from the source database is not merely ignored — the group
        silently loses its Django group, and recalculate_table then never assigns
        any users to it.
        """
        remapped = 0
        for resource in groups:
            name = resource["resourceinstance"]["name"]
            if not name:
                continue
            django_group, _ = DjangoGroup.objects.get_or_create(name=name)
            for tile in resource["tiles"]:
                if GROUP_DJANGO_GROUP_NODE in tile["data"]:
                    tile["data"][GROUP_DJANGO_GROUP_NODE] = django_group.pk
                    remapped += 1
        self.stdout.write(f"Remapped {remapped} Django Group reference(s)")

    def _attach_members(self, groups, users):
        """Add each group's seeded Person to its Members tile, in the JSON.

        Done before the import rather than as a second Tile.save() pass so the
        membership lands in the same write as the rest of the group.
        """
        for resource in groups:
            resource_id = resource["resourceinstance"]["resourceinstanceid"]
            entry = users.get(resource_id)
            if not entry:
                continue
            reference = {
                "resourceId": entry["person_id"],
                "ontologyProperty": "",
                "inverseOntologyProperty": "",
                "resourceXresourceId": str(
                    uuid.uuid5(SEED_NAMESPACE, f"member:{resource_id}")
                ),
            }
            tile = next(
                (t for t in resource["tiles"] if GROUP_MEMBERS_NODE in t["data"]), None
            )
            if tile is None:
                resource["tiles"].append(
                    {
                        "data": {GROUP_MEMBERS_NODE: [reference]},
                        "nodegroup_id": GROUP_MEMBERS_NODE,
                        "parenttile_id": None,
                        "provisionaledits": None,
                        "resourceinstance_id": resource_id,
                        "sortorder": 0,
                        "tileid": str(
                            uuid.uuid5(SEED_NAMESPACE, f"members-tile:{resource_id}")
                        ),
                    }
                )
                continue
            members = tile["data"].get(GROUP_MEMBERS_NODE) or []
            if not any(m.get("resourceId") == entry["person_id"] for m in members):
                members.append(reference)
            tile["data"][GROUP_MEMBERS_NODE] = members

    def _clear_tiles(self, groups):
        """Drop the existing tiles of every group the export is about to write.

        `-ow overwrite` matches tiles by *tileid*, and this export regenerated
        them, so a group the package already shipped (HM Planning Managers, say)
        keeps its old Members tile and gains a second one — which the
        `__arches_check_excess_tiles_trigger_function` trigger rejects for a
        cardinality-1 nodegroup, aborting the import partway through. The export
        is a complete snapshot of each group, so clearing first loses nothing.

        Only the groups' own tiles go: relations *into* them are held on the
        referring resource's tiles, which are untouched.
        """
        ids = [resource["resourceinstance"]["resourceinstanceid"] for resource in groups]
        # A queryset delete, so no per-tile post-save/delete functions fire on
        # data that is about to be replaced wholesale.
        deleted, _ = Tile.objects.filter(resourceinstance_id__in=ids).delete()
        self.stdout.write(f"Cleared {deleted} existing tile row(s) on {len(ids)} group(s)")

    def _import(self, raw):
        with tempfile.NamedTemporaryFile(
            "w", suffix=".json", delete=False, encoding="utf-8"
        ) as handle:
            json.dump(raw, handle)
            path = handle.name
        try:
            call_command(
                "packages",
                operation="import_business_data",
                source=path,
                overwrite="overwrite",
            )
        finally:
            Path(path).unlink(missing_ok=True)

    # -- logins ------------------------------------------------------------

    def _create_users(self, groups, password):
        """One Django user (plus confirmed TOTP device) per group."""
        users = {}
        taken = set()
        for resource in groups:
            resource_id = resource["resourceinstance"]["resourceinstanceid"]
            name = resource["resourceinstance"]["name"] or resource_id
            stem = slugify_group(name) or resource_id.replace("-", "")
            username = f"{USERNAME_PREFIX}{stem}"
            if username in taken:
                # Two groups sharing a display name would otherwise collide onto
                # one account and silently merge their permissions.
                username = f"{username}_{resource_id[:8]}"
            taken.add(username)

            user, _ = User.objects.get_or_create(
                username=username,
                defaults={"email": f"{username}@example.invalid"},
            )
            user.set_password(password)
            user.is_active = True
            user.is_staff = False
            user.is_superuser = False
            user.save()

            TOTPDevice.objects.update_or_create(
                user=user,
                name="cypress",
                defaults=dict(
                    key=TOTP_TEST_KEY,
                    step=30,
                    t0=0,
                    digits=6,
                    tolerance=2,
                    confirmed=True,
                ),
            )

            users[resource_id] = {
                "group": name,
                "username": username,
                "user_id": user.pk,
                "person_id": str(uuid.uuid5(SEED_NAMESPACE, f"person:{resource_id}")),
            }
        self.stdout.write(f"Created/updated {len(users)} login(s)")
        return users

    def _create_persons(self, users):
        """A Person resource per user — this is what ties a login to a group.

        recalculate_table() walks a group's Members, collects the `user_account`
        off each Person, and *overwrites* the Django group's membership with
        exactly that set. Adding users to auth_group directly would be undone on
        the next recalculation; the Person is the record of truth.
        """
        request = RequestFactory().post("/")
        request.user = User.objects.filter(is_superuser=True).order_by("id").first()

        name_nodes = [
            str(node.pk)
            for node in Node.objects.filter(nodegroup_id=PERSON_NAME_NODEGROUP).exclude(
                datatype="semantic"
            )
        ]

        for entry in users.values():
            person_id = entry["person_id"]
            if not ResourceInstance.objects.filter(pk=person_id).exists():
                Resource(resourceinstanceid=person_id, graph_id=PERSON_GRAPH).save(
                    request=request
                )

            name_data = {node: None for node in name_nodes}
            name_data[PERSON_FULL_NAME_NODE] = {
                "en": {"value": entry["username"], "direction": "ltr"}
            }
            self._upsert_tile(person_id, PERSON_NAME_NODEGROUP, name_data, request)
            self._upsert_tile(
                person_id,
                PERSON_USER_ACCOUNT_NODE,
                {PERSON_USER_ACCOUNT_NODE: entry["user_id"]},
                request,
            )

            Resource.objects.get(pk=person_id).index()

        self.stdout.write(f"Created/updated {len(users)} Person record(s)")

    def _upsert_tile(self, resource_id, nodegroup_id, data, request):
        tile = Tile.objects.filter(
            resourceinstance_id=resource_id, nodegroup_id=nodegroup_id
        ).first()
        if tile is None:
            tile = Tile(
                tileid=uuid.uuid5(SEED_NAMESPACE, f"tile:{resource_id}:{nodegroup_id}"),
                resourceinstance_id=resource_id,
                nodegroup_id=nodegroup_id,
                data=data,
            )
        else:
            tile.data.update(data)
        tile.save(request=request)
        return tile

    # -- wiring ------------------------------------------------------------

    def _write_fixture(self, path, users, password):
        payload = {
            "__comment__": (
                "Generated by `manage.py seed_test_permissions`. Maps a coral Group "
                "display name to the E2E login seeded into it. Every account shares "
                "one password and the same RFC 6238 TOTP test key as admin."
            ),
            "password": password,
            "totpSecretHex": TOTP_TEST_KEY,
            "users": {
                entry["group"]: entry["username"]
                for entry in sorted(users.values(), key=lambda e: e["group"])
            },
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2) + "\n")
        self.stdout.write(f"Wrote {path}")

    def _recalculate(self):
        # Not importable until Django is ready.
        from coral.permissions.casbin import CasbinPermissionFramework
        from coral.utils.casbin import SetApplicator

        # apply_sets() also creates the Arches Plugin resources the groups'
        # "Arches Plugins" nodes point at — their ids are a hash of the plugin
        # slug, so the export's references resolve once this has run. It must
        # run before recalculate_table(), which reads those resources to grant
        # view_plugin. Failures are not caught: without this pass the seeded
        # logins get no workflow visibility, which is the whole point.
        SetApplicator(
            print_statistics=False, wait_for_completion=True, synchronous=False
        ).apply_sets()

        CasbinPermissionFramework().recalculate_table()
        self.stdout.write("Recalculated the Casbin policy table")
