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

- fix(functions): update retired v8 node ids in functions (#854)
- fix(views): update retired v8 node ids in views (#855)
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

### Notes

- Consultation `Action Type` arrives from arches-her already bound to the "Mitigation
  Type" controlled list, so coral's own Assign To HM / HB / Both and Reject options were
  never carried into v8 — nothing failed, because the list it points at does exist, it is
  just the wrong one. coral-graphs branch `fix/consultation-action-type-list` declares a
  "Consultation Action Type" list and repoints the node. The `ASSIGN_*` constants in
  `coral/functions/notify_planning.py` already hold the ids that list will carry, so the
  assign-to-team notifications stay dormant until the rebuilt graphs are loaded, and need
  no further code change when they are.
