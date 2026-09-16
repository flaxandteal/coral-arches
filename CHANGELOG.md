# Changelog

Every PR adds its own entry in the same commit as the code. CI fails the PR if this
file is untouched — apply the `no-changelog` label to skip that for genuine
non-changes.

**Add your bullet under `## Unreleased` → `### Changes`, not directly under
`## Unreleased`.** One bullet per change, ending with the PR number:

```
- fix(consultation): planning ref no longer lost on save (#832)
```

Use `### Notes` only for things a reader of the release needs to know beyond the
change itself — a manual step, a caveat, a follow-up.

`## Unreleased` is the only section you ever edit. On release, `./release` moves
everything under it into `changelogs/vX.Y.Z.md` and leaves the headings empty again.

---

## Unreleased

### Changes

- feat(search): SimpleSearch filters are authored in the repo — `search_config` generates
  them per graph, `load-filters` seeds the rows, `gaps` reports what cannot render (#849)
- feat(search): search results render their cards again — `generate-cards` / `load-cards`
  author the result row and drop-down configs, without which every result was blank (#849)
- fix(search): reference nodes on huge controlled lists are no longer offered as filters —
  9,635 checkboxes for Administrative Area. Still filterable in AdvancedSearch (#849)
- fix(search): drop-down no longer shows empty sections — a Heritage Asset goes from 53 to
  around 14 (#849)
- perf(search): `load-cards --prune-empty` drops never-filled columns — Heritage Asset's
  drop-down from 187 columns to 121 (#849)
- feat(search): resource descriptors are indexed into the term index, so resources
  identified by a primary reference number can be found by typing it (#850)
- feat(search): results are ranked by descriptor match, exact first — arches_search has no
  relevance ordering, so they were coming back in resource id order (#850)
- perf(search): result type counts run as one SQL group by instead of a two hop traversal
  per graph — a term matching 27 resources took 74s (#850)
- perf(search): the attribute filter panel no longer builds every facet on open — PrimeVue's
  accordion rendered all 209 of Heritage Asset's reference facets and hid them with CSS,
  firing 1053 controlled list requests across 25 distinct lists (#NNN)
- fix(search): selecting a filter checkbox no longer collapses every accordion panel (#NNN)

### Notes

- Nothing seeds the search configs automatically. After deploying #849 run
  `search_config load-filters` and `search_config load-cards`, or filters and cards will
  not appear. `--prune-empty` needs representative data to be meaningful
- Result type chip counts no longer include resources reached only by relationship, so
  they get smaller, but they now agree with the total which they never did before. Set
  `CORAL_FAST_RESOURCE_TYPE_COUNTS = False` to restore the old behaviour
- Run `manage.py index_descriptors` after a full arches_search reindex to rebuild the
  descriptor terms
- The arches_search filter panel is patched by shadowing its component from `coral/src`.
  See `coral/src/README.md` for what is overridden and when each one can be deleted —
  both are staged as upstream PRs
- Each arches_search patch is behind a settings flag: `CORAL_PRUNE_EMPTY_REPORT_SECTIONS`,
  `CORAL_INDEX_DESCRIPTORS`, `CORAL_DESCRIPTOR_RELEVANCE_SORT`,
  `CORAL_FAST_RESOURCE_TYPE_COUNTS`. Set one to `False` to fall back to stock behaviour
  without a deploy
- perf(workflows): share one in-flight request across a step's components for `/cards`, `/graphs` and `get_user_names` (#866)
- perf(workflows): batch a step's `workflow_history` patches into one post per tick (#866)
- perf(workflows): build one `GraphModel` per resource rather than one per component (#866)
- perf(workflows): build only the card branch a component displays, not every top card on the resource (#866)
- perf(tiles): defer tile-save re-indexing to a celery task, collapsing a step's saves into one re-index (#866)
- fix(workflows): refetch a component's card data after it saves, so values written by functions are displayed (#866)

- fix(functions): update retired v8 node ids in functions (#854)
- fix(views): update retired v8 node ids in views (#855)
- fix(functions): the TM65 point functions on Heritage Asset write to the live Irish
  Grid Reference node again, so saving a geometry no longer 500s on the Add Monument
  location step. The v8 regeneration re-issued the node id but left both function
  configs, the risk-assessment view and the issue-report workflow on the retired one
  (#855)
- fix(workflows): the HB and HM planning consultation response workflows hide the other
  team's response, assignment and response-file tiles again. The team nodes are
  controlled-list references in v8, so the filter reads the selected list item id instead
  of comparing against the retired domain-value option id (#855)
- fix(notifications): planning and excavation notifications read controlled-list values
  again, so the excavation decision, classification and stage-of-application labels come
  back in their messages instead of being blank (#855)
- fix(functions): convert the remaining domain-value comparisons to controlled lists —
  composite score, consultation hierarchy, response assignee, report classification,
  licence number and extension, and enforcement mark-as-read all read the selected list
  item id now rather than testing a tile value against a retired option id
- fix(functions): the SMR and Historic Parks and Gardens number functions read their
  map sheet and county labels out of the reference tile value rather than looking up a
  concept valueid, which raised "is not a valid UUID" on save and lost the generated
  number

- fix(dashboards): convert designation dashboard to v8 node ids and controlled lists (#852)
- fix(shim): resolve `where()` tile filters in SQL rather than loading every resource in the graph (#852)
- fix(shim): collapse nodegroup-level nodes on attribute access, so a single-node nodegroup returns its node (#852)
- perf(shim): load dashboard resources in one query per model instead of one per row (#852)
- fix(dashboards): correct designation card paths for v8 and drop `node_check` (#852)
- fix(workflows-js): update retired v8 node ids in workflow JS (#856)

- fix(plugins): update retired v8 node ids in workflow plugin definitions (#857)

- fix(plugins): the HB and HM planning consultation response launchers list consultations
  assigned to "Both HM & HB" again. The Action Type filter still held retired v7 concept ids,
  and passed them as a bare uuid where the reference datatype wants a list of item URIs (#864)
- fix(workflows): workflow prefills that target a controlled-list node resolve through a new
  `/reference-value` endpoint before the tile is saved, so the assign and upload-response steps
  no longer fail with a bare "Unknown error" (#864)
- fix(notifications): a Person's `user_account` resolves to a User before a notification is
  written, so planning and enforcement notifications no longer 500 on tile save (#864)
- fix(notifications): an assignee without a user account is skipped rather than stopping every
  assignee after them from being notified (#864)
- fix(notifications): the planning admin notification is scoped to its own consultation instead
  of reusing the first admin notification in the table (#864)
- fix(workflows): response file uploads are named and linked to their consultation again. The
  Digital Object name tile carried four retired concept ids on reference nodes, so it failed and
  the relationship was never written (#864)
- fix(workflows): file errors surface as an alert instead of a TypeError — the handler reached
  for `this.viewModel` (never set) and `arches.requestFailed` (now under
  `arches.translations`) (#864)
- fix(letters): the planning response letter fills its placeholders again. A shim resource can
  be walked like a mapping, repeating nodegroups flatten into it, and reference values render as
  their labels rather than `Reference(uri=...)` (#864)
- fix(permissions): casbin reads a group's permission actions out of the reference tile value
  (#864)
- test: the HB and HM response workflow specs open a consultation instead of clicking a "Start
  New" button those workflows have never had (#864)
- fix(shim): a `where()` on a node alias compares against the value inside the annotation rather
  than the whole JSON document, so filtering a `string` or `reference` node matches instead of
  silently returning nothing, and `resourceid` filters the node rather than the descriptor (#869)
- fix(dashboards): the planning dashboard renders again — it filters, sorts and pages in the
  database instead of hydrating every consultation, counts each consultation's current Action
  tile rather than its first, and reads council options from the controlled list (#869)
- fix(functions): a generated SMR, HB or Historic Parks and Gardens number is copied onto the
  Heritage Asset References tile again. All three functions held retired ids for the nodegroup
  they trigger on and the node they read the generated number from, so the number was written
  but never carried across, and anything reading the reference numbers — the planning dashboard
  included — saw nothing (#870)
- fix(shim): `manage.py migrate` runs again. `coral/views/file_template.py` imported
  `UserViewModel` at module scope, and because that module is reachable from the URLconf that
  migrate's system checks load, the proxy model registered itself against an app that ships no
  migrations — aborting every migrate, on a fresh database or an existing one, with
  `InvalidBasesError`. The import is now local to the function that uses it (#868)
- chore(seed): the `seed_test_*` management commands refuse to run unless
  `CORAL_ALLOW_TEST_SEED=1` is set. They create logins with a shared published password, attach a
  published TOTP key to `admin`, and `seed_test_permissions` deletes and rewrites every Group's
  tiles before rebuilding the casbin policy table (#868)

### Notes

- Tile saves no longer re-index to Elasticsearch inline; a celery task does it
  after the transaction commits, and waits `INDEX_DEBOUNCE_SECONDS` (5) so that a
  step's parallel tile saves collapse into a single re-index. Search is therefore
  eventually consistent after a save rather than immediate, by roughly that long.
  Because this adds a task, web and worker must be restarted together on deploy —
  a running worker cannot resolve a task it did not import at startup. (#866)
- The planning response letter template asks for `<proposal_description_type>`, a classifier
  that is always empty, where it wants `<proposal_text>`. `coral/docx` is gitignored, so the
  corrected template has to be applied wherever the letter templates are mastered (#864)

- The SMR, HB and Historic Parks and Gardens number functions need the same package
  reload as the TM65 fix below: their `triggering_nodegroups` live in `functions_x_graphs`,
  not in code, and a running database still points all three at retired nodegroups, so none
  of them fires until the graphs are reloaded. coral-graphs `functions.json` already carries
  the corrected triggers — `a7742f3d-…` (SMR), `dc49f08f-…` (HB) and `5937558a-…` (gardens).

- The TM65 function fix only reaches a running instance through the graph package:
  the configs live in `functions_x_graphs`, not in code. coral-graphs `functions.json`
  carries the same correction (branch not yet pushed), so an existing database needs
  either a package reload or a one-off update of the two Heritage Asset rows for
  `561abd7c-…` and `e83afc88-…`.

- Consultation `Action Type` arrives from arches-her already bound to the "Mitigation
  Type" controlled list, so coral's own Assign To HM / HB / Both and Reject options were
  never carried into v8 — nothing failed, because the list it points at does exist, it is
  just the wrong one. coral-graphs branch `fix/consultation-action-type-list` declares a
  "Consultation Action Type" list and repoints the node. The `ASSIGN_*` constants in
  `coral/functions/notify_planning.py` already hold the ids that list will carry, so the
  assign-to-team notifications stay dormant until the rebuilt graphs are loaded, and need
  no further code change when they are.
