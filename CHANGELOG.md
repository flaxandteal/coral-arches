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
- fix(letters): designation letters fill in the owner and the asset's own address, fetching only the placeholders' values instead of hydrating the revision
- fix(workflow): Start New on the Issue Report launcher always opens a fresh report, and other reports' tiles no longer leak into an open workflow
- fix(migration): Heritage Asset TM65 functions repointed at the live Irish Grid Reference node
- fix(workflows): reference dropdowns honour `disabled` from a workflow's nodeOptions
- test(cypress): Issue Report spec rewritten, with a `--reset` for `seed_test_issue_report` so HA/03 resets between runs
- fix(migrations): HA Revision relevant-parties nodes repointed at the live relationship concept, fixing the 500 on save
- fix(letters): Letters step resolves the selected letter type's reference value before lookup, and keys the two advance listing letters on the live list items
- fix(shim): `ResourceModel.items()` resolves aliases through the same lookup `_SemanticNode` uses, so a real node alias starting with `_` (e.g. `_legacy_record`) no longer raises
- feat(seed): HA/04 carries values for every field the designation workflow shows
- fix(letters): the letter tile records the chosen letter type instead of a pre-v8 concept id, so generated letters are linked and shown
- fix(workflows): HA Designation Start step shows the revision's SMR Number from HA References, not the empty Generated SMR field
- fix(workflows): HA Designation launcher's revision list shows only the selected HA's revisions, not every HA's
- feat(seed): `seed_test_ha_revision` builds an open Monument Revision for HA/04 via the same task the designation launcher uses, skipping if one is already open
- fix(workflows): the evaluation meeting's last step renders again, and a new meeting with no building no longer errors
- feat(seed): seeded HA/04-06 carry an HB Number so the evaluation meeting building picker lists them
- fix(functions): add building saves with a blank HB Number, clearing any existing one, instead of asking for a Ward and District
- fix(workflows): Evaluation Meeting Location Details reads the Heritage Asset by alias, shows reference labels, and no longer flashes node chains while loading
- fix(migrations): unused Area Type list items (Council, County, Town, Townland and others) removed, leaving Barony, District, Parish and Ward
- fix(migrations): Area Name list cut to Barony, District, Parish and Ward, after repointing each value to the same-named entry under its Area Type's heading; items still in use are kept
- fix(notifications): the HA designation remap notification names the revision and its Open revision button opens the designation workflow again

### Notes
- Migration 8017 rewrites Area Name tile data in SQL, which bypasses Arches signals, so run a search reindex after deploy.
- Run `python manage.py coral reload` for the designation workflow letter config (`fetch: placeholders`).
- fix(workflows): HA Designation Start step no longer shows the SMR Number card; the reference numbers live on the Heritage Asset Details step, as #2047 intended

### Notes
- Run `python manage.py coral reload` after deploy for the Heritage Asset Designation Start step change.
- After deploy, run `python manage.py coral reload` so the `disableStartNew: false`
  change in `open-issue-report-workflow.json` / `open-workflow.json` and the Heritage
  Asset Designation Start step change take effect — `get_plugin()` reads the
  `plugins` DB table, not the JSON file.
- Run `python manage.py coral reload` and rebuild webpack for the Evaluation Meeting
  Location Details change (`evaluation-meeting-workflow.json` now lists node aliases).
- The TM65 and HA Revision relationship fixes apply through `migrate` on deploy.
- The advance listing letter `.docx` files must already exist in `docx/` in storage.
