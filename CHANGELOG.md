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
- fix(widgets): Irish Grid Reference keeps what was typed while the preview is what is saved, Long/Lat accepts either order, and the grid letter check uses one letter
- fix(widgets): Irish Grid Reference shows a saved value as Absolute or Long/Lat when the format is switched, and labels it Saved Value; the BNG widget no longer throws in strict mode, which broke the FMW Irish Grid step
- fix(workflows): FMW Inspection monument panel shows designation type, townland and B-file again, loaded in one `/orm/resources` request
- test(cypress): `--env FAST=1` stops a spec at the first failed test with video off and 4s timeouts; every run logs failed requests and browser errors to `cypress/logs/<spec>.jsonl`
- build(cypress): pass CORAL_ALLOW_TEST_SEED into the container so seeding runs; run E2E on release branch pushes and on demand, not on every PR; run the person and organisation fixture specs first (#905)

- fix(garden): garden reference number reads the county from the reference, not `/conceptvalue/`; the view returns 400 for a missing or unknown county (#902)

### Notes

