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
- fix(workflow): Start New on the Issue Report launcher always opens a fresh report, and other reports' tiles no longer leak into an open workflow
- fix(migration): Heritage Asset TM65 functions repointed at the live Irish Grid Reference node
- test(cypress): Issue Report spec rewritten, with a `--reset` for `seed_test_issue_report` so HA/03 resets between runs

### Notes
- After deploy, run `python manage.py coral reload` so the `disableStartNew: false`
  change in `open-issue-report-workflow.json` / `open-workflow.json` takes effect —
  `get_plugin()` reads the `plugins` DB table, not the JSON file.
- The TM65 function node fix applies through `migrate` on deploy; no manual step
  needed.
