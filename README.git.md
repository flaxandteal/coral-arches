# Git standards for Coral

## Prerequisites

We are following the Conventional Commits standards. This will keep all commits in the same format. Makes the commits machine readable and human readable. Overall makes life much easier to read commits and understand the reason they where made.

It would be a good idea to make yourself familiar with the website which outlines the standards:

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

The reason it's so important to keep these in the commit history is so that when someone is updating either dev or uat they have a clear readable history of updates they need to made. In our local environment they happen when we do a database reset but these need to be manually refreshed in production.

## Conventional Commits

You'll primarily use `feat` and `fix`. All bug fixes or commits related to fixing a problem should be:

```
fix: made a change to fix something
```

All new features or code that adds new functionality should be:

```
feat: add new functionality to something
```

### Other types

Although the `feat` and `fix` are the main two for identifying changes. There are other categories that you can use when you see fit to provide a better description to your commit:

> The better your understanding of when and where to use these will provide the best development experience for both yourself and the people working along side you.

- chore
- docs
- build
- ci
- perf
- refactor
- revert
- style
- test

## Branch naming

By proxy we use similar naming for our branches. Before starting any work you should be aware of your initial objective of whether your working on a fix, feat or documentation etc.

You should name your branch based on that objective, for example:

### Feature:

```
feat/my-new-feature
```

### Fix:

```
fix/description-of-bug-in-my-new-feature
```

### Docs:

```
docs/documenting-my-new-feature
```

Follow this standard for all the other conventional commits spec.

## Additional Coral Standards

While utilising these standards has simplified all aspects of maintaining a clear commit history. We can use the [Commit Message Scope](https://www.conventionalcommits.org/en/v1.0.0/#commit-message-with-scope) standard to make it easier to understand changes in the Coral files.

### Graph model changes

For example if I made a change to the `Consultation.json` graph model. This needs to be known by everyone that this change was made. Otherwise we run into issues of having out of sync models, inevitably resulting in lost changes/work.

To solve this when you make a change to a model include it inside your commit message scope, like so:

```
feat(Consultation): add new field
```

Make sure you are only committing the changes to this model. If you have multiple model changes commit them individually, like so:

```
feat(Consultation): add new field
feat(Monument): removed field
```

### Workflow changes

Similarly to the graph model changes. Workflows also need to be manually updated. So provide a commit message that can be identified by the person doing the update.

```
feat(archive-catalogue-workflow): add new step and nodegroups
```

### Widgets, Datatypes, Functions

Each of these are the same as workflows and graph models they all contain some form of configuration data and when that's changed needs to manually updated into the database. Or a full database reset if your working locally.

## The changelog

Every PR writes its own changelog entry, in the same commit as the code. This is not
generated for you — CI fails the PR if `CHANGELOG.md` is untouched. If a PR genuinely
warrants no entry, apply the `no-changelog` label to skip the check.

Add one bullet per change under `## Unreleased` → `### Changes`, ending with the PR
number:

```
- fix(consultation): planning ref no longer lost on save (#832)
```

Use `### Notes` for anything a reader of the release needs beyond the change itself —
in particular the manual database updates described above. Name the model, workflow,
widget or function that has to be updated by hand.

`## Unreleased` is the only section you edit. Cutting a release archives it to
`changelogs/vX.Y.Z.md` and empties it again — see `README.versioning.md`.

## Branch flow

Branch off `dev`, PR back into `dev`. Releases are cut from `dev` and PR'd into
`main`; nothing is merged straight into `main`.

```
feat/my-thing ──PR──> dev ──./release──> release/vX.Y.Z ──PR──> main
```