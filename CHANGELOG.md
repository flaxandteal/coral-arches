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

- fix(workflows): Save and Complete Workflow saves the last step's unsaved entries, and Save no longer shows after saving a single-tile step
- fix(letters): planning combined response fetches only its placeholders, so generating no longer times out (#3447)
- fix(letters): planning response picks up .PDF uploads as well as .pdf (#3415)

### Notes

- Run `python manage.py coral reload` to apply the updated assign-consultation workflow.
