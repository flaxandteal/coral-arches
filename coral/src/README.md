# `coral/src` — frontend overrides

Files here **shadow** the Vue/TS modules of Arches core and of the installed
arches applications (`arches_search`, `arches_modular_reports`, …).

Nothing needs registering. `webpack/webpack.common.js` resolves the `@` alias
against an ordered list of roots and takes the first hit:

```js
'@': [
    Path.resolve(__dirname, APP_ROOT, 'src'),          // coral/src   <- FIRST
    ...archesApplicationsVuePaths,                      // arches_search/src, …
    Path.resolve(__dirname, ROOT_DIR, 'app', 'src')     // arches core app/src
],
```

So `coral/src/arches_search/SimpleSearch/api.ts` wins over the installed
`arches_search/src/arches_search/SimpleSearch/api.ts` for every
`@/arches_search/SimpleSearch/api.ts` import in the bundle — including imports
made from _inside_ arches_search itself. `ts-loader` already includes
`APP_ROOT/src`, so no build config changes either.

**To remove any override: delete the file and rebuild.** There is no settings
flag, migration, monkeypatch or webpack entry to unwind.

## House rules

-   **Copy the upstream file verbatim**, then edit. Mark every edited region with
    a `>>> BEGIN CORAL OVERRIDE … <<<` / `>>> END CORAL OVERRIDE … <<<` banner —
    in a 250-line copy the change is otherwise invisible.
-   **Record the upstream version** in the file header. That is what makes the
    next upgrade a `diff` rather than an archaeology exercise.
-   **Say why in the file**, not just what. An override with no rationale gets
    carried forward forever because nobody dares delete it.
-   **Add a row to the table below**, including how you know it can go.
-   These are stopgaps. Each one should have an upstream issue or PR behind it.

## On upgrade of an overridden package

For each row: diff the new upstream file against the `Upstream version` this
copy was taken from.

-   Upstream fixed it → delete our file, drop the row.
-   Upstream unchanged in that region → bump the recorded version, move on.
-   Upstream changed elsewhere → re-copy the new file and re-apply only the
    banner-marked region.

## Active overrides

| File                                                                           | Upstream version         | What we changed                                                                                                    | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Remove when                                                    |
| ------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `arches_search/SimpleSearch/components/attribute-filters/AttributeFilters.vue` | arches-search `0.1.0a13` | 1. `:lazy="true"` on the `<Accordion>` 2. `v-model:value` against a local ref, replacing the literal `:value="[]"` | **(1) is the root cause of the slow panel.** `:value="[]"` collapses every panel, but PrimeVue's `lazy` defaults to false — its docs describe that as _"hides tabs with css"_, i.e. content is still created and merely `v-show`'d. Every `ReferenceFilter` mounted on open and ran its `immediate: true` watcher for panels nobody opened. Heritage Asset has **209** reference filter nodes; a few resource types selected meant 1053 requests and thousands of hidden `Checkbox` components. **(2)** PrimeVue re-seeds its internal `d_value` whenever the `value` prop changes identity, and an inline `[]` is a new array every render — so selecting a checkbox (which replaces `filterValues` upstream) snapped every panel shut | arches_search sets `lazy` and owns the expanded state upstream |
| `arches_search/SimpleSearch/api.ts`                                            | arches-search `0.1.0a13` | `fetchControlledListItems` dedupes concurrent requests per list id via an in-flight promise `Map`                  | Complements the above rather than duplicating it: `lazy` unmounts a panel on collapse, so re-expanding a facet refetches. The cache makes repeat expansion free. On its own it fixed the request count but left every component mounted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | arches_search dedupes upstream                                 |

## How TypeScript knows about these

Webpack has always resolved `@` against an ordered list of roots with the
project's src first — that is what makes an override take effect, and it needed
nothing from us. TypeScript is a separate resolver and did **not** know:
`frontend_configuration/tsconfig-paths.json` mapped each `@/<app>/*` to the
installed package only, so `vue-tsc` type-checked upstream's copy while webpack
bundled ours, and **nothing was ever checked against the override**.

The fix lives in Arches, in `generate_tsconfig_paths`: each `@/<app>/*` gets the
project's src first (keeping the installed location as a fallback, so only files
the project has actually overridden resolve differently), and `"*"` gets
`../node_modules/@types/*` first — without that, a bare specifier matching a
plain-JS package resolves successfully there and TypeScript never falls back to
the declarations shipped alongside it.

`coral/frontend_config_patch.py` backports the same logic, applied at import
time from `coral/apps.py`. It is idempotent: where Arches already carries the
fix it finds the paths in place and leaves them alone, so both can be active.

**Deleting the backport** is safe once coral pins an Arches release carrying the
change. Not before: `pyproject.toml` pins `arches==8.2.0a8` from PyPI while the
Dockerfile installs the local fork, so a non-fork install without the backport
fails `ts:check` on `js-cookie` — a broken build, not just a weaker check.

It has to be a patch rather than a config edit, for two reasons — both tested:

-   `frontend_configuration/` is gitignored and rewritten by
    `generate_frontend_configuration()` on **every Django startup**.
-   A child `paths` in `tsconfig.json` _replaces_ the parent's wholesale rather
    than merging. Adding one entry there drops every generated mapping.

To check it is working, break an override's exported signature and run
`npm run ts:check` — a _consumer inside the installed package_ should fail. If
instead everything passes, TypeScript is still resolving upstream's copy.

## Verifying an override actually took effect

Webpack picks the override silently — there is no log line. To confirm:

```bash
npm run build_development
```

Then open the search filter panel with devtools' Network tab: on first open
there should be **no** `/api/controlled_list/` requests at all, and exactly one
per distinct list as you expand facets. Selecting a checkbox should leave the
panel open.

`npm run ts:check` and `npm run eslint:check` both cover `coral/src`, so a
broken override fails the build rather than shipping.
