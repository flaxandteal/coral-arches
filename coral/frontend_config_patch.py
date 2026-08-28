"""Backport of the arches change that adds the project's src to tsconfig paths.

Without it vue-tsc resolves `@/<app>/*` only to the installed package, so it
type-checks upstream's copy of an overridden module while webpack bundles ours.
Mirrors `prioritize_project` in arches' generate_tsconfig_paths; delete once
coral pins an arches release carrying that. See coral/src/README.md.
"""

import logging
import os
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)

TYPES_PATH = os.path.join("..", "node_modules", "@types", "*")


def add_project_overrides(paths):
    """Return paths with the project's own src, and @types, searched first."""
    from arches.app.utils.frontend_configuration_utils.get_base_path import (
        get_base_path,
    )

    app_root_path = os.path.realpath(settings.APP_ROOT)
    root_dir_path = os.path.realpath(settings.ROOT_DIR)

    # Same distinction get_base_path() draws: Arches core run without a project.
    if Path(app_root_path).parent == Path(root_dir_path):
        return paths

    project_src_path = os.path.join(
        "..",
        os.path.relpath(app_root_path, os.path.join(get_base_path(), "..")),
        "src",
    )

    resolved = {}
    for key, locations in paths.items():
        if key == "*":
            # A bare specifier matching a plain-JS package resolves successfully
            # there, so TypeScript never falls back to its @types declarations.
            resolved[key] = (
                locations if TYPES_PATH in locations else [TYPES_PATH, *locations]
            )
            continue
        if not (key.startswith("@/") and key.endswith("/*")):
            resolved[key] = locations
            continue
        project_path = os.path.join(
            project_src_path, key[len("@/") : -len("/*")], "*"
        )
        # Already present when arches carries the fix, or when the namespace is
        # the project's own - it is an arches application too.
        resolved[key] = (
            locations if project_path in locations else [project_path, *locations]
        )
    return resolved


def apply():
    """Wrap generate_tsconfig_paths.

    generate_frontend_configuration imports the function by name, so rebinding
    it on the defining module alone would not reach the caller. Patch both.
    """
    from arches.app.utils.frontend_configuration_utils import (
        generate_frontend_configuration,
        generate_tsconfig_paths,
    )

    original = generate_tsconfig_paths.generate_tsconfig_paths
    if getattr(original, "_coral_patched", False):
        return

    def patched():
        config = original()
        try:
            config["compilerOptions"]["paths"] = add_project_overrides(
                config["compilerOptions"]["paths"]
            )
        except Exception:
            # A broken tsconfig is worse than one that ignores our overrides.
            logger.exception("coral: could not add project src to tsconfig paths")
        return config

    patched._coral_patched = True
    generate_tsconfig_paths.generate_tsconfig_paths = patched
    generate_frontend_configuration.generate_tsconfig_paths = patched
