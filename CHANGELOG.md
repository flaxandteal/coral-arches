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

- feat(search): SimpleSearch filters are authored in the repo — `search_config` generates
  them per graph, `load-filters` seeds the rows, `gaps` reports what cannot render (#849)
- feat(search): search results render their cards again — `generate-cards` / `load-cards`
  author the result row and drop-down configs, without which every result was blank (#849)
- fix(search): reference nodes on huge controlled lists are no longer offered as filters —
  9,635 checkboxes for Administrative Area. Still filterable in AdvancedSearch (#849)
- fix(search): drop-down no longer shows empty sections — a Heritage Asset goes from 53 to
  around 14 (#849)
- perf(search): `load-cards --prune-empty` drops never-filled columns — Heritage Asset's
  drop-down from 187 columns to 121 (#849)
- feat(search): resource descriptors are indexed into the term index, so resources
  identified by a primary reference number can be found by typing it (#850)
- feat(search): results are ranked by descriptor match, exact first — arches_search has no
  relevance ordering, so they were coming back in resource id order (#850)
- perf(search): result type counts run as one SQL group by instead of a two hop traversal
  per graph — a term matching 27 resources took 74s (#850)

### Notes

- Nothing seeds the search configs automatically. After deploying #849 run
  `search_config load-filters` and `search_config load-cards`, or filters and cards will
  not appear. `--prune-empty` needs representative data to be meaningful
- Result type chip counts no longer include resources reached only by relationship, so
  they get smaller, but they now agree with the total which they never did before. Set
  `CORAL_FAST_RESOURCE_TYPE_COUNTS = False` to restore the old behaviour
- Run `manage.py index_descriptors` after a full arches_search reindex to rebuild the
  descriptor terms
