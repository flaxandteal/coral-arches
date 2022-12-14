import logging
import uuid
import datetime
import collections
from arches.app.search.components.base import SearchFilterFactory
from arches.app.search.search_engine_factory import SearchEngineFactory
from arches.app.views.search import get_resource_model_label, RESOURCES_INDEX
from arches.app.models.concept import get_preflabel_from_conceptid
from arches.app.search.elasticsearch_dsl_builder import Bool, Match, Query, Nested, Terms, MaxAgg, Aggregation
from tabulate import tabulate
from dataclasses import dataclass
from typing import Callable
from django.dispatch import Signal
from django.db.models.signals import post_init, post_delete, pre_save, post_save
from django.dispatch import receiver
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.models import ResourceXResource, Concept, TileModel, Node
from arches.app.models.concept import get_preflabel_from_valueid
from arches.app.models.tile import Tile as TileProxyModel
from coral import settings
from arches.app.models.system_settings import settings as system_settings
#from arches.app.models import TileModel


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

    def append(self):
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
            logging.warning(tile)
            logging.warning(tile.nodegroup_id)
            logging.warning(nodegroupid)
            if nodegroupid == str(tile.nodegroup_id):
                cross = ResourceXResource(
                    resourceinstanceidfrom=wkfm.resource,
                    resourceinstanceidto=self.resource
                )
                cross.save()
                value = [
                    {"resourceId": str(self.resource.resourceinstanceid), "ontologyProperty": "", "resourceXresourceId": str(cross.resourcexid), "inverseOntologyProperty": ""}
                ]
                logging.warning({nodeid: value})
                tile.data.update({nodeid: value})

        # This is required to avoid e.g. missing related models preventing
        # saving (as we cannot import those via CSV on first step)
        bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True
        resource.save()
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass

    def __init__(self, id=None, resource=None, x=None, filled=True, lazy=False, **kwargs):
        self._values = {}
        self.id = id
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
        self._values.update(kwargs)

    def _set_value(self, key, arg):
        if "." in key:
            node, prop = key.split(".")
            typ = self._nodes[node]["type"]
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
    def create(cls, **kwargs):
        values = {}
        for key, arg in kwargs.items():
            if "." not in key:
                values[key] = arg

        inst = cls(**values)

        for key, val in kwargs.items():
            if "." in key:
                setattr(inst, key, val)

        inst.to_resource()

        return inst

    def update(self, values: dict):
        for key, val in values.items():
            setattr(self, key, val)

    def save(self):
        resource = self.to_resource(strict=True)

    @classmethod
    def search(cls, text, _total=None, _include_provisional=True):
        # AGPL Arches
        total = _total or 0
        include_provisional = _include_provisional
        se = SearchEngineFactory().create()
        # TODO: permitted_nodegroups = get_permitted_nodegroups(request.user)
        permitted_nodegroups = [node["nodegroupid"] for node in cls._nodes.values()]

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

    def fill_from_resource(self, reload=None):
        values = {}
        cls = self.__class__
        class_nodes = {node["nodeid"]: key for key, node in cls._nodes.items()}
        if reload is True or (reload is None and self._lazy):
            self.resource = Resource.objects.get(resourceinstanceid=self.id)
        tiles = TileModel.objects.filter(resourceinstance_id=self.id)
        self.resource.load_tiles()
        for tile in self.resource.tiles:
            for nodeid in tile.data:
                print(tile.data, nodeid, class_nodes)
                if nodeid in class_nodes:
                    key = class_nodes[nodeid]
                    typ = cls._nodes[key].get("type", str)
                    lang = cls._nodes[key].get("lang", None)
                    if typ is str:
                        if lang is not None:
                            values[key] = tile.data[nodeid][lang]["value"]
                        else:
                            values[key] = tile.data[nodeid]
                    elif isinstance(typ, str):
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
                        raise NotImplementedError()
        self._values.update(values)
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

    def to_resource(self, verbose=False, strict=False):
        resource = Resource(resourceinstanceid=self.id, graph_id=self.graphid)
        tiles = {str(tile.nodegroup_id): tile for tile in Tile.objects.filter(resourceinstance=resource)}
        relationships = []
        for key, node in self._nodes.items():
            data = {}
            if key in self._values:
                value = self._values[key]
                if value and (isinstance(value, list) or isinstance(value, RelationList)) and isinstance(value[0], ResourceModelWrapper):
                    continue
                    # if value[0]._cross_record:
                    #       value = [value[0]._cross_record]
                    #   else:
                    #       relationships.append((node["nodegroupid"], node["nodeid"], str(value[0].id)))
                    #       continue
                elif key == "basic_info_language":
                    value = [get_preflabel_from_valueid("bc35776b-996f-4fc1-bd25-9f6432c1f349", "en-US")['id']]
                elif "lang" in node:
                    value = {node["lang"]: {"value": value, "direction": "ltr"}} # FIXME: rtl
                data[node["nodeid"]] = value
                if node["nodegroupid"] in tiles:
                    tiles[node["nodegroupid"]].data.update(data)
                else:
                    tiles[node["nodegroupid"]] = TileProxyModel(
                        data=data,
                        nodegroup_id=node["nodegroupid"]
                    )

        resource.tiles = list(tiles.values())

        if not resource.createdtime:
            resource.createdtime = datetime.datetime.now()
        #errors = resource.validate(verbose=verbose, strict=strict)
        #if len(errors):
        #    raise RuntimeError(str(errors))


        # This is required to avoid e.g. missing related models preventing
        # saving (as we cannot import those via CSV on first step)
        bypass = system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = True
        resource.save()
        system_settings.BYPASS_REQUIRED_VALUE_TILE_VALIDATION = bypass

        self.id = resource.resourceinstanceid
        self.resource = resource

        #for nodegroupid, nodeid, resourceid in relationships:
        #    cross = ResourceXResource(
        #        resourceinstanceidfrom=resource,
        #        resourceinstanceidto=Resource(resourceid)
        #    )
        #    cross.save()
        #    value = [
        #        {"resourceId": str(resource.resourceinstanceid), "ontologyProperty": "", "resourceXresourceId": str(cross.resourcexid), "inverseOntologyProperty": ""}
        #    ]
        #    if nodegroupid in tiles:
        #        tiles[nodegroupid].data = {nodeid: value}
        #    else:
        #        tiles[nodegroupid] = TileProxyModel(
        #            data={nodeid: value},
        #            nodegroup_id=node["nodegroupid"]
        #        )

        # resource.save()

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
