# Reading arches data in coral

Two ways to read a resource. Picking the wrong one is the difference between a
dashboard page in 8 queries and one in a couple of hundred.

| | `find` / `find_many` | `values_by_resource` |
|---|---|---|
| returns | model instances | `{resource id: ResourceValues}` |
| values | typed (`Reference`, dates, viewmodels) | raw, as the tile stores them |
| traversal | `resource.location_data.addresses.street_value` | none — flat, by alias |
| writes | yes, `save()` | no |
| cost | one tree built per resource | one query for the whole page |

**The dividing line is whether you can name the aliases up front**, not
read-vs-write. `values_by_resource` makes you say what you want, which is what
lets it read exactly those nodegroups in one query. Any surface with a fixed,
known projection — dashboards, list views, an export with defined columns —
fits. Code that must *discover* aliases from the tree (`file_template.py`'s
`get_mapping` walking `resource.items()`, report generation, serialisation)
needs hydration, and no amount of cheapness substitutes.

Hydration is also the answer for writes (tile identity, parent tile, sortorder,
datatype round-tripping), for typed values, and for graph structure.

## `querysets_shim.values`

### `values_by_resource(model_cls, resource_ids, aliases)`

`{resource id: ResourceValues}` — one query, no hydration.

```python
from querysets_shim.values import values_by_resource

fields = values_by_resource(Consultation, page_ids, ['action_status', 'council'])
values = fields.get(consultation_id, EMPTY)

values.get('action_status')   # first tile's value
values.all('response_team')   # every tile's value
```

Every tile is kept, not just the first, so a cardinality-n branch can be checked
across all of them. **Aliases sharing a nodegroup stay positionally aligned** —
index `i` is tile `i` for all of them, including where that tile left the node
empty — so values read at the same index belong to the same tile. Without this,
a tile missing one node would pair (say) a status from one Action tile with
assignees from another.

Aliases that don't exist on the model are ignored rather than raising. A
resource with no matching tile is simply absent from the result; `EMPTY` is
exported so `fields.get(id, EMPTY)` needs no `None` check.

### `related_resource_ids(value)`

The **resource** ids inside a `resource-instance` or `resource-instance-list`
value — not tile ids, which never appear in tile data at all.

```python
ha_ids = related_resource_ids(values.get('related_heritage_assets'))
refs = values_by_resource(Monument, ha_ids, ['hb_number', 'smr_number'])
```

This is the pattern for anything relational: pull the ids, then one call for
what you need off them. Reading `.id` off a hydrated relation is free; reading a
*field* off it hydrates that resource's entire graph.

### `descriptor_names(resource_ids, language=None)`

`{resource id: display name}` from the `descriptors` column, not from tiles.
One query. Use it for a related resource's name instead of hydrating it.

Note descriptors are a cache and can go stale — if the name must be correct
this instant, read the tile.

### `active_language()`

What arches is serving, resolved the same way `StringDataType.get_display_value`
does it: `get_language()`, falling back to `settings.LANGUAGE_CODE`.

## What each datatype gives you

`string` is unwrapped to text in the active language. Everything else is handed
back exactly as the tile stores it.

| datatype | value |
|---|---|
| `string` | `'HB 123'` — stored `{lang: {value, direction}}`; a missing language reads `None`, as in arches |
| `non-localized-string` | `'plain text'` |
| `reference` | `[{uri, list_id, labels: [{value, language_id, list_item_id, valuetype_id, id}]}]` |
| `resource-instance` | `[{resourceId, ontologyProperty, resourceXresourceId, inverseOntologyProperty}]` |
| `resource-instance-list` | same shape — **both are lists** |
| `date` | `'2026-09-20'` — bare ISO string |
| `edtf` | `'2026-09-20'` — bare string |
| `number` | `42` |
| `boolean` | `True` |
| `django-group` | `1560` — bare `auth_group` pk |
| `user` | bare `auth_user` pk |
| `domain-value` | `'Some Option'` — the option id, pre-v8 rows |
| `node-value` | the tileid of the tile it points at |
| `url` | `{url, url_label}` |
| `geojson-feature-collection` | `{type: 'FeatureCollection', features: [...]}` |
| `file-list` | list of file dicts |

Measured against live tiles for `string`, `reference`, `resource-instance(-list)`,
`number`, `django-group` and `geojson`. The rest come from each datatype's own
`transform_value_for_tile`, because the dev database holds no rows for them —
including all 452 `date` nodes.

## Controlled lists: labels and item ids

A `reference` value is deliberately **not** unwrapped, because it carries two
things and each is load-bearing. Unwrapping to either one strands the other and
forces a re-fetch. `coral/utils/reference_values.py` reads both, and every
reader there accepts a raw tile value, so there is nothing to convert first.

```python
from coral.utils.reference_values import (
    reference_label, selected_list_item_ids, has_list_item, single_list_item_id)

reference_label(values.get('action_status'))          # 'Open'   — for display
selected_list_item_ids(values.get('action_status'))   # {'a81eb2e8-…'} — for logic
has_list_item(values.get('action_type'), ASSIGN_HB)   # membership test
```

**Compare on the id, display the label.** Label comparison looks simpler and
keeps biting: the controlled list reads `"Assign To Both HM & HB"` back
HTML-escaped as `HM &amp; HB`, and selection is a *containment* test rather than
equality — a node can hold several selections.

The top-level `uri` and the buried `labels[0].list_item_id` carry the same
information: every one of the 76,272 rows in
`arches_controlled_lists_listitem` satisfies `uri = <base>/<id>`, and no uri is
shared across lists. Prefer `list_item_id` anyway — it needs no assumption about
the base URL, which differs by environment.

`reference_label` prefers the requested language and falls back to the first
label. `values_by_resource` does not do that for strings, because arches itself
returns nothing for a missing language and matching the platform beat internal
symmetry.

## Why this module exists, and when to delete it

`TileTree.get_tiles` in arches-querysets already queries by alias. This adds no
capability — only cost. Measured over five resources reading one node:

| | queries | time |
|---|---|---|
| `values_by_resource` | 2 | 0.006s |
| `TileTree.get_tiles` | 14 | 0.135s |

The gap is scope, not waste: `get_tiles` prefetches the graph, builds datatype
contexts, runs `to_python()` on every value and nests tiles to `depth=20`. It
also takes one nodegroup per call, where this spans nodegroups in one query.

That is the entire justification, so it is also the exit condition. If
arches-querysets gets cheaper, or page sizes stop making the difference matter,
delete this module and call `get_tiles`.

## Limits

- **No parent/child nesting.** `parenttileid` is not read. Values align within a
  nodegroup, but nothing tells you which child tile sits under which parent.
- **No permission filtering.** This reads every nodegroup regardless of the
  user's read permissions. Moot under `with admin():`, a trap outside it.
- **No tile identity.** No tileid, no sortorder — so nothing here can be written
  back. That is hydration's job.
