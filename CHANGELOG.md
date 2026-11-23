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
- fix(webpack): production builds keep function names, so workflow steps find their cards again
- fix(pdf-merger): HB/HM response uploads show however many resources a consultation links, merge even with brackets in the filename or a Section Reference near the top of the page, and keep their paragraphs, nested bullets, hanging indents and hyphenated words; the preview drops the wide gap after bullets, and generated documents list newest first (#946)

### Notes
