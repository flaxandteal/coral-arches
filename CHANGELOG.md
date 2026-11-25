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
- fix(workflows): State Care Initial Step shows the asset's SMR number locked, and Open Selected lists every survey for the chosen asset
- test(cypress): archive cataloguing spec follows its UAT checklist
- fix(workflows): Excavation Site Visit shows the licence details, and its launcher lists every site visit by its ESV reference

### Notes
- State Care: run `python manage.py plugin update -s coral/plugins/state-care-condition-survey-workflow.json` after deploying.
- Excavation Site Visit: run `python manage.py plugin update -s coral/plugins/excavation-site-visit-workflow.json` after deploying.
