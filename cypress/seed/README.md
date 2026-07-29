# E2E seed data

The Cypress suite was written against a populated development database. A freshly
bootstrapped one — which is what CI builds — has none of it: `coral/pkg/business_data`
ships only groups, permissions and sets, so there are **zero Heritage Assets**. Every
workflow launcher comes up empty and every spec that opens an existing record fails.

`seed.py` generates the missing baseline resources; the output is imported with
`manage.py packages -o import_business_data`.

## Running it

```bash
python3 -m venv .venv && ./.venv/bin/pip install -r cypress/seed/requirements.txt

./.venv/bin/python cypress/seed/seed.py \
  --pkg-dir coral/pkg \
  --graphs "Heritage Asset" -n 6 \
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

**`-n 6`** — Arches sets `minimumResultsForSearch: 5` on every select2Query binding
(`arches/app/media/js/bindings/select2-query.js`). Below that, selectWoo adds
`select2-search--hide` (`display: none`) to the search box and `cy.type()` fails with
"element is not visible". Six keeps the search path exercised.

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

Verified against a live database: all six import cleanly, the descriptor and the
`display_name` node both come out as above, and the resources are indexed into
Elasticsearch (which is what the launchers query — `09_state_care` runs an advanced
search for a non-null SMR Number).

## Caveats

- **HA Numbers must be unique.** `coral/utils/ha_number.py:validate_id` enforces it and
  `ha_number_function` raises on a clash. `HA/01`–`HA/06` are free on a fresh CI
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
