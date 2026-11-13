# Releasing Coral

Read `README.git.md` first — it covers branch naming, commits and the changelog.

## The flow

```
feat/my-thing ──PR──> dev ──./release──> release/vX.Y.Z ──PR──> main ──tag──> UAT
```

- **Feature branches PR into `dev`.** Every PR adds its own entry to `CHANGELOG.md`
  under `## Unreleased`. CI fails the PR if it does not.
- **`dev` is never versioned.** Builds off dev show the release they descend from
  plus the commit they were built at, e.g. `v8.1.0+dev.ab12cd34`, on the home page.
  That is how you tell dev has moved.
- **A release is cut from `dev`** with `./release`, which bumps the version and PRs
  into `main`.
- **`main` is what is released.** Tagging a commit on main deploys it to UAT.

## Where the version lives

Only in `pyproject.toml`:

```toml
version = "8.1.0"
```

`coral/settings.py` reads it from there, so the displayed version, the Python
package and the release tag can never drift apart. Do not hand-edit it — `./release`
owns that line.

On non-`main` builds, CI writes `coral/BUILD` containing `dev.<short sha>`, and
settings appends it as semver build metadata: `v8.1.0+dev.ab12cd34`. `main` builds
are not stamped, so production shows a clean `v8.1.0`.

## Cutting a release

From a clean, up-to-date `dev`:

```bash
git switch dev && git pull
./release minor          # or major / patch
```

That will:

1. refuse to run unless you are exactly on `origin/dev` with a clean tree
2. bump the chosen part of the version in `pyproject.toml`
3. create `release/vX.Y.Z`
4. move everything under `## Unreleased` into `changelogs/vX.Y.Z.md`, and reset
   `CHANGELOG.md` to empty headings
5. commit `release: vX.Y.Z` and push the branch
6. open the PR into `main`, using the archived changelog as the PR body

Add `--no-pr` to stop after step 5 and open the PR yourself.

### Which part to bump

Follow semver against what is in the release:

- **major** — breaking change, not backwards compatible
- **minor** — new features, backwards compatible
- **patch** — fixes only

## Deploying the release

Tagging is manual and deliberate: the tag is what triggers the UAT deploy
(`.github/workflows/release.yml` fires on `v*.*.*-RELEASE`).

Once the release PR has merged **and the main build is green** — the deploy retags
images built from that main commit, so it will fail if the build has not finished:

```bash
git switch main && git pull
git tag v8.2.0-RELEASE
git push origin v8.2.0-RELEASE
```

## Archived changelogs

`changelogs/` holds one file per release, plus the sprint-named files from the
previous process.
