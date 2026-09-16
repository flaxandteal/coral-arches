"""Seed dummy Arches resource instances from built graphs (standalone, Alizarin).

Reads graphs + reference collections from a built package dir via
``alizarin.import_prebuild`` (so concept/reference values are *real*, resolved
against the same RDM cache the graphs were built with), generates N dummy
resource instances per selected graph, and writes an Arches business-data JSON
file ready to feed to ``manage.py packages -o import_business_data`` (or the
package importer).

Usage:
    python seed.py --graphs "Condition Report,Place" -n 5 -o seeded.json
    python seed.py --graphs all -n 3
    python seed.py --list                      # list graph names and exit

    # what CI runs — see cypress/seed/README.md
    python seed.py --graphs "Heritage Asset" -n 6 \
        --overrides cypress/seed/coral_e2e_overrides.json -o seeded.json

Generated values are generic ("Sample <alias> 1"), which is fine for volume but
not for assertions: the Cypress specs pick options by literal text ("Testing",
"HA/02"). Use --overrides to pin those per instance — see
coral_e2e_overrides.json and the note above it.

Value coverage: string, non-localized-string, date, number, boolean, url,
reference/concept (real labels from the collection), domain-value, and a point
geojson. resource-instance and file-list nodes are left empty (a standalone
seeder has no target resources/files to point at) — see gen_value().
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import alizarin
import alizarin_clm  # noqa: F401  registers the `reference` datatype handler
import alizarin_filelist  # noqa: F401  registers the `file-list` datatype handler

SCRIPT_DIR = Path(__file__).parent
BASE_URI = "https://qhr.detsi.qld.gov.au/"

DUMMY_DATES = ["2023-06-15", "2024-01-20", "2022-11-03", "2021-09-30", "2025-03-12"]


def _localized(text: str) -> dict:
    return {"en": {"value": text, "direction": "ltr"}}


def _reference_value(node: dict, cache, i: int):
    """A real label (or list of labels) from the node's controlled list.

    We pass the *label*, not the value-id: Alizarin's RDM label resolution then
    expands it to a full reference tile (labels/list_id/uri). Passing the id
    leaves an unresolved __needs_rdm_lookup placeholder.
    """
    cfg = node.get("config") or {}
    cid = cfg.get("controlledList") or cfg.get("rdmCollection")
    if not cid:
        return None
    col = cache.get_collection(cid)
    if not col:
        return None
    vids = col.get_value_ids()
    if not vids:
        return None
    label = col.get_value_by_id(vids[i % len(vids)])["value"]
    return [label] if cfg.get("multiValue") else label


def _domain_value(node: dict, i: int):
    opts = (node.get("config") or {}).get("options") or []
    if not opts:
        return None
    return opts[i % len(opts)]["id"]


def _geojson(i: int) -> dict:
    # Spread points around Queensland so seeded resources aren't all stacked.
    lon, lat = 153.0 + (i % 10) * 0.05, -27.4 - (i % 10) * 0.05
    return {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {},
        }],
    }


def gen_value(node: dict, alias: str, cache, i: int, skip: frozenset = frozenset()):
    """Dummy value for a leaf node, or None to leave it empty."""
    dt = node["datatype"]
    if dt in skip:
        return None
    pretty = alias.replace("_", " ")
    if dt == "string":
        return _localized(f"Sample {pretty} {i + 1}")
    if dt == "non-localized-string":
        return f"Sample {pretty} {i + 1}"
    if dt == "date":
        return DUMMY_DATES[i % len(DUMMY_DATES)]
    if dt == "number":
        return (i + 1) * 7
    if dt == "boolean":
        return i % 2 == 0
    if dt == "url":
        return {"url": f"https://example.org/{alias}/{i + 1}", "url_label": f"Link {i + 1}"}
    if dt in ("reference", "concept", "concept-list"):
        return _reference_value(node, cache, i)
    if dt in ("domain-value", "domain-value-list"):
        return _domain_value(node, i)
    if dt == "geojson-feature-collection":
        return _geojson(i)
    # resource-instance(-list), file-list, node-value, annotation, etc.:
    # ponytail: left empty — no target resources/files exist in a standalone
    # run. Wire resource-instance links in a second pass if the DB has data.
    return None


def build_tree(schema: dict, nodes_by_alias: dict, cache, i: int,
               skip: frozenset = frozenset(), only: frozenset = frozenset()) -> dict:
    """Turn a get_graph_schema() tree into a value tree for json_tree_to_tiles."""
    tree: dict = {}
    for alias, meta in schema.items():
        if not isinstance(meta, dict):
            continue
        children = meta.get("children")
        # Recurse only for pure collectors (semantic nodes). A *value* node that
        # also has children is the arches-her "metatype" pattern (e.g. a
        # reference node with an auto-derived broader-concept child): we set its
        # own value and leave the optional metatype child unset — setting the
        # value alone yields a valid tile.
        if meta.get("datatype") == "semantic":
            child = build_tree(children or {}, nodes_by_alias, cache, i, skip, only)
            if child:
                tree[alias] = child
            continue
        node = nodes_by_alias.get(alias)
        if not node:
            continue
        if only and alias not in only:
            continue
        val = gen_value(node, alias, cache, i, skip)
        if val is not None:
            tree[alias] = val
    return tree


# gen_value() deliberately produces generic filler. The E2E specs, though, pick
# dropdown options by literal text, so a handful of nodes have to carry exact
# values. An overrides file maps graph name -> list of {alias: value}, applied
# by instance index (entry 0 to the first instance, and so on); instances past
# the end of the list keep their generated values.
#
# A value of null REMOVES the alias, which matters as much as setting one:
# coral's display name is "{smr_number} {site_name}" when any reference number
# is present and "{ha_number} {site_name}" only when none is, so leaving the
# generated "Sample smr number 1" in place would hide the HA number the
# 02_flag_for_enforcement spec searches for.
#
# "{n}" in a string is substituted with the 1-based instance number, so
# "HA/{n:02d}" gives HA/01, HA/02, ...

def load_overrides(path: str | None) -> dict:
    if not path:
        return {}
    data = json.loads(Path(path).read_text())
    if not isinstance(data, dict):
        raise SystemExit(f"{path}: expected an object mapping graph name -> list of overrides")
    return data


def _coerce_override(node: dict, raw, i: int):
    """Shape a raw override to the node's datatype (mirrors gen_value)."""
    dt = node["datatype"]
    if isinstance(raw, str):
        raw = raw.format(n=i + 1)
    if dt == "string":
        return _localized(raw)
    if dt == "url" and isinstance(raw, str):
        return {"url": raw, "url_label": raw}
    return raw


def _set_alias(tree: dict, alias: str, value, remove: bool) -> bool:
    """Set (or delete) `alias` wherever it appears in the nested value tree."""
    found = False
    for key, val in list(tree.items()):
        if key == alias:
            if remove:
                del tree[key]
            else:
                tree[key] = value
            found = True
        elif isinstance(val, dict) and not ({"en", "url", "type"} & set(val)):
            if _set_alias(val, alias, value, remove):
                found = True
    return found


def apply_overrides(tree: dict, nodes_by_alias: dict, entries: list, i: int, graph: str) -> None:
    if not entries or i >= len(entries):
        return
    for alias, raw in (entries[i] or {}).items():
        node = nodes_by_alias.get(alias)
        if node is None:
            print(f"  WARNING: override alias {alias!r} is not on graph {graph!r}",
                  file=sys.stderr)
            continue
        remove = raw is None
        value = None if remove else _coerce_override(node, raw, i)
        if not _set_alias(tree, alias, value, remove) and not remove:
            print(f"  WARNING: alias {alias!r} was not generated for {graph!r}; "
                  "override not applied", file=sys.stderr)


# json_tree_to_tiles copies the descriptor *template* through verbatim
# (e.g. "<primary_reference_number> <monument_name> <version>") and never
# substitutes node values — and the custom multicard descriptor function isn't
# run by Alizarin's recompute. So we render it ourselves from the value tree.

_TOKEN = re.compile(r"<([^<>|]+)(?:\|[^<>]*)?>")  # <alias> or <alias|modifier>


def _render_text(val) -> str:
    if val is None:
        return ""
    if isinstance(val, dict):
        if "en" in val:                       # localized string
            return val["en"].get("value", "")
        if "url" in val:                      # url datatype
            return val.get("url", "")
        return ""                             # geojson etc. — not name material
    if isinstance(val, list):                 # multi-value reference (list of labels)
        return ", ".join(_render_text(v) for v in val)
    if isinstance(val, bool):
        return "Yes" if val else "No"
    return str(val)


def flatten_tree(tree: dict, flat: dict | None = None) -> dict:
    """alias -> leaf value, descending through semantic/nodegroup dicts."""
    flat = {} if flat is None else flat
    for k, v in tree.items():
        if isinstance(v, dict) and not ({"en", "url", "type"} & set(v)):
            flatten_tree(v, flat)             # nested nodegroup
        else:
            flat[k] = v
    return flat


def render_descriptors(resource: dict, tree: dict, fallback: str) -> None:
    """Substitute <alias> tokens in the resource's name/description/map_popup."""
    flat = flatten_tree(tree)
    desc = resource["resourceinstance"].get("descriptors") or {}
    for key in ("name", "description", "map_popup"):
        tmpl = desc.get(key)
        if not isinstance(tmpl, str):
            continue
        rendered = _TOKEN.sub(lambda m: _render_text(flat.get(m.group(1))), tmpl)
        rendered = re.sub(r"\s+", " ", rendered).strip(" ,;-")
        desc[key] = rendered or fallback
    resource["resourceinstance"]["name"] = desc.get("name", fallback)


def graph_meta(graph_json_str: str) -> tuple[str, bool]:
    """(display name, is_resource_model) for a registered graph."""
    raw = json.loads(graph_json_str)
    g = raw["graph"][0] if isinstance(raw, dict) and "graph" in raw else (
        raw[0] if isinstance(raw, list) else raw)
    nm = g.get("name")
    name = nm.get("en") if isinstance(nm, dict) else (nm or "")
    return name, bool(g.get("isresource"))


def load_graph(gid: str):
    raw = json.loads(alizarin.get_graph_json(gid))
    g = raw["graph"][0] if isinstance(raw, dict) and "graph" in raw else (
        raw[0] if isinstance(raw, list) else raw)
    nodes_by_alias = {n["alias"]: n for n in g["nodes"] if n.get("alias")}
    return g, nodes_by_alias


def seed_graph(gid: str, name: str, count: int, cache, overrides: list | None = None,
               skip: frozenset = frozenset(), only: frozenset = frozenset()) -> list:
    schema = alizarin.get_graph_schema(gid)
    _, nodes_by_alias = load_graph(gid)
    resources = []
    for i in range(count):
        tree = build_tree(schema, nodes_by_alias, cache, i, skip, only)
        apply_overrides(tree, nodes_by_alias, overrides or [], i, name)
        rid = alizarin.generate_uuid_v5(BASE_URI, f"seed:{gid}:{i}")
        out = alizarin.json_tree_to_tiles(json.dumps(tree), rid, gid, False, False)
        for res in out["business_data"]["resources"]:
            render_descriptors(res, tree, f"{name} {i + 1}")
            resources.append(res)
    return resources


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pkg-dir", default=str(SCRIPT_DIR / "output"),
                    help="Built package dir to load graphs+collections from (default: ./output)")
    ap.add_argument("--graphs", default="all",
                    help="Comma-separated graph names, or 'all' (default)")
    ap.add_argument("-n", "--count", type=int, default=5,
                    help="Dummy instances per graph (default 5)")
    ap.add_argument("-o", "--output", default="seeded_business_data.json",
                    help="Output business-data JSON path")
    ap.add_argument("--include-branches", action="store_true",
                    help="With --graphs all, also seed branch graphs (default: resource models only)")
    ap.add_argument("--only-aliases", default="",
                    help="Comma-separated aliases to populate; everything else is left "
                         "empty. Narrowing the output keeps unrelated coral post-save "
                         "functions from firing on synthetic data they were not written "
                         "to handle (see cypress/seed/README.md).")
    ap.add_argument("--skip-datatypes", default="",
                    help="Comma-separated datatypes to leave empty. The concept family "
                         "(concept,concept-list,reference,domain-value,domain-value-list) "
                         "generates value ids that need matching RDM rows in the target "
                         "database; without them indexing dies with 'Value has no concept'.")
    ap.add_argument("--overrides", default=None,
                    help="JSON file of per-instance value overrides "
                         "(graph name -> list of {alias: value}); null removes an alias")
    ap.add_argument("--rdm-namespace", default=BASE_URI,
                    help=f"RDM namespace the graphs were built under (default: {BASE_URI})")
    ap.add_argument("--list", action="store_true", help="List resource-model graph names and exit")
    args = ap.parse_args()

    overrides = load_overrides(args.overrides)
    skip = frozenset(d.strip() for d in args.skip_datatypes.split(",") if d.strip())
    only = frozenset(a.strip() for a in args.only_aliases.split(",") if a.strip())

    alizarin.set_rdm_namespace(args.rdm_namespace)
    alizarin.import_prebuild(args.pkg_dir, args.rdm_namespace)
    cache = alizarin.get_global_rdm_cache()

    gids = alizarin.get_registered_graph_ids()
    # gid -> (name, is_resource_model)
    named = {gid: graph_meta(alizarin.get_graph_json(gid)) for gid in gids}

    if args.list:
        for nm in sorted(n for n, isres in named.values() if n and isres):
            print(nm)
        return 0

    if args.graphs.strip().lower() == "all":
        selected = [(gid, nm) for gid, (nm, isres) in named.items()
                    if nm and (isres or args.include_branches)]
    else:
        wanted = {s.strip().lower() for s in args.graphs.split(",") if s.strip()}
        selected = [(gid, nm) for gid, (nm, _isres) in named.items() if nm.lower() in wanted]
        found = {nm.lower() for _, nm in selected}
        for miss in wanted - found:
            print(f"WARNING: no graph named {miss!r}", file=sys.stderr)

    if not selected:
        print("No graphs selected.", file=sys.stderr)
        return 1

    all_resources = []
    for gid, nm in selected:
        try:
            res = seed_graph(gid, nm, args.count, cache, overrides.get(nm), skip, only)
            all_resources.extend(res)
            print(f"  seeded {len(res):>4} resources  {nm}")
        except Exception as e:  # keep going; one bad graph shouldn't kill the run
            print(f"  SKIP {nm}: {type(e).__name__}: {e}", file=sys.stderr)

    Path(args.output).write_text(
        json.dumps({"business_data": {"resources": all_resources}}, indent=2))
    print(f"\nWrote {len(all_resources)} resources across {len(selected)} graph(s) "
          f"-> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
