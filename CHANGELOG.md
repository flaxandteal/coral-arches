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

- perf(workflows): share one in-flight request across a step's components for `/cards`, `/graphs` and `get_user_names` (#866)
- perf(workflows): batch a step's `workflow_history` patches into one post per tick (#866)
- perf(workflows): build one `GraphModel` per resource rather than one per component (#866)
- perf(workflows): build only the card branch a component displays, not every top card on the resource (#866)
- perf(tiles): defer tile-save re-indexing to a celery task, collapsing a step's saves into one re-index (#866)
- fix(workflows): refetch a component's card data after it saves, so values written by functions are displayed (#866)

- fix(functions): update retired v8 node ids in functions (#854)

- fix(dashboards): convert designation dashboard to v8 node ids and controlled lists (#852)
- fix(shim): resolve `where()` tile filters in SQL rather than loading every resource in the graph (#852)
- fix(shim): collapse nodegroup-level nodes on attribute access, so a single-node nodegroup returns its node (#852)
- perf(shim): load dashboard resources in one query per model instead of one per row (#852)
- fix(dashboards): correct designation card paths for v8 and drop `node_check` (#852)

### Notes

- Tile saves no longer re-index to Elasticsearch inline; a celery task does it
  after the transaction commits, and waits `INDEX_DEBOUNCE_SECONDS` (5) so that a
  step's parallel tile saves collapse into a single re-index. Search is therefore
  eventually consistent after a save rather than immediate, by roughly that long.
  Because this adds a task, web and worker must be restarted together on deploy —
  a running worker cannot resolve a task it did not import at startup. (#866)
