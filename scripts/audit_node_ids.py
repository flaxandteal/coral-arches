"""Find hardcoded Arches node ids in the codebase that no longer exist.

The v8 graph regeneration re-minted node ids as deterministic UUID v5 values.
Nothing enforces referential integrity from a hardcoded id string to nodes.nodeid,
so a stale id is simply a predicate that never matches - valid SQL, zero rows, no
error. This finds them before a user does.

Usage:
    python scripts/audit_node_ids.py [--container coral-db-1] [--db arches]

Compares every UUID in the source tree against the id-bearing tables in a live
database. Reports what is dead, and - where the pre-v8 graph definitions are still
reachable in git - what each dead id used to be.
"""

import argparse
import collections
import json
import re
import subprocess

UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")

# Source only. pkg/ is package data, build/ and uploadedfiles/ are artefacts.
SOURCE_GLOBS = ["*.py", "*.js", "*.json", "*.vue", "*.htm", "*.html"]
EXCLUDE_DIRS = ["node_modules", ".git", "__pycache__", "build", "uploadedfiles", "pkg", "output"]
# Captured runtime state, not source - full of live tile and resource ids.
EXCLUDE_FILES = ["stale_staging_activity.json"]

# Every table that legitimately holds a UUID a developer might hardcode. A UUID
# absent from all of these is not necessarily a node id - see uniqueInstanceName
# in the workflow plugins - but it is definitely not a live database reference.
ID_QUERY = """
SELECT nodeid::text,'node' FROM nodes
UNION ALL SELECT nodegroupid::text,'nodegroup' FROM node_groups
UNION ALL SELECT graphid::text,'graph' FROM graphs
UNION ALL SELECT cardid::text,'card' FROM cards
UNION ALL SELECT id::text,'cxnxw' FROM cards_x_nodes_x_widgets
UNION ALL SELECT widgetid::text,'widget' FROM widgets
UNION ALL SELECT componentid::text,'card_component' FROM card_components
UNION ALL SELECT functionid::text,'function' FROM functions
UNION ALL SELECT pluginid::text,'plugin' FROM plugins
UNION ALL SELECT conceptid::text,'concept' FROM concepts
UNION ALL SELECT valueid::text,'value' FROM values
UNION ALL SELECT id::text,'list' FROM arches_controlled_lists_list
UNION ALL SELECT id::text,'list_item' FROM arches_controlled_lists_listitem
UNION ALL SELECT id::text,'list_item_value' FROM arches_controlled_lists_listitemvalue
UNION ALL SELECT templateid::text,'report_template' FROM report_templates
UNION ALL SELECT searchcomponentid::text,'search_component' FROM search_component
UNION ALL SELECT etlmoduleid::text,'etl_module' FROM etl_modules
UNION ALL SELECT typeid::text,'notification_type' FROM notification_types
UNION ALL SELECT edgeid::text,'edge' FROM edges
UNION ALL SELECT publicationid::text,'published_graph' FROM published_graphs
UNION ALL SELECT resourceinstanceid::text,'resource' FROM resource_instances
UNION ALL SELECT opt->>'id','domain_option' FROM nodes, jsonb_array_elements(config->'options') opt
    WHERE jsonb_typeof(config->'options')='array'
"""

# tiles are deliberately omitted - 3.7M rows, and a hardcoded tile id is a bug
# in its own right rather than something this audit needs to resolve.


def psql(container, db, sql):
    out = subprocess.run(
        ["docker", "exec", container, "psql", "-U", "postgres", "-d", db, "-tAF\t", "-c", sql],
        capture_output=True, text=True, check=True,
    ).stdout
    return [l.split("\t") for l in out.splitlines() if l.strip()]


def live_ids(container, db):
    return {row[0] for row in psql(container, db, ID_QUERY) if row[0]}


def source_uuids(paths):
    """Return {uuid: [(file, line), ...]} for every UUID in the source tree."""
    cmd = ["grep", "-rInoE", UUID.pattern]
    for g in SOURCE_GLOBS:
        cmd.append(f"--include={g}")
    for d in EXCLUDE_DIRS:
        cmd.append(f"--exclude-dir={d}")
    cmd += paths
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    found = collections.defaultdict(list)
    for line in out.splitlines():
        uuid = line[-36:]
        path, _, lineno = line[:-37].rpartition(":")
        if any(path.endswith(name) for name in EXCLUDE_FILES):
            continue
        found[uuid].append((path, lineno))
    return found


def old_identities(ref):
    """Map pre-v8 node id -> its graph and name, read straight out of git."""
    try:
        files = subprocess.run(
            ["git", "ls-tree", "-r", "--name-only", ref],
            capture_output=True, text=True, check=True,
        ).stdout.splitlines()
    except subprocess.CalledProcessError:
        return {}

    identities = {}
    for path in files:
        if not (path.startswith("coral/pkg/graphs/") and path.endswith(".json")):
            continue
        try:
            raw = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True, check=True).stdout
            data = json.loads(raw)
        except Exception:
            continue
        for graph in data.get("graph", []):
            name = graph.get("name")
            gname = name.get("en") if isinstance(name, dict) else name
            for node in graph.get("nodes", []):
                nname = node.get("name")
                identities[node["nodeid"]] = {
                    "graph": gname,
                    "name": nname.get("en") if isinstance(nname, dict) else nname,
                    "alias": node.get("alias"),
                    "datatype": node.get("datatype"),
                }
    return identities


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--container", default="coral-db-1")
    ap.add_argument("--db", default="arches")
    ap.add_argument("--paths", nargs="*", default=["coral", "tests"])
    ap.add_argument("--pre-v8-ref", default="97306adb4e2403cbacaf25572b8cb0b0eaa3f717",
                    help="a commit from before the v8 graph regeneration")
    args = ap.parse_args()

    live = live_ids(args.container, args.db)
    found = source_uuids(args.paths)
    dead = {u: places for u, places in found.items() if u not in live}
    was = old_identities(args.pre_v8_ref)

    print(f"{len(found)} distinct UUIDs in source, {len(dead)} not present in the database\n")
    for uuid, places in sorted(dead.items(), key=lambda kv: -len(kv[1])):
        prior = was.get(uuid)
        if prior:
            print(f"{uuid}  WAS {prior['graph']} / {prior['name']} [{prior['datatype']}]")
        else:
            print(f"{uuid}  (not a pre-v8 node id - may be a workflow instance name, not a node)")
        for path, lineno in places[:6]:
            print(f"    {path}:{lineno}")
        if len(places) > 6:
            print(f"    ... and {len(places) - 6} more")


if __name__ == "__main__":
    main()
