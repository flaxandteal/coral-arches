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

- fix(workflows): HB number suffix generation now guards against unselected label
- feat(etl): install `arches-json-importer`, the bulk Arches JSON import module, as an
  Arches application — adds an *Import Arches JSON* option to the Bulk Data Manager (#TBC)
- fix(workflows): reinstate the v8 Heritage Asset node ids across the SMR/HB/garden/IHR
  number functions and views, HA name generation, notifications, the workflow components
  and the workflow plugin definitions — the ids previously in use are no longer nodes on
  the rebuilt graph (#TBC)
- fix(workflows): HB number has been updated to generate correctly from the referece data type (#841)
- chore(workflows): `add-building` updated to use the new v8 graph ids (#841)
- fix(reload): `coral reload_functions` has been added to the script to allow function config to be reloaded without removing the functions from the graphs (#841)
- fix(reload): `coral reload` no longer deletes widgets it does not own — it guarded
  deletion with a hardcoded list of Arches 7 core widgets, so it silently removed
  `reference-select-widget`, after which every graph import dropped the widget
  assignment for all `reference` nodes (#839)
- fix(reload): plugins, widgets and report templates now upsert on their own id, so an
  edit to an existing extension is actually applied — widgets were previously only
  written when absent, and plugins were matched on a name that never compared equal
  because `Plugin.name` is i18n in Arches 8 (#839)
- fix(workflows): SMR number generator reads the selected NISMR Numbering as a
  `reference` value rather than a concept valueid, and no longer assumes its tile entry
  is a knockout observable (#839)
- chore(workflows): remap Add Monument to the rebuilt Heritage Asset graph, along with
  the SMR/HB/garden/IHR number functions and HA name generation (#839)
- chore(release): changelog is now written by PR authors, not generated — removed the
  changelog bot and its 250-line script
- chore(release): version lives only in `pyproject.toml`; `./release` cuts a release
  branch and PRs it into main
- chore(release): non-main builds show the commit they came from on the home page,
  e.g. `v8.2.0+dev.ab12cd34`
- fix(search): stop advance search loading the graphs on the search page. Lazy load once the tab is selected (#829) 
- fix(dashboard): fix the infinite spinner if no config is found and show no tasks available (#822)
- fix(auth): add middleware for cookies (#834)

### Notes

- The `no-changelog` label must exist in the repo before the new check can be
  skipped: `gh label create no-changelog -d "PR needs no changelog entry" -c ededed`
- Previous sprint changelogs moved from the repo root into `changelogs/`
