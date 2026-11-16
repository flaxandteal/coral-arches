"""Read named values off many resources without hydrating any of them.

The shim's other read mode, `find_many`/`find`, returns model instances: typed
values, traversal, lazy relations, `save()`. Use that to edit a resource. Use
this to display a known set of aliases, where that machinery is pure cost —
reaching a related resource through an attribute (`ha.heritage_asset_references`,
`person.name[0].full_name`) hydrates its whole graph to yield one value, and
`find_many(nodes=)` cannot narrow it because the target was never in the id list.

arches-querysets' `TileTree.get_tiles` already queries by alias, so this adds no
capability — only a cost profile. It does more: prefetched graph, datatype
contexts, `to_python()` on every value, nested trees. Measured over five
resources reading one node, it cost 14 queries against 2 here, and takes one
nodegroup per call where these span nodegroups in one query. That is the whole
justification, so it is also the exit condition: if that gap closes, delete this
module and call `get_tiles`.

Two limits, neither obvious. There is no parent/child nesting — `parenttileid` is
not read, so values align within a nodegroup but nothing says which child tile
sits under which parent. And there is no permission filtering — this reads every
nodegroup regardless of the user, which is moot under `admin()` and a trap
outside it.

See README.md for when to reach for this over hydration, and for reading
controlled-list values.

What you get back, by datatype — `string` is unwrapped to text in the active
language, everything else is handed over exactly as the tile stores it:

    string                      'HB 123'
                                stored {lang: {value, direction}}; a missing
                                language reads None, as it does in arches
    non-localized-string        'plain text'
    reference                   [{uri, list_id, labels: [{value, language_id,
                                list_item_id, valuetype_id, id}]}]
                                -> coral.utils.reference_values.reference_label
    resource-instance           [{resourceId, ontologyProperty,
    resource-instance-list       resourceXresourceId, inverseOntologyProperty}]
                                both are lists -> related_resource_ids
    date                        '2026-09-20'  (bare ISO string)
    edtf                        '2026-09-20'  (bare string)
    number                      42
    boolean                     True
    django-group                1560  (bare auth_group pk)
    domain-value                'Some Option'  (the option id, pre-v8 rows)
    node-value                  the tileid of the tile it points at
    url                         {url, url_label}
    geojson-feature-collection  {type: 'FeatureCollection', features: [...]}
    file-list                   list of file dicts
    user                        bare auth_user pk

Measured against live tiles for string, reference, resource-instance(-list),
number, django-group and geojson; the rest come from each datatype's own
transform_value_for_tile, since this database holds no rows for them.
"""


class ResourceValues:
    """One resource's values: `get` reads the first tile, `all` reads every tile."""

    def __init__(self, by_alias):
        self.by_alias = by_alias

    def get(self, alias):
        return next(iter(self.by_alias.get(alias) or []), None)

    def all(self, alias):
        return self.by_alias.get(alias) or []


EMPTY = ResourceValues({})


def values_by_resource(model_cls, resource_ids, aliases):
    """{resource id: ResourceValues} for the given model's aliases.

    Every tile is kept, not just the first, so a cardinality-n branch can be
    checked across all of them. Aliases sharing a nodegroup stay positionally
    aligned — index i is tile i for all of them, including where the tile left
    the node empty — so values read at the same index belong to the same tile.
    """
    from arches.app.models.models import TileModel

    ids = {str(id) for id in resource_ids if id}
    if not ids:
        return {}

    nodes_by_alias = model_cls._._node_objects_by_alias()
    wanted = {alias: nodes_by_alias[alias] for alias in aliases if alias in nodes_by_alias}
    if not wanted:
        return {}

    rows = (
        TileModel.objects.filter(
            nodegroup_id__in={node.nodegroup_id for node in wanted.values()},
            resourceinstance_id__in=ids,
        )
        .order_by('resourceinstance_id', 'sortorder', 'tileid')
        .values_list('resourceinstance_id', 'nodegroup_id', 'data')
    )

    language = active_language()
    fields = {}
    for resource_id, nodegroup_id, data in rows:
        found = fields.setdefault(str(resource_id), {})
        for alias, node in wanted.items():
            if str(node.nodegroup_id) != str(nodegroup_id):
                continue
            value = (data or {}).get(str(node.nodeid))
            found.setdefault(alias, []).append(_value(value, node.datatype, language))
    return {id: ResourceValues(by_alias) for id, by_alias in fields.items()}


def active_language():
    """The language arches is serving, as StringDataType.get_display_value resolves it."""
    from django.conf import settings
    from django.utils.translation import get_language

    return get_language() or settings.LANGUAGE_CODE


def descriptor_names(resource_ids, language=None):
    """{resource id: display name} from the descriptors column, not from tiles."""
    from arches.app.models.models import ResourceInstance

    ids = {str(id) for id in resource_ids if id}
    if not ids:
        return {}
    language = language or active_language()
    rows = ResourceInstance.objects.filter(pk__in=ids).values_list(
        'resourceinstanceid', 'descriptors')
    return {
        str(id): ((descriptors or {}).get(language) or {}).get('name')
        for id, descriptors in rows
    }


def related_resource_ids(value):
    """Resource ids in a resource-instance or resource-instance-list tile value."""
    if isinstance(value, dict):
        value = [value]
    ids = []
    for entry in value or []:
        target = entry.get('resourceId') if isinstance(entry, dict) else entry
        if target and str(target) not in ids:
            ids.append(str(target))
    return ids


def _value(value, datatype, language):
    if datatype != 'string':
        return value
    # Tiles written before the i18n change hold a bare string rather than a
    # language map, and those rows are still in the database.
    if isinstance(value, str):
        return value or None
    # No fallback to another language: arches returns nothing for a missing one.
    return (value or {}).get(language, {}).get('value') or None
