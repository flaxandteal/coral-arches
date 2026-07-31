# E2E seed data

The Cypress suite was written against a populated development database. A freshly
bootstrapped one — which is what CI builds — has none of it: `coral/pkg/business_data`
ships only groups, permissions and sets, so there are **zero Heritage Assets**. Every
workflow launcher comes up empty and every spec that opens an existing record fails.

`seed.py` generates the missing baseline resources; the output is imported with
`manage.py packages -o import_business_data`.

There is a second gap, covered by [`permissions/`](#permissions-and-per-group-logins):
the shipped package only carries a third of the Group resources and no non-superuser
accounts at all.

## Running it

```bash
python3 -m venv .venv && ./.venv/bin/pip install -r cypress/seed/requirements.txt

./.venv/bin/python cypress/seed/seed.py \
  --pkg-dir coral/pkg \
  --graphs "Heritage Asset" -n 9 \
  --only-aliases monument_name,resourceid,smr_number,ihr_number,hb_number,historic_parks_and_gardens \
  --overrides cypress/seed/coral_e2e_overrides.json \
  -o seeded.json

# then, inside the arches container
python manage.py packages -o import_business_data -s /path/to/seeded.json -ow overwrite
```

`--list` prints the graph names it can see. Note coral's model is **`Heritage Asset`**
(other Arches projects call the equivalent thing "Heritage Item").

## Why the flags are what they are

Each one is load-bearing; they were added because the plain run failed.

**`-n 9`** — Arches sets `minimumResultsForSearch: 5` on every select2Query binding
(`arches/app/media/js/bindings/select2-query.js`). Below that, selectWoo adds
`select2-search--hide` (`display: none`) to the search box and `cy.type()` fails with
"element is not visible", so the count has to stay above five. Instances 7–9 are the
"Garden Test" assets `01_add_garden`'s three *open an existing HA* tests drive; they
have their own so that rewriting a display name mid-workflow cannot strand the
"Testing" assets the later specs assert on — the whole suite shares one database.

**`--overrides`** — `gen_value()` produces generic filler (`Sample monument name 1`).
The specs pick dropdown options by literal text, so Site Name and HA Number have to be
exact. See `coral_e2e_overrides.json`; its `__comment__` explains the SMR split.

**`--only-aliases`** — the unrestricted run generates all 74 tiles, which fires coral
post-save functions on synthetic data they were never written to handle. Two of them
crashed outright (`garden_number_function` dereferencing an absent county tile, for
one). Narrowing to the nodegroups the specs actually need sidesteps that entirely and
brings the resource down to 4 tiles.

**Not seeding `display_name`** — `generate_ha_name_function` creates that tile itself
via `Tile.get_blank_tile_from_nodegroup_id`. Supplying one as well gives two tiles for a
cardinality-1 nodegroup and the import fails with `TileCardinalityError`. Let the
function compute it.

There is also a `--skip-datatypes` flag, added while diagnosing the above. The concept
family (`concept,concept-list,reference,domain-value,domain-value-list`) generates value
ids that need matching RDM rows in the target database; without them, indexing dies with
`Value has no concept`. `--only-aliases` already excludes them for the coral run, so the
flag is not needed in the command above — it is there for seeding other graphs.

## What the display names come out as

`generate_ha_name_function` builds the name as `"{smr_number} {site_name}"` as soon as
**any** reference number is present, and only as `"{ha_number} {site_name}"` when none
is. That is why the seed is split — `02_flag_for_enforcement` searches for `HA/02`,
which would otherwise never be visible:

| # | Site Name | HA Number | SMR | Display name |
|---|---|---|---|---|
| 1–3 | Testing | HA/01–03 | — | `HA/01 Testing` … |
| 4–6 | Testing | HA/04–06 | SMR-TEST-004… | `SMR-TEST-004 Testing` … |
| 7–9 | Garden Test | HA/07–09 | — | `HA/07 Garden Test` … |

Verified against a live database: they import cleanly, the descriptor and the
`display_name` node both come out as above, and the resources are indexed into
Elasticsearch (which is what the launchers query — `09_state_care` runs an advanced
search for a non-null SMR Number).

## Caveats

- **HA Numbers must be unique.** `coral/utils/ha_number.py:validate_id` enforces it and
  `ha_number_function` raises on a clash. `HA/01`–`HA/09` are free on a fresh CI
  database, but a development database will usually already hold them — pick a spare
  range (`HA/91`+) when seeding locally.
- **Re-running is not idempotent.** Resource ids are UUID5-derived, so a second import
  after a *failed* one leaves partial tiles and trips `TileCardinalityError`. Delete the
  resources first.
- **`10_risk_assessment` cannot be seeded.** Its launcher filters on concept value
  `8da10724-1bd3-c095-6d4d-fb8657574b40`, which is absent from the loaded reference data
  (arches rejects it as "not an available concept value"). The spec is `it.skip`'d with
  the reason inline.
- **`BASE_URI`** still defaults to the namespace of the project this script came from.
  It only affects UUID5 seeds and RDM collection lookups; `--rdm-namespace` overrides it.
  Changing it changes the generated resource ids.

# Permissions and per-group logins

`coral/pkg/business_data` carries only 13 of coral's Group resources — the Enforcement,
Excavation and Planning teams plus the Global/PUBLIC roots. State Care, Archive, HARNI,
Second Survey, Records and Designation, Scheduled Monument Management, Field Monument
Wardens, the Ranger and the Architect/Archaeologist groups are all absent. It also ships
no user accounts, so the only login available is `admin` — a superuser, which
short-circuits every permission check. Nothing permission-related is observable.

`permissions/Group_Permission_2025-06-30.json` is a full export of the Group graph
(33 groups, with their `Permissions` and `Arches Plugins` nodes). `manage.py
seed_test_permissions` imports it and gives every group a login:

```bash
# inside the arches container
python manage.py seed_test_permissions
```

Then, in a spec:

```js
cy.loginAs('HB Planning Users');   // instead of cy.login()
```

`cy.loginAs` resolves the group name through `cypress/fixtures/permission_users.json`,
which the command writes. Every account shares one password and the same RFC 6238 TOTP
test key as `admin`, so `cypress.config.js`'s existing `generateOtp` task covers them
all. Usernames are `e2e_` + the group name lowercased (`e2e_hb_planning_users`).

## Why this export and not the other fourteen

The exports differ by more than date. `recalculate_table` builds the policy table by
walking down from `Global Group` through each group's `Members`, so a group that is not
reachable from the root contributes nothing, however complete its `Permissions` node
looks. Of the candidates:

| Export | Groups | Reachable from Global Group |
|---|---|---|
| `Group_Permission_2025-06-30` | 33 | **33** |
| `Group_Permissions_2025-05-23` | 33 | 32 (`Enforcement Admin` orphaned) |
| `Group_Permission_2025-05-14` | 38 | 27 |
| `Group_Permission_2025-04-07` | 39 | 24 |

Only the 2025-06-30 export is internally consistent. Note it renames four groups with
surrounding underscores — `_Heritage Asset Creator_`, `_FMW Inspection_`,
`_Designation Team Users_`, `_Planning Team User_` — and `cy.loginAs` matches that
literal text, so pass the name exactly as the fixture lists it.

The `Logset*.json` / `Logical_Set_*.json` exports are redundant: every Logical Set the
groups point at is already in `coral/pkg/business_data/Logical Sets.json`.

## What the command has to fix up

**Django group PKs.** The `Django Group` node stores an *integer `auth_group` PK*, and
the export carries the source database's (11–16, 22–27, 1544–1568). None exist in a
fresh database. This does not fail loudly: `DjangoGroupDataType.get_django_group` raises
`DoesNotExist`, `querysets_shim` turns that into a `MissingDjangoGroupViewModel`, and
`recalculate_table` logs a warning and moves on — the group ends up with no members and
no effect. The command re-resolves each one by name via `get_or_create` before importing.

**Person records.** `recalculate_table` collects a group's users by reading `user_account`
off each `Person` in its `Members`, then does `django_group.user_set.set(...)` with
exactly that set. Adding users straight to `auth_group` is therefore undone on the next
recalculation — the Person is the record of truth. The command creates one per account
(deterministic UUID5 ids, so re-running updates in place) and adds it to the group's
Members before the import, so the resource-x-resource rows are written in the same pass.

**Arches Plugin resources.** The groups' `Arches Plugins` nodes reference 31 resources
that the package does not ship. `SetApplicator.apply_sets()` creates them from the
installed plugins, with ids that are a hash of the plugin slug (`_consistent_hash`) —
the same ids the export references. So they resolve as long as `apply_sets` runs, which
the command does before `recalculate_table`. Skipping it (`--no-recalculate`) leaves the
whole import inert.

## What had to be fixed to make the policy table build

The import on its own produced *zero* Casbin policies. Four defects sat between the
seeded data and a working policy table, none of them caused by the seed — they all
reproduce on groups the export never writes (`Enforcement Management Group`,
`Planning Team Super Admin`), so `manage.py apply_sets` failed identically without it.
They are recorded here because they are all on the RBAC path and will bite again.

**1. Self-grouping nodegroups nested one level too deep** (`querysets_shim/wrapper.py`).
A nodegroup whose grouping node *is* its own single value node carries the same alias at
both levels, so `Members` arrived as `{"members": {"members": [...]}}`. Reading
`group.members` yielded the grouping wrapper and iterating it produced the dict's keys —
the literal string `"members"` — giving `AttributeError: 'str' object has no attribute
'user_account'`. `_collapse_self_grouping` drops that level on read, gated on the alias
appearing at both levels and being the only child, so semantic nodegroups
(`basic_info`, `permissions`, `identifier`, `statement`) are untouched.

**2. Untyped leaves** (`querysets_shim/wrapper.py`). Related resources came back as bare
`ResourceInstanceViewModel`, so `isinstance(member, Group)` could not tell a sub-group
from a Person; `django-group` and `user` leaves stayed raw integer PKs, so `gp.pk` and
`gp.user_set` failed; and `str(group)` gave `<Group id=...>`, which
`_ri_to_django_groups` would have used as an `auth_group` name. Related resources are now
*lazy* instances of the WKRM wrapper class (`_lazy_ref` / `_hydrate`) — lazy because
Group → members → Group would otherwise recurse without bound — `_typed_auth_leaf`
resolves the two Django-backed datatypes, and `__str__` returns the descriptor name.

**3. Reverse-side group assignment** (`coral/permissions/casbin.py`). `gp.user_set.set(users)`
fires `m2m_changed` with `instance` set to the *Group*, and arches' receiver
(`arches/app/signals.py`) does not check `reverse` before calling
`update_groups_for_user(instance)`, which immediately reads `user.groups`. That is an
upstream bug and fires for a plain `auth.Group` too. Membership is now assigned from the
User side, so `instance` is a User.

**4. The write-side mirror of (1)** (`querysets_shim/wrapper.py`). On save, a self-grouping
value node's stored form — `{"en": {...}}` for a string, a list for `members` — was
mistaken for a nested nodegroup and dropped. That is why every Arches Plugin resource had
tiles with null `name` and `plugin_identifier`: each group's `Arches Plugins` resolved to
unusable records and **no `view_plugin` policy was ever written**, so no workflow was
gated at all. `_collects_child_nodegroups` now requires the grouping node to be semantic,
and cardinality-n value nodes write one tile per entry.

Plus one in `coral/utils/casbin.py`: `_build_search_from_parameters` built each search
filter but never passed `querystring=`, so every filter fell back to its own default.
For `resource-type-filter` that default is `"[]"`, which both left the Logical Set's
member definition unapplied and tripped an `UnboundLocalError` in arches' filter (it
reads its loop variable after a loop that never ran). Arches' own `StandardSearchView`
passes the querystring; coral's reimplementation had dropped it.

### Verifying it still works

```bash
python manage.py seed_test_permissions   # must exit 0; apply_sets failures are fatal
```

Then check the policies actually discriminate — this is the signal that matters, since a
seed that "succeeds" while granting everyone everything looks identical to a working one:

| login | ranger-inspection | licensing | archive-catalogue | hb-planning-response |
|---|---|---|---|---|
| `e2e_ranger_user` | yes | – | – | – |
| `e2e_excavation_team_user` | – | yes | – | – |
| `e2e_archive_team_users` | – | – | yes | – |
| `e2e_hb_planning_users` | – | – | – | yes |
| `e2e_global_group` | yes | yes | yes | yes |

`Global Group` sits at the top of the hierarchy and accumulates every descendant's
permissions, which is `_fill_group`'s documented (and deliberately inverted) semantics.

## Caveats

- **It overwrites the group hierarchy.** The import is `-ow overwrite` and the export's
  `Global Group` replaces the existing one, so any group in the database but *not* in the
  export is cut loose from the root and stops receiving policies. On a package-loaded
  database that is `Enforcement Management Group`, `Enforcement Admin Group` and
  `Planning Team Super Admin`.
- **TEST ENVIRONMENTS ONLY.** The accounts share a password and a TOTP secret that are
  both published in this repo.
- **TOTP replay protection is per device.** Different users never collide, but one user
  logging in twice inside a 30-second step does — `cy.loginAs` wraps the login in
  `cy.session(..., { cacheAcrossSpecs: true })` for that reason. Do not unwrap it.
- **CI copies the fixture out of the container.** The Cypress container mounts the host
  checkout, which the arches container cannot write to; `cypress.yml` `docker cp`s
  `permission_users.json` back out, exactly as it already does for
  `frontend_configuration/`.
- **Arches Plugin resources cache the bug they were created with.** They are only created
  when missing (`apply_sets` skips ids it already knows), so the run that wrote them with
  null `name`/`plugin_identifier` left records that no later run would repair — and with
  no identifier, `apply_sets` cannot even match them back to a plugin. If `view_plugin`
  policies come out at zero, delete every resource on graph
  `e828f30f-f4ef-4e9b-aeb0-3998bcb7678a` and re-run; the ids are a hash of the plugin
  slug, so the groups' references resolve again on recreation.
