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
- fix(workflows): Applicant (Agriculture & Forestry, DAERA) and Agent (DAERA) pickers offer only existing people, no "Create a new Person" row (#919)
- fix(enforcements): View Enforcements filters by the v8 Status list again and shows each enforcement's real status instead of always New (#920)
- fix(workflows): Edit then Clear on a multi-entry step leaves the edited entry intact and goes back to adding a new entry (#917)
- fix(widgets): Irish Grid Reference keeps what was typed while the preview is what is saved, Long/Lat accepts either order, and the grid letter check uses one letter
- fix(widgets): Irish Grid Reference shows a saved value as Absolute or Long/Lat when the format is switched, and labels it Saved Value; the BNG widget no longer throws in strict mode, which broke the FMW Irish Grid step
- fix(workflows): FMW Inspection monument panel shows designation type, townland and B-file again, loaded in one `/orm/resources` request
- test(cypress): `--env FAST=1` stops a spec at the first failed test with video off and 4s timeouts; every run logs failed requests and browser errors to `cypress/logs/<spec>.jsonl`
- build(cypress): pass CORAL_ALLOW_TEST_SEED into the container so seeding runs; run E2E on release branch pushes and on demand, not on every PR; run the person and organisation fixture specs first (#905)

- fix(workflows): Agri & Forestry / DAERA related HAs show townland, county and type, and the scheduled monument count follows the selection; the Within Deadline label clears its switch (#904)
- fix(garden): garden reference number reads the county from the reference, not `/conceptvalue/`; the view returns 400 for a missing or unknown county (#902)

- fix(heritage-asset): saving the references card is fast, and only notifies when a number is set or changed (#903)

- fix(ha_number): generating an HA number keeps working past HA/99

- fix(resource-instance-select): resources already picked show greyed out in multi-value resource pickers

- fix(datepicker): typing over the date filled in on open replaces it, a typed date past the maximum becomes the maximum, and deleting the text clears the date

- fix(workflows): a cleared field no longer leaves Save and Continue showing, and unchanged multi-entry steps offer no Save
- fix(letters): Generate is disabled until a letter type is chosen, and enabled when one is already saved
- fix(workflows): Save and Complete Workflow saves the last step's unsaved entries, and Save no longer shows after saving a single-tile step
- test(cypress): Add Building, Add Garden and Add IHR specs updated to the v8 workflows and their UAT checklists; select2 search handles multi-value fields without deleting chosen values; page loads may take up to 180s (#908)
- test(cypress): FMW Inspection, Issue Report, Flag for Enforcement, SMC, Agriculture and Forestry, DAERA, Curatorial and Add Monument specs updated to the v8 workflows and their UAT checklists; Test Person / Test Organisation added to the E2E seed (#907)

### Notes

- Run `python manage.py coral reload` to apply the Agriculture & Forestry and DAERA plugin change (no create on Applicant/Agent).
- Migration `8020_ihr_number_index` creates an index on the IHR number (`CREATE INDEX CONCURRENTLY`).
