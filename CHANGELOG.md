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
- fix(pdf-merger): uploaded HB/HM response files beyond the first 15 related resources now show in the merger (#946)
- fix(pdf-merger): uploads with brackets or renamed on clash no longer fail with "No file found" (#946)
- fix(pdf-merger): letters whose Section Reference sits near the top of the page no longer merge blank (#946)
- fix(pdf-merger): merged letters keep paragraphs, nested bullets and hanging indents, and rejoin hyphenated words (#946)
- fix(pdf-merger): preview no longer shows a wide gap after indented bullets (#946)
- fix(pdf-merger): generated documents are listed newest first (#946)

### Notes
