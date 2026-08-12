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

- chore(release): changelog is now written by PR authors, not generated — removed the
  changelog bot and its 250-line script
- chore(release): version lives only in `pyproject.toml`; `./release` cuts a release
  branch and PRs it into main
- chore(release): non-main builds show the commit they came from on the home page,
  e.g. `v8.2.0+dev.ab12cd34`

### Notes

- The `no-changelog` label must exist in the repo before the new check can be
  skipped: `gh label create no-changelog -d "PR needs no changelog entry" -c ededed`
- Previous sprint changelogs moved from the repo root into `changelogs/`
