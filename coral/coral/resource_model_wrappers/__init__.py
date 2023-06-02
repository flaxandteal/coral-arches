import logging
import json
from django.db import transaction, connection
import uuid
from datetime import datetime, date, time
import time as time_mod
from edtf import parse_edtf
import collections
from arches.app.utils.betterJSONSerializer import JSONSerializer
from functools import cached_property, lru_cache
from arches.app.search.components.base import SearchFilterFactory
from arches.app.search.search_engine_factory import SearchEngineFactory
from arches.app.views.search import get_resource_model_label, RESOURCES_INDEX
from arches.app.models.concept import get_preflabel_from_conceptid
from arches.app.search.elasticsearch_dsl_builder import Bool, Match, Query, Nested, Terms, MaxAgg, Aggregation
from tabulate import tabulate
from dataclasses import dataclass
from typing import Any, Callable
from django.dispatch import Signal
from django.db.models.signals import post_init, post_delete, pre_save, post_save
from django.dispatch import receiver
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.models import ResourceXResource, TileModel, Node
from arches.app.models.concept import get_preflabel_from_valueid
from arches.app.models.tile import Tile as TileProxyModel
from coral import settings
from arches.app.models.system_settings import settings as system_settings
from arches.app.datatypes.datatypes import EDTFDataType, GeojsonFeatureCollectionDataType
from ._bulk_create import BulkImportWKRM
#from arches.app.models import TileModel

STAGING_TEST = False
COUNT = 0


class RelationList(collections.UserList):
    def __init__(self, related_to, key, nodeid, tileid, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.related_to = related_to
        self.key = key
        self.nodeid = nodeid
        self.tileid = tileid

    def append(self, item):
        datum = {}
        datum["wkriFrom"] = self.related_to
        datum["wkriFromKey"] = self.key
        datum["wkriFromNodeid"] = self.nodeid
        datum["wkriFromTileid"] = self.tileid
        item._cross_record = datum
        super().append(item)
        return item

logger = logging.getLogger(__name__)

class WKRM:
    model_name: str
    graphid: str
    nodes: dict
    to_string: Callable

    @property
    def model_class_name(self):
        return self.model_name.replace(" ", "")

    def __init__(self, model_name, graphid, __str__=None, **kwargs):
        self.model_name = model_name
        self.graphid = graphid
        self.to_string = __str__ or repr
        self.nodes = kwargs

_WELL_KNOWN_RESOURCE_MODELS = [
    WKRM(**model) for model in settings.WELL_KNOWN_RESOURCE_MODELS
]

class ResourceModelWrapper:
    name: str
    graphid: str
    id: str
    _nodes: dict = {}
    _values: dict = None
    _cross_record: dict = None
    _lazy: bool = False
    _filled: bool = False
    __datatype_factory = None
    __node_datatypes = None
    resource: Resource

    def __getitem__(self, key):
        return self.__getitem__(key)

    def __setitem__(self, key, value):
        return self.__setitem__(key, value)

    def __setattr__(self, key, value):
        key, value = self._set_value(key, value)
        if key in ("_values", "_lazy", "_filled", "resource", "_cross_record"):
            super().__setattr__(key, value)
        else:
            if self._lazy and not self._filled:
                self.fill_from_resource()
            self._values[key] = value

    def __getattr__(self, key):
        if key in self._values:
            return self._values[key]
        elif key in self._nodes:
            if self._lazy and not self._filled:
                self.fill_from_resource()
                return self.__getattr__(key)
            return None
        raise AttributeError(f"No well-known attribute {key}")

    def delete(self):
        return self.resource.delete()

    def remove(self):
        if not self._cross_record:
            raise NotImplementedError("This method is only implemented for relations")

        wkfm = self._cross_record["wkriFrom"]
        key = self._cross_record["wkriFromKey"]
        wkfm.save()
        resource = wkfm.to_resource()
        tile = resource.tiles
        nodeid = wkfm._nodes[key]["nodeid"]
        nodegroupid = wkfm._nodes[key]["nodegroupid"]
        for tile in resource.tiles:
            if nodegroupid == str(tile.nodegroup_id):
                ResourceXResource.objects.filter(
                    resourceinstanceidfrom=wkfm.resource,
                    resourceinstanceidto=self.resource
                ).delete()
                del tile.data[nodeid]

        # This is required to avoid e.g. missing related models preventing
        # saving (as we cannot import those via CSV on first step)
        bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True
        resource.save()
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass

    def append(self, _no_save=False):
        if not self._cross_record:
            raise NotImplementedError("This method is only implemented for relations")

        wkfm = self._cross_record["wkriFrom"]
        key = self._cross_record["wkriFromKey"]
        if not _no_save:
            wkfm.save()
            wkfm.to_resource()
        resource = wkfm.resource
        tile = resource.tiles
        nodeid = wkfm._nodes[key]["nodeid"]
        nodegroupid = wkfm._nodes[key]["nodegroupid"]
        for tile in resource.tiles:
            if nodegroupid == str(tile.nodegroup_id):
                cross = ResourceXResource(
                    resourceinstanceidfrom=wkfm.resource,
                    resourceinstanceidto=self.resource
                )
                cross.save()
                value = [
                    {"resourceId": str(self.resource.resourceinstanceid), "ontologyProperty": "", "resourceXresourceId": str(cross.resourcexid), "inverseOntologyProperty": ""}
                ]
                tile.data.update({nodeid: value})

        # This is required to avoid e.g. missing related models preventing
        # saving (as we cannot import those via CSV on first step)
        if _no_save:
            bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
            system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True
            resource.save()
            system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass
        return wkfm, cross, resource

    def __init__(self, id=None, _new_id=None, resource=None, x=None, filled=True, lazy=False, **kwargs):
        self._values = {}
        self.id = id
        self._new_id = _new_id
        self.resource = resource
        self._cross_record = x
        self._filled = filled
        self._lazy = lazy

        if set(kwargs) - set(self._nodes):
            raise NotImplementedError(
                f"Some keys in {', '.join(kwargs)} are not well-known in {type(self)}"
            )
        if not filled and not lazy:
            self.fill_from_resource(reload=True)

        for key, value in kwargs.items():
            if isinstance(value, list) and any(types := [isinstance(entry, ResourceModelWrapper) for entry in value]):
                if not all(types):
                    raise NotImplementedError(
                        "Cannot currently handle mixed ResourceModelWrapper/non-ResourceModelWrapper lists"
                    )
                typ = self._nodes[key]["type"]
                kwargs[key] = RelationList(self, key, self._nodes[key]["nodeid"], None)
                for resource in value:
                    kwargs[key].append(resource)

        self._values.update(kwargs)

    def _set_value(self, key, arg):
        if "." in key:
            node, prop = key.split(".")
            typ = self._nodes[node]["type"]
            if not typ.startswith("@"):
                raise RuntimeError("Relationship must be with a resource model, not e.g. a primitive type")
            typ = typ[1:]
            datum = {}
            datum["wkriFrom"] = self
            datum["wkriFromKey"] = node
            datum["wkriFromNodeid"] = self._nodes[node]["nodeid"]
            resource_cls = get_well_known_resource_model_by_class_name(typ)
            if not isinstance(arg, list):
                arg = [arg]

            all_resources = []
            for val in arg:
                resources = resource_cls.where(x=datum, **{prop: val})
                if not resources:
                    raise KeyError(f"Related resource for {key} not found: {val}")
                if len(resources) > 1:
                    raise KeyError(f"Multiple related resources for {key} found: {val}")
                all_resources += resources
            return node, all_resources
        else:
            return key, arg

    @classmethod
    def create_bulk(cls, fields: list, do_index: bool = True):
        requested_wkrms = []
        for n, field_set in enumerate(fields):
            try:
                if n % 10 == 0:
                    logging.info(f"create_bulk: {n} / {len(fields)}")
                requested_wkrms.append(cls.create(_no_save=True, _do_index=do_index, **field_set))
            except Exception as e:
                logging.error(f"Failed item {n}")
                raise
        bulk_etl = BulkImportWKRM()
        return bulk_etl.write(requested_wkrms, do_index=do_index)

    @classmethod
    def create(cls, _no_save=False, _do_index=True, **kwargs):
        # If an ID is supplied, it should be treated as desired, not existing.
        if "id" in kwargs:
            kwargs["_new_id"] = kwargs["id"]
            del kwargs["id"]
        inst = cls.build(**kwargs)
        inst.to_resource(_no_save=_no_save, _do_index=_do_index)
        return inst

    @classmethod
    def build(cls, **kwargs):
        values = {}
        for key, arg in kwargs.items():
            if "." not in key:
                values[key] = arg

        inst = cls(**values)

        for key, val in kwargs.items():
            if "." in key:
                setattr(inst, key, val)

        return inst

    def update(self, values: dict):
        for key, val in values.items():
            setattr(self, key, val)

    def save(self):
        resource = self.to_resource(strict=True)

    @classmethod
    def search(cls, text, fields=None, _total=None, _include_provisional=True):
        # AGPL Arches
        total = _total or 0
        include_provisional = _include_provisional
        se = SearchEngineFactory().create()
        # TODO: permitted_nodegroups = get_permitted_nodegroups(request.user)
        permitted_nodegroups = [node["nodegroupid"] for key, node in cls._nodes.items() if (fields is None or key in fields)]

        query = Query(se)
        string_filter = Bool()
        string_filter.should(Match(field="strings.string", query=text, type="phrase_prefix"))
        string_filter.should(Match(field="strings.string.folded", query=text, type="phrase_prefix"))
        string_filter.filter(Terms(field="strings.nodegroup_id", terms=permitted_nodegroups))
        nested_string_filter = Nested(path="strings", query=string_filter)
        total_filter = Bool()
        total_filter.must(nested_string_filter)
        query.add_query(total_filter)
        query.min_score("0.01")

        query.include("resourceinstanceid")
        results = query.search(index=RESOURCES_INDEX, id=None)

        results = [hit["_source"]["resourceinstanceid"] for hit in results["hits"]["hits"]]
        total_count = query.count(index=RESOURCES_INDEX)
        return results, total_count

    @classmethod
    def all_ids(cls):
        return list(Resource.objects.filter(graph_id=cls.graphid).values_list("resourceinstanceid", flat=True))

    @classmethod
    def all(cls):
        resources = Resource.objects.filter(graph_id=cls.graphid).all()
        return [cls.from_resource(resource) for resource in resources]

    @classmethod
    def find(cls, resourceinstanceid):
        resource = Resource.objects.get(resourceinstanceid=resourceinstanceid)
        if resource:
            return cls.from_resource(resource)
        return None

    @classmethod
    def from_resource_instance(cls, resourceinstance, x=None):
        resource = Resource(resourceinstance.resourceinstanceid)
        return cls.from_resource(resource, x=x)

    @classmethod
    @lru_cache
    def _datatype(cls, nodeid):
        datatype = cls._node_datatypes()[nodeid]
        datatype_instance = cls._datatype_factory().get_instance(datatype)
        return datatype, datatype_instance

    @classmethod
    def _datatype_factory(cls):
        if cls.__datatype_factory is None:
            from arches.app.datatypes.datatypes import DataTypeFactory
            cls.__datatype_factory = DataTypeFactory()
        return cls.__datatype_factory

    @classmethod
    def _node_datatypes(cls):
        if cls.__node_datatypes is None:
            cls.__node_datatypes = {
                str(nodeid): datatype for nodeid, datatype in Node.objects.filter(
                    nodeid__in=[node["nodeid"] for node in cls._nodes]
                ).values_list("nodeid", "datatype")
            }
        return cls.__node_datatypes

    def fill_from_resource(self, reload=None):
        all_values = {}
        cls = self.__class__
        class_nodes = {node["nodeid"]: key for key, node in cls._nodes.items()}
        if reload is True or (reload is None and self._lazy):
            self.resource = Resource.objects.get(resourceinstanceid=self.id)
        tiles = TileModel.objects.filter(resourceinstance_id=self.id)
        self.resource.load_tiles()
        # This will expect initialized Django, so we do not do at module start
        from arches.app.datatypes.datatypes import DataTypeFactory
        datatype_factory = DataTypeFactory()

        for tile in self.resource.tiles:
            semantic_values = {}
            semantic_node = None
            for nodeid in tile.data:
                if nodeid in class_nodes:
                    key = class_nodes[nodeid]
                    typ = cls._nodes[key].get("type", str)
                    lang = cls._nodes[key].get("lang", None)
                    if "/" in key:
                        _semantic_node, key = key.split("/")
                        if semantic_node is None:
                            semantic_node = _semantic_node
                        elif semantic_node != _semantic_node:
                            raise RuntimeError(
                                f"We should never end up with node values from two groups (semantic nodes) in a tile: {semantic_node} and {_semantic_node}"
                            )
                        if "/" in semantic_node:
                            raise NotImplementedError("No support for nested semantic nodes currently")
                        values = semantic_values
                    else:
                        values = all_values

                    if typ == str or typ == [str]:
                        if lang is not None and tile.data[nodeid] is not None:
                            text = tile.data[nodeid][lang]["value"]
                        else:
                            text = tile.data[nodeid]
                        if typ == [str]:
                            values.setdefault(key, [])
                            values[key].append(text)
                        else:
                            values[key] = text
                    elif typ == int:
                        values[key] = tile.data[nodeid]
                    elif typ == float:
                        values[key] = tile.data[nodeid]
                    elif typ == "boolean":
                        values[key] = tile.data[nodeid]
                    elif typ == date:
                        values[key] = tile.data[nodeid]
                    elif typ == datetime:
                        values[key] = tile.data[nodeid]
                    elif typ == EDTFDataType:
                        values[key] = tile.data[nodeid]
                    elif typ == settings.GeoJSON:
                        values[key] = tile.data[nodeid]
                    elif typ == settings.Concept:
                        values[key] = tile.data[nodeid]
                    elif typ == [settings.Concept]:
                        values[key] = tile.data[nodeid]
                    elif isinstance(typ, str):
                        if typ.startswith("@") and typ[1:] in _resource_models:
                            if isinstance(tile.data[nodeid], list):
                                values[key] = RelationList(self, key, nodeid, tile.tileid)
                                for datum in tile.data[nodeid]:
                                    related_resource = Resource(datum["resourceId"])
                                    values[key].append(
                                        get_well_known_resource_model_by_class_name(typ).from_resource(related_resource, x=datum, lazy=True)
                                    )
                            elif tile.data[nodeid]:
                                related_resource = Resource(tile.data[nodeid])
                                values[key] = get_well_known_resource_model_by_class_name(typ).from_resource(related_resource, lazy=True)
                        else:
                            try:
                                datatype_factory.get_instance(typ)
                            except:
                                raise NotImplementedError(f"{key} {typ}")
                            else:
                                values[key] = tile.data[nodeid]
                    else:
                        raise NotImplementedError(f"{key} {typ}")
            if semantic_node:
                all_values.setdefault(semantic_node, [])
                all_values[semantic_node].append(semantic_values)
        self._values.update(all_values)
        self._filled = True

    @classmethod
    def from_resource(cls, resource, x=None, lazy=False):
        ri = cls(
            id=resource.resourceinstanceid,
            resource=resource,
            x=x,
            filled=False,
            lazy=lazy
        )
        return ri

    def describe(self):
        description = f"{self.__class__.__name__}: {str(self)} <ri:{self.id} g:{self.graphid}>\n"
        table = [["PROPERTY", "TYPE", "VALUE"]]
        for key, value in self._values.items():
            if isinstance(value, list) or isinstance(value, RelationList):
                if value:
                    table.append([key, value[0].__class__.__name__, str(value[0])])
                    for val in value[1:]:
                        table.append(["", val.__class__.__name__, str(val)])
                else:
                    table.append([key, "", "(empty)"])
            else:
                table.append([key, value.__class__.__name__, str(value)])
        return description + tabulate(table)

    @classmethod
    def where(cls, x=None, **kwargs):
        # TODO: replace with proper query
        unknown_keys = set(kwargs) - set(cls._nodes)
        if unknown_keys:
            raise KeyError(f"Unknown key(s) {unknown_keys}")

        if len(kwargs) != 1:
            raise NotImplementedError("Need exactly one filter")

        key = list(kwargs)[0]
        value = kwargs[key]

        tiles = Tile.objects.filter(
            nodegroup_id=cls._nodes[key]["nodegroupid"],
            data__contains={cls._nodes[key]["nodeid"]: value}
        )
        return [
            cls.from_resource_instance(tile.resourceinstance, x=x)
            for tile in tiles
        ]


    def _update_tiles(self, tiles, values, tiles_to_remove, prefix=None):
        # This will expect initialized Django, so we do not do at module start
        from arches.app.datatypes.datatypes import DataTypeFactory
        datatype_factory = DataTypeFactory()

        relationships = []
        for key, node in self._nodes.items():
            if node["nodeid"] not in self._nodes_loaded:
                self._nodes_loaded[node["nodeid"]] = Node.objects.get(nodeid=node["nodeid"])
            loaded_node = self._nodes_loaded[node["nodeid"]] # FIXME: Duplicate

            if prefix is not None:
                if not key.startswith(prefix):
                    continue
                prekey, key = key.split("/", -1)
                if "/" in prekey:
                    raise NotImplementedError("Only one level of groupings supported")
            elif "/" in key:
                continue

            if key in values:
                data = {}
                single = False
                value: Any = values[key]
                typ = node["type"]
                if typ == [settings.Semantic]:
                    tiles.setdefault(node["nodegroupid"], [])
                    if "parentnodegroup_id" in node:
                        parent = tiles.setdefault(node["parentnodegroup_id"], [TileProxyModel(dict(
                            data={},
                            nodegroup_id=node["parentnodegroup_id"], tileid=None
                        ))])[0]
                    else:
                        parent = None
                    for entry in value:
                        subtiles = {}
                        if parent:
                            subtiles[parent.nodegroup_id] = [parent]

                        # If we have a dataless version of this node, perhaps because it is already
                        # a parent, we allow it to be filled in.
                        if tiles[node["nodegroupid"]] and not tiles[node["nodegroupid"]][0].data and tiles[node["nodegroupid"]][0].tiles:
                            subtiles[node["nodegroupid"]] = [tiles[node["nodegroupid"]][0]]

                        relationships += self._update_tiles(subtiles, entry, tiles_to_remove, prefix=f"{key}/")
                        if node["nodegroupid"] in subtiles:
                            tiles[node["nodegroupid"]] = list(set(tiles[node["nodegroupid"]]) | set(subtiles[node["nodegroupid"]]))
                    # We do not need to do anything here, because
                    # the nodegroup (semantic node) has no separate existence from the values
                    # in the tile in our approach -- if there were values, the appropriate tile(s)
                    # were added with this nodegroupid. For nesting, this would need to change.
                    continue
                elif value and (isinstance(value, list) or isinstance(value, RelationList)) and isinstance(value[0], ResourceModelWrapper):
                    value = [({}, v) for v in value]
                    relationships += value
                    value = [[v] for v, _ in value]
                # FIXME: we should be able to remove entries if appropriate
                elif (isinstance(value, list) or isinstance(value, RelationList)) and len(value) == 0:
                    continue
                    # if value[0]._cross_record:
                    #       value = [value[0]._cross_record]
                    #   else:
                    #       relationships.append((node["nodegroupid"], node["nodeid"], str(value[0].id)))
                    #       continue
                elif key == "basic_info_language":
                    single = True
                    value = [get_preflabel_from_valueid("bc35776b-996f-4fc1-bd25-9f6432c1f349", "en-US")['id']]
                elif typ == int:
                    single = True
                elif typ == float:
                    single = True
                elif typ == "boolean":
                    single = True
                elif typ == date:
                    single = True
                    value = datetime.strptime(value, "%Y-%m-%d").strftime("%Y-%m-%d")
                elif typ == datetime:
                    single = True
                    value = datetime.fromisoformat(value).isoformat()
                elif typ == settings.GeoJSON:
                    single = True
                    if value:
                        value["properties"] = {"nodeId": node["nodeid"]}
                elif typ == settings.Concept:
                    single = True
                elif typ == [settings.Concept]:
                    single = True
                elif "lang" in node:
                    if typ == str:
                        single = True
                        value = {node["lang"]: {"value": value, "direction": "ltr"}} # FIXME: rtl
                    elif typ == [str]:
                        single = False
                        value = [{node["lang"]: {"value": text, "direction": "ltr"}} for text in value]
                    else:
                        raise NotImplementedError("Unknown type")
                elif isinstance(typ, str):
                    single = True
                    datatype_instance = datatype_factory.get_instance(typ)
                    value = datatype_instance.transform_value_for_tile(value, **loaded_node.config)
                    logging.error(f"{value} {node['nodeid']}")
                if single:
                    multiple_values: list = [value]
                else:
                    multiple_values: list = list(value)

                for value in multiple_values:
                    data = {}
                    data[node["nodeid"]] = value
                    if not single and prefix:
                        raise RuntimeError("Cannot have field multiplicity inside a grouping (semantic node), as it is equivalent to nesting")

                    if "parentnodegroup_id" in node:
                        parents = tiles.setdefault(node["parentnodegroup_id"], [TileProxyModel(dict(
                            data={},
                            nodegroup_id=node["parentnodegroup_id"], tileid=None
                            ))])
                        parent = parents[0]
                    else:
                        parent = None

                    if node["nodegroupid"] in tiles:
                        #if single or not tiles[node["nodegroupid"]].data:
                        if single:
                            tile = tiles[node["nodegroupid"]][0]
                            if tile in tiles_to_remove:
                                tiles_to_remove.remove(tile)
                            if parent and not tile.parenttile:
                                tile.parenttile = parent
                                parent.tiles.append(tile)
                            tile.data.update(data)
                            continue
                    #else:
                    #    tiles[node["nodegroupid"]] = []
                    #if (tile := tiles.get(str(node["nodegroupid"]), False)) != False:
                    #    tile.data = data
                    #    if not tile.parenttile:
                    #        tile.parenttile = parent
                    #else:
                    tile = TileProxyModel(dict(
                        data=data,
                        nodegroup_id=node["nodegroupid"],
                        parenttile=parent, tileid=None
                    ))
                    tiles.setdefault(node["nodegroupid"], [])
                    tiles[node["nodegroupid"]].append(tile)
                    if parent:
                        parent.tiles.append(tile)
        return relationships

    def to_resource(self, verbose=False, strict=False, _no_save=False, _known_new=False, _do_index=True):
        resource = Resource(resourceinstanceid=self.id, graph_id=self.graphid)
        tiles = {}
        if not _known_new:
            for tile in Tile.objects.filter(resourceinstance=resource):
                tiles.setdefault(tile.nodegroup_id, [])
                tiles[tile.nodegroup_id].append(tile)
        tiles_to_remove = sum((ts for ts in tiles.values()), [])

        relationships = self._update_tiles(tiles, self._values, tiles_to_remove)

        # parented tiles are saved hierarchically
        resource.tiles = [t for t in sum((ts for ts in tiles.values()), []) if not t.parenttile]

        if not resource.createdtime:
            resource.createdtime = datetime.now()
        #errors = resource.validate(verbose=verbose, strict=strict)
        #if len(errors):
        #    raise RuntimeError(str(errors))


        # FIXME: potential consequences for thread-safety
        # This is required to avoid e.g. missing related models preventing
        # saving (as we cannot import those via CSV on first step)
        self._pending_relationships = []
        if not _no_save:
            bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
            system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True
            #all_tiles = resource.tiles
            #parentless_tiles = [tile for tile in all_tiles if not tile.parenttile]
            ## This only solves the problem for _one_ level of nesting
            #if len(all_tiles) > len(parentless_tiles):
            #    resource.tiles = parentless_tiles
            #    resource.save()
            #    resource.tiles = all_tiles

            # TODO: remove tiles_to_remove
            resource.save()
            self.id = resource.resourceinstanceid
            system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass
        elif not resource._state.adding:
            self.id = resource.resourceinstanceid

        parented = [t.data for t in sum((ts for ts in tiles.values()), []) if t.parenttile]
        self.resource = resource

        #for nodegroupid, nodeid, resourceid in relationships:
        for (value, related) in relationships:
            related.to_resource(verbose=verbose, strict=strict, _no_save=_no_save)
            if _no_save:
                self._pending_relationships.append((value, related, self))
            else:
                # TODO: what happens if the cross already exists for some reason?
                cross = ResourceXResource(
                    resourceinstanceidfrom=resource,
                    resourceinstanceidto=related.resource
                )
                cross.save()
                value.update(
                    {
                        "resourceId": str(resource.resourceinstanceid),
                        "ontologyProperty": "",
                        "resourceXresourceId": str(cross.resourcexid),
                        "inverseOntologyProperty": ""
                    }
                )
                resource.save()

        # self.id = resource.resourceinstanceid

        return resource

    def __str__(self):
        return str(self._wkrm.to_string(self))

    def __init_subclass__(cls, well_known_resource_model=None):
        if not well_known_resource_model:
            raise RuntimeError("Must try to wrap a real model")

        cls.name = well_known_resource_model.model_name
        cls.graphid = well_known_resource_model.graphid
        cls._wkrm = well_known_resource_model
        cls._nodes = well_known_resource_model.nodes
        cls._nodes_loaded = {}
        cls.post_save = Signal()

@receiver(post_save, sender=Tile)
def check_resource_instance_on_tile_save(sender, instance, **kwargs):
    if instance.resourceinstance and instance.resourceinstance.resourceinstanceid:
        check_resource_instance(sender, instance, "tile saved", **kwargs)

@receiver(post_delete, sender=Tile)
def check_resource_instance_on_tile_delete(sender, instance, **kwargs):
    if instance.resourceinstance and instance.resourceinstance.resourceinstanceid:
        check_resource_instance(sender, instance, "tile deleted", **kwargs)

def check_resource_instance(sender, instance, reason, **kwargs):
    # This (I think) gets loaded anyway during the Tile save
    model_cls = get_well_known_resource_model_by_graph_id(instance.resourceinstance.graph_id)
    if model_cls and model_cls.post_save.has_listeners():
        resource_instance = model_cls.from_resource_instance(instance.resourceinstance)
        model_cls.post_save.send(model_cls, instance=resource_instance, reason=reason, tile=instance)

_resource_models = {
    wkrm.model_class_name: type(wkrm.model_class_name, (ResourceModelWrapper,), {}, well_known_resource_model=wkrm)
    for wkrm in _WELL_KNOWN_RESOURCE_MODELS
}
_resource_models_by_graph_id = {rm.graphid: rm for rm in _resource_models.values()}

def get_well_known_resource_model_by_class_name(class_name, default=None):
    return _resource_models.get(class_name, default)

def get_well_known_resource_model_by_graph_id(graphid, default=None):
    return _resource_models_by_graph_id.get(str(graphid), default)

def attempt_well_known_resource_model(resource_id):
    resource = Resource.objects.get(pk=resource_id)
    wkrm = get_well_known_resource_model_by_graph_id(resource.graph_id, default=None)
    if wkrm:
        return wkrm.from_resource(resource)
    return None

globals().update(_resource_models)
