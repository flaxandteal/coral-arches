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

- fix(dashboards): convert designation dashboard to v8 node ids and controlled lists (#852)
- fix(shim): resolve `where()` tile filters in SQL rather than loading every resource in the graph (#852)
- fix(shim): collapse nodegroup-level nodes on attribute access, so a single-node nodegroup returns its node (#852)
- perf(shim): load dashboard resources in one query per model instead of one per row (#852)
- fix(dashboards): correct designation card paths for v8 and drop `node_check` (#852)

### Notes
