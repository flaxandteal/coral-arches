# v8 node id audit

The v8 graph regeneration re-minted node ids as deterministic UUID v5 values
(`a62658ef-bb95-5dc5-...`) in place of the old time-based v1 ids
(`e71df5cc-3aad-11ef-...`). Anywhere the codebase hardcodes an id, that id may now
point at nothing.

**These failures are silent.** Nothing enforces referential integrity from a
hardcoded string to `nodes.nodeid`, so a stale id is just a predicate that never
matches — valid SQL returning zero rows, which is indistinguishable from "no data
qualifies". No exception, no log line.

Run the audit against a live database:

```sh
python scripts/audit_node_ids.py --container coral-db-1
```

The database is the source of truth, not `coral/pkg/graphs` — the package lags in
both directions.

## What the audit found

Sweeping `coral/` and `tests/` (excluding `pkg/`, build output and uploaded files)
against a live v8 database: **2772 distinct UUIDs in source, 683 absent from the
database.**

Cross-checking those against the package graphs splits them:

| | count | meaning |
|---|---|---|
| dead in DB **and** package | 586 | genuinely retired — high confidence |
| dead in DB, present in package | 86 | ambiguous — package and DB disagree, needs a case-by-case look |

Resolving the 586 against the pre-v8 graph definitions still in git
(`97306adb` — the last commit before the upgrade) classifies the work:

| class | ids | what it needs |
|---|---|---|
| id changed, datatype unchanged | 215 | a straight id swap |
| `concept` / `concept-list` / `domain-value` → `reference` | 53 | code changes, not an id swap |
| domain-value **option** ids | 48 | the option no longer exists at all |
| no pre-v8 identity | 322 | mostly not node ids — see below |

### The 322 are mostly false positives

Most are workflow-internal identifiers, not database references — in
`coral/plugins/*.json` they sit under `uniqueInstanceName`, and under
`resourceid` / `parenttileid` keys that reference a step by that same instance
name (`"['start-step']['768652bb-...']"`). They are invented by the workflow
author and correctly absent from the database. The remainder are notification
type ids, graph publication ids, and template keys.

**Do not bulk-replace anything in this class.** Each needs looking at.

### Why the `reference` conversions are not id swaps

Coral moved almost entirely from concepts and domain values to controlled lists —
only **16 domain options remain in the entire database**. A `reference` tile stores

```json
[{"uri": "...", "list_id": "...", "labels": [{"value": "...", "list_item_id": "..."}]}]
```

so the old `tiledata ->> '<node>' = '<option id>'` can never match: it compares a
scalar against a list. Those comparisons need `jsonb_array_elements`, and the
option id needs replacing with a controlled list item id. The 48 dead option ids
have no replacement at all until the equivalent list item is identified.

For a worked example see `coral/views/dashboards/sql_query/config/designation_config.py`,
where Council and Status Type were converted, and
`tests/coral_tests/test_designation_query.py`, which guards the result.

## Work breakdown

Branches are prefixed `fix/v8-ids-` — `git branch --list 'fix/v8-ids-*'`.

| area | safe swaps | needs `reference` work | dead options | branch |
|---|---|---|---|---|
| `coral/plugins` | 118 ids / 258 occ | 40 | 9 | `fix/v8-ids-plugins` |
| `coral/media/js` | 61 ids / 73 occ | 20 | 22 | `fix/v8-ids-workflows-js` |
| `coral/functions` | 17 ids / 20 occ | 6 | 38 | `fix/v8-ids-functions` |
| `coral/views` | 11 ids / 11 occ | 4 | 6 | `fix/v8-ids-views` |
| `coral/views/dashboards` | done | done | done | merged via designation work |
| `tests/models` | 9 ids / 14 occ | 2 | 3 | not started — see below |

Each `fix/v8-ids-*` branch applies **only** the safe swaps for its area. The
`reference` conversions and dead option ids are deliberately left, because they
need someone to decide which controlled list item replaces each option.

`tests/models/*.json` is excluded on purpose: those fixtures *define* their own
graphs rather than referencing the real ones, so their ids are not stale in the
same sense and rewriting them would likely break the fixtures.

## Known live-data consequences

Three functions still trigger on a nodegroup that no longer exists — they never
fire when a Heritage Asset References tile is saved:

```sql
SELECT f.name, fxg.config->'triggering_nodegroups'
FROM functions_x_graphs fxg JOIN functions f ON f.functionid = fxg.functionid
WHERE fxg.config::text LIKE '%e71df5cc-3aad-11ef-a2d0-0242ac120003%';
```

`Notify for Heritage Asset`, `IHR Number Validation` and `Generate Heritage Asset
Name`. This is database state, not repository state, so no branch here fixes it.
