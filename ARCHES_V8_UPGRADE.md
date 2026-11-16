# Coral — Arches v7 → v8 Upgrade Overview

Branch: `feat/coral-arches-v8-upgrade`

Bumps Coral from Arches **7.16.x** to **Arches 8.1.x** and Django 4.x → **Django 5.2**. This is a WIP port — the changes below summarise the major moving parts.

## 1. Python / packaging

- **`pyproject.toml`** (new) — replaces hand-rolled `requirements.txt` as the source of truth. Declares:
  - `arches>=8.1.0,<8.2.0`
  - `arches_controlled_lists` (dev/1.1.x)
  - `python>=3.11`, Django 5.2 classifiers
  - app version bumped to `8.0.0`
  - `alizarin` (replaces `arches-orm`)
  - Adds `django-hosts`, `django-pgtrigger`, `django-recaptcha` (replaces `django-simple-captcha`), updated `django-storages`, `django-csp>=4.0`.
- **`requirements.txt`** trimmed to only what can't live in `pyproject.toml` (just `alizarin`).
- **`coral/apps.py`** (new) — declares `CoralConfig` with `is_arches_application = True` so Coral registers as an Arches application under the v8 application model.

## 2. ORM replacement: `arches-orm` → `alizarin`

The biggest single change. The old `arches_orm` package (and its `arches_django` adapter) is replaced by a vendored `alizarin_django/` package, which is now the in-tree Django adapter for the new `alizarin` ORM. Everything that previously imported `arches_orm` now imports `alizarin_django`:

- Datatypes: `django_group`, `user`
- View models: `Person`, `Organization`, `Set`, `LogicalSet`, `Group`, `ArchesPlugin`, `ResourceInstanceViewModel`, etc.
- Middleware: `ArchesORMContextMiddleware` → `AlizarinDjangoContextMiddleware`
- `INSTALLED_APPS`: `arches_orm.arches_django.apps.ArchesORMConfig` → `alizarin_django.apps.AlizarinDjangoConfig`
- GraphQL ASGI app removed; `asgi.py` now uses plain `get_asgi_application()`.

All function and view modules under `coral/functions/`, `coral/views/`, `coral/management/`, `coral/utils/casbin.py`, etc. were updated to the new import paths.

## 3. Settings (`coral/settings.py`)

- `APP_VERSION` 7.16.53 → 8.1.0.
- Switches to v8's settings helpers (`build_staticfiles_dirs`, `build_templates_config`, `transmit_webpack_django_config`) with local fallbacks for environments missing them.
- New webpack stats path: `<root>/webpack/webpack-stats.json` (was `coral/webpack/…`).
- Adds `django_hosts` middleware (`HostsRequestMiddleware` / `HostsResponseMiddleware`) plus `ROOT_HOSTCONF = 'coral.hosts'` / `DEFAULT_HOST = 'coral'`.
- `INSTALLED_APPS`:
  - Adds: `django_hosts`, `arches_controlled_lists`, `arches_querysets`, `arches_component_lab`, `django_migrate_sql`, `pgtrigger`, `alizarin_django.apps.AlizarinDjangoConfig`.
  - Replaces `captcha` → `django_recaptcha`.
  - Appends `arches.app` and `django.contrib.admin` last so app templates take precedence over core arches templates.
- Adds `REFERENCES_INDEX_NAME` + `ELASTICSEARCH_CUSTOM_INDEXES` entry for `arches_controlled_lists` reference index.
- Adds the new `reference` term-search type and `ES_MAPPING_MODIFIER_CLASSES` (`ReferencesEsMappingModifier`).
- Postgres `cursor_tuple_fraction=1` set on the default connection.
- Drops `MIN_ARCHES_VERSION` / `MAX_ARCHES_VERSION` pinning.

## 4. URLs / hosts

- **`coral/hosts.py`** (new) — single `coral` host pattern for `django_hosts`.
- **`coral/urls.py`**:
  - Mounts `arches_controlled_lists.urls` and `arches_component_lab.urls`.
  - `debug_toolbar` URLs gated on it actually being installed.
  - Registers v8 `handler400/403/404/500` from `arches.app.views.main`.

## 5. Permissions (Casbin)

`coral/permissions/casbin.py` ported to the v8 permission base:

- Inherits from `ArchesPermissionBase` (was `ArchesStandardPermissionFramework`).
- Pulls helpers from `arches.app.permissions.arches_permission_base` and `arches.app.utils.permission_backend`.
- Adds `is_exclusive = False` flag matching `ArchesDefaultAllowPermissionFramework`.
- `get_restricted_users(resource, *, all_users=None)` accepts the new v8 kwarg.
- Tolerant import of `UnindexedError` (fallback stub if not present).

Two reference files added to ease porting / diffing against upstream:

- `coral/permissions/_v8_default_allow_reference.py`
- `coral/permissions/_v8_permission_base_reference.py`

## 6. Frontend tooling

A wholesale move from the legacy in-project webpack to the v8 root-level build pipeline.

- **`coral/webpack/` → `webpack/`** at the repo root. New `webpack/webpack-utils/build-filepath-lookup.js` consolidates the per-asset lookup builders (css/js/img/template/vue) that used to live as separate files.
- **`package.json`** (new, root) — replaces `coral/package.json`. Pulls `arches` and `arches_controlled_lists` directly from `archesproject/*#dev/8.1.x` and `arches-dev-dependencies` for tooling. Adds `vitest`, `vue-tsc`, prettier/eslint scripts, `build_development` / `build_production` / `build_test` entry points.
- **`eslint.config.mjs`** (new, flat config) + **`.prettierrc`** — replaces `coral/.eslintrc.js` / `coral/.eslintignore`.
- **`tsconfig.json`** (new) — extends `frontend_configuration/tsconfig-paths.json`, strict TS, Vue JSX.
- **`vitest.config.mts`** / **`vitest.setup.mts`** — new test runner.
- **`gettext.config.js`** + **`nodemon.json`** — supporting tooling.
- `.babelrc`, `.browserslistrc`, `.stylelintrc.json` lifted from `coral/` to the repo root.
- `coral/templates/index.htm` no longer loads `requirejs/require.js` (RequireJS is gone in v8).
- `coral/templates/base-manager.htm` switches the brand image to `{% webpack_static %}`.

## 7. JavaScript reformat (largely cosmetic)

The bulk of the diff in `coral/media/js/**` is whitespace/formatting churn from running the new Prettier + ESLint configs across the tree. Most files are reformatted only; functional changes are concentrated in a handful of viewmodels and the workflow components.

## 8. Workflow builder + workflow plugins

Staged on top of the main upgrade commit:

- **`workflow-component-abstract.js`** — `hiddenNodes` is now applied via a helper that re-fires whenever the `card.widgets` observable mutates. v8's throttled `nodes` subscription pushes widgets in after the initial hide pass, so a one-shot hide left fields visible. The same pattern is applied in **`workflow-builder-initial-step.js`**, which also now reads `hiddenNodes` either from `params.hiddenNodes` or from the v8 component config (`params.form.componentData.parameters.hiddenNodes`).
- **Workflow plugin JSONs** (10 files: agriculture-and-forestry, assign-consultation, curatorial, daera, evaluation-meeting, fmw-inspection, hb-planning-consultation-response, hm-planning-consultation-response, scheduled-monument-consent) — formatting normalisation plus expanded `hiddenNodes` arrays so the v8 widget rendering doesn't expose extra nodegroup fields. `daera-workflow.json` is the largest functional reshuffle.

## 9. Docker / Makefile

- `ARCHES_BASE` image: `coral-7.6` → `docker-8.1.0-release`.
- `arches-project create` → v8's `arches-admin startproject`.
- Yarn entrypoints replaced with npm equivalents (`install_npm_components`, `run_npm_build_development`).
- `docker` submodule pointer updated.

## 10. Misc

- `coral/wsgi.py` — `resource_indexed` signal wired tolerantly (falls back to no-op if the signal doesn't exist in the installed arches version).
- `coral/permissions/casbin.py` — additional ES DSL builders imported (`Bool`, `Terms`, `Nested`) for the v8 search paths.
- Resource model / branch JSONs under `coral/pkg/graphs/**` — bulk whitespace/format normalisation (4-line diffs per file), with a few materially-different files: `Consultation.json`, `Licence.json`, `Heritage Asset.json`, `Heritage Asset Revision.json`, `Risk Assessment.json`, `Activity.json`, and the `Correspondence`/`Council`/`CM References`/`Crime References`/`Planning References` branches.

## Outstanding / WIP

The commit message is explicit: `feat(wip): upgraded coral to v8 arches`. The upgrade is functional enough to start exercising but is not yet a clean release — expect follow-up work on the casbin port (the `_v8_*_reference.py` files are deliberate scaffolding), workflow regression-testing across the 10 plugin JSONs, and verifying the new permission framework against existing user groups.
