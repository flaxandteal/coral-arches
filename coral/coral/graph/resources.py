# MIT License
#
# Copyright (c) 2020 Taku Fukada, 2022 Phil Weir

import os
import threading
import asyncio
import django
import logging
from arches.app.models.graph import Graph
from functools import partial
from datetime import datetime, date
from asgiref.sync import sync_to_async

from .utils import snake, camel, studly, string_to_enum

import graphene
from graphene_file_upload.scalars import Upload

from starlette.applications import Starlette
from starlette_graphene3 import GraphQLApp, make_graphiql_handler

from aiodataloader import DataLoader
from coral.resource_model_wrappers import attempt_well_known_resource_model, _WELL_KNOWN_RESOURCE_MODELS, get_well_known_resource_model_by_class_name

from arches.app.models import models
from arches.app.models.concept import Concept
from arches.app.datatypes.concept_types import ConceptDataType, ConceptListDataType
from arches.app.datatypes.datatypes import ResourceInstanceDataType
import asyncio

from arches.app.datatypes.datatypes import DataTypeFactory, EDTFDataType, GeojsonFeatureCollectionDataType

import slugify

ALLOW_NON_WKRM_GRAPHS = str(os.environ.get("ARCHES_GRAPH_API_ALLOW_NON_WKRM_GRAPHS", "false")).lower() == "true"
ALLOW_NON_WKRM_GRAPHS = True

class DataTypes:
    node_datatypes = None
    inited = False
    exc = None

    def __init__(self):
        self.collections = {}
        self.graphs = {}
        self.remapped = {}
        self.demapped = {}
        self.semantic_nodes = {}
        self.related_nodes = {}

    def demap(self, model, field, value):
        if value is None:
            return None
        if (closure := self.demapped.get((model, field), None)):
            res = closure(value)
            return res
        return value

    def remap(self, model, field, value):
        if (closure := self.remapped.get((model, field), None)):
            return closure(value)
        return value

    def _build_related(self, nodeid, related_field, model_name):
        node = models.Node.objects.get(nodeid=nodeid)
        if nodeid not in self.related_nodes:
            assert str(nodeid) in self.node_datatypes and self.node_datatypes[str(nodeid)].startswith("resource-instance")
            self.related_nodes[nodeid] = {}
            logging.error("N %s %s", str(node), str(node.config))
            self.related_nodes[nodeid] = {
                "name": related_field,
                "model_name": model_name,
                "relatable_graphs": []
            }
        assert related_field.split("/")[-1] == self.related_nodes[nodeid]["name"], f"{related_field} != {self.related_nodes[nodeid]['name']}"
        self.related_nodes[nodeid]["relatable_graphs"] += [str(graph["graphid"]) for graph in node.config["graphs"] if str(graph["graphid"]) in self.graphs]
        logging.error(">%s", str(self.related_nodes[nodeid]["relatable_graphs"]))
        return self.related_nodes[nodeid]["name"]

    def _build_semantic(self, nodeid, semantic_field, field, field_info, model_name, model_class_name):
        if nodeid not in self.semantic_nodes:
            assert str(nodeid) in self.node_datatypes and self.node_datatypes[str(nodeid)] == "semantic"
            self.semantic_nodes[nodeid] = {}
            node = models.Node.objects.get(nodeid=nodeid)
            self.semantic_nodes[nodeid] = {
                "name": semantic_field,
                "model_name": model_name,
                "model_class_name": model_class_name,
                "fields": []
            }
        self.semantic_nodes[nodeid]["fields"].append((field, field_info))
        assert semantic_field == self.semantic_nodes[nodeid]["name"]
        assert model_class_name == self.semantic_nodes[nodeid]["model_class_name"]
        return self.semantic_nodes[nodeid]["name"]

    def init(self):
        if not self.inited:
            try:
                self.node_datatypes = {str(nodeid): datatype for nodeid, datatype in models.Node.objects.values_list("nodeid", "datatype")}
                self.datatype_factory = DataTypeFactory()
                allowed_graphs = None if ALLOW_NON_WKRM_GRAPHS else {wkrm.graphid for wkrm in _WELL_KNOWN_RESOURCE_MODELS}
                self.graphs = {
                    str(pk): string_to_enum(str(name)) for pk, name in Graph.objects.values_list("pk", "name")
                    if (allowed_graphs is None or str(pk) in allowed_graphs)
                }

                for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
                    if str(wkrm.graphid) in self.graphs:
                        self.graphs[str(wkrm.graphid)] = wkrm
                    for field, info in wkrm.nodes.items():
                        if "nodeid" in info:
                            if "/" in field:
                                semantic_field, subfield = field.split("/", -1)
                                assert "/" not in semantic_field, "Can only have one level of grouping above raw data fields"
                                self._build_semantic(info["nodegroupid"], semantic_field, subfield, info, wkrm.model_name, wkrm.model_class_name)
                                model_name = wkrm.model_name
                            else:
                                model_name = wkrm.model_name
                            self._process_field(info["nodeid"], model_name, field)
                            # AGPL Arches
                self._process_semantic_fields()
                self.inited = True
            except Exception as exc:
                self.exc = exc
                raise exc

    def _process_semantic_fields(self):
        for nodeid, node in self.semantic_nodes.items():
            self.remapped[(node["model_name"], node["name"])] = partial(
                lambda vs, model_name, name: [{k: self.remap(model_name, f"{name}/{k}", v) for k, v in entry.items()} for entry in vs],
                model_name=node["model_name"],
                name=node["name"],
            )
            self.demapped[(node["model_name"], node["name"])] = partial(
                lambda vs, model_name, name: [{k: self.demap(model_name, f"{name}/{k}", v) for k, v in entry.items()} for entry in vs],
                model_name=node["model_name"],
                name=node["name"],
            )

    def _process_field(self, nodeid, model_name, field):
        datatype = self.node_datatypes[nodeid]
        datatype_instance = self.datatype_factory.get_instance(datatype)
        if isinstance(datatype_instance, ResourceInstanceDataType):
            self._build_related(nodeid, field, model_name)
            def _construct_resource(vs, nodeid, field, model_name, datatype_instance):
                graphs = self.related_nodes[nodeid]["relatable_graphs"]
                assert len(graphs) == 1, f"Could not determine a unique type for this subgraph {field} of {model_name}"
                wkrm = self.graphs[graphs[0]]
                resources = [_build_resource(wkrm, **v) for v in vs]
                return resources

            self.remapped[(model_name, field)] = partial(
                lambda vs, nodeid: _construct_resource(vs, nodeid, field, model_name, datatype_instance),
                nodeid=nodeid
            )
        if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
            collection = Concept().get_child_collections(models.Node.objects.get(nodeid=nodeid).config["rdmCollection"])
            self.collections[nodeid] = {
                "forward": {f"{string_to_enum(field)}.{string_to_enum(label[1])}": label[2] for label in collection},
                "back": {label[2]: string_to_enum(label[1]) for label in collection}
            }
            if isinstance(datatype_instance, ConceptListDataType):
                self.remapped[(model_name, field)] = partial(
                    lambda vs, nodeid: list(map(self.collections[nodeid]["forward"].get, map(str, vs))),
                    nodeid=nodeid
                )
                self.demapped[(model_name, field)] = partial(
                    lambda vs, nodeid: list(map(self.collections[nodeid]["back"].get, map(str, vs))),
                    nodeid=nodeid
                )
            else:
                self.remapped[(model_name, field)] = partial(
                    lambda v, nodeid: self.collections[nodeid]["forward"][str(v)],
                    nodeid=nodeid
                )
                self.demapped[(model_name, field)] = partial(
                    lambda v, nodeid: self.collections[nodeid]["back"][str(v)],
                    nodeid=nodeid
                )

    def to_graphene_mut(self, info, field, model_class_name):
        if "type" in info:
            typ = info["type"]

            if typ == str:
                return graphene.String()
            elif typ == [str]:
                return graphene.List(graphene.String)
            elif typ == date:
                return graphene.String()
            elif typ == datetime:
                return graphene.String()
            elif typ == "boolean":
                return graphene.Boolean()
            elif typ == float:
                return graphene.Float()
            elif typ == int:
                return graphene.Int()
            #elif isinstance(typ, str):
            #    return graphene.List(graphene.String())

        if "nodeid" in info:
            # AGPL Arches
            datatype = self.node_datatypes[info["nodeid"]]
            datatype_instance = self.datatype_factory.get_instance(datatype)
            if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
                collection = self.collections[info["nodeid"]]
                # We lose the conceptid here, so cannot spot duplicates, but the idea is
                # to restrict transfer to being human-readable.
                pairs = {}
                for n, value in enumerate(collection["back"].values()):
                    pairs[value] = (value, n)
                if len(pairs) != len(collection["back"]):
                    print(f"WARNING: duplicate enum entries for {field}")
                raw_type = graphene.Enum(string_to_enum(field), list(pairs.values()))

                return graphene.Argument(graphene.List(raw_type) if isinstance(datatype_instance, ConceptListDataType) else raw_type)
            elif isinstance(datatype_instance, ResourceInstanceDataType):
                graphs = self.related_nodes[info["nodeid"]]["relatable_graphs"]
                logging.error("%s]", str(graphs))
                assert len(graphs) > 0, "Relations must relate a graph that is well-known"
                if len(graphs) == 1:
                    graph = graphs[0]
                    return graphene.Argument(graphene.List(lambda: _resource_model_inputs[self.graphs[graph].model_class_name]))
                else:
                    union = type(
                        f"{model_class_name}{string_to_enum(field)}UnionInputType",
                        (graphene.InputObjectType,),
                        {
                            self.graphs[graph]: graphene.List(lambda: _resource_model_inputs[self.graphs[graph].model_class_name]) for graph in graphs
                        }
                    )
                    return union
            elif isinstance(datatype_instance, GeojsonFeatureCollectionDataType):
                return graphene.JSONString()
            elif isinstance(datatype_instance, EDTFDataType):
                return graphene.String()

    def to_graphene(self, info, field, model_class_name):
        if "type" in info:
            typ = info["type"]

            if typ == str:
                return graphene.String()
            elif typ == [str]:
                return graphene.List(graphene.String)
            elif typ == date:
                return graphene.String()
            elif typ == datetime:
                return graphene.String()
            elif typ == "boolean":
                return graphene.Boolean()
            elif typ == float:
                return graphene.Float()
            elif typ == int:
                return graphene.Int()
            #elif isinstance(typ, str):
            #    return graphene.List(lambda: _resource_model_schemas[typ])

        if "nodeid" in info:
            # AGPL Arches
            datatype = self.node_datatypes[info["nodeid"]]
            datatype_instance = self.datatype_factory.get_instance(datatype)
            logging.error("%s %s %s", str(datatype_instance), str(info), str(datatype))
            if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
                collection = self.collections[info["nodeid"]]
                # We lose the conceptid here, so cannot spot duplicates, but the idea is
                # to restrict transfer to being human-readable.
                pairs = {}
                for n, value in enumerate(collection["back"].values()):
                    pairs[value] = (value, n)
                if len(pairs) != len(collection["back"]):
                    print(f"WARNING: duplicate enum entries for {field}")
                raw_type = graphene.Enum(string_to_enum(field), list(pairs.values()))

                return graphene.List(raw_type) if isinstance(datatype_instance, ConceptListDataType) else graphene.Field(raw_type)
            elif isinstance(datatype_instance, ResourceInstanceDataType):
                graphs = self.related_nodes[info["nodeid"]]["relatable_graphs"]
                assert len(graphs) > 0, "Relations must relate a graph that is well-known"
                if len(graphs) == 1:
                    graph = graphs[0]
                    return graphene.List(lambda: _resource_model_schemas[self.graphs[graph].model_class_name])
                else:
                    def _make_union(graphs):
                        class Union(graphene.Union):
                            Meta = {
                                    "types": tuple([_resource_model_schemas[self.graphs[graph].model_class_name] for graph in graphs])
                            }
                        union = type(
                            f"{model_class_name}{string_to_enum(field)}Union",
                            (Union,),
                            {}
                        )
                        return union.Field()
                    return graphene.List(partial(_make_union, graphs))
            elif isinstance(datatype_instance, GeojsonFeatureCollectionDataType):
                return graphene.JSONString()
            elif isinstance(datatype_instance, EDTFDataType):
                return graphene.String()

data_types = DataTypes()

# Do synchronous data retrieval of "constants". After this, we assume they are available.
thread = threading.Thread(target=data_types.init)
thread.start()
thread.join()
if data_types.exc:
    raise data_types.exc

semantic_input_objects = {}
semantic_schema_objects = {}
for nodeid, semantic_type in data_types.semantic_nodes.items():
    semantic = set()
    args = []
    fields = []
    for field, info in semantic_type["fields"]:
        fullfield = f"{semantic_type['name']}/{field}"
        args.append((field, data_types.to_graphene_mut(info, fullfield, None)))
        fields.append((field, data_types.to_graphene(info, fullfield, None)))

        SchemaType = type(
            f"{semantic_type['model_class_name']}{string_to_enum(semantic_type['name'])}Schema",
            (graphene.ObjectType,),
            {
                field: typ for field, typ in fields
            }
        )
        InputObjectType = type(
            f"{semantic_type['model_class_name']}{string_to_enum(semantic_type['name'])}Input",
            (graphene.InputObjectType,),
            {
                field: typ for field, typ in args
            }
        )
        semantic_schema_objects[(semantic_type['model_class_name'], semantic_type['name'])] = graphene.List(SchemaType)
        semantic_input_objects[(semantic_type['model_class_name'], semantic_type['name'])] = graphene.List(InputObjectType)

def _to_graphene_mut(wkrm):
    fields = [("id", {"type": str})] + list(wkrm.nodes.items())
    semantic = set()
    for field, info in fields:
        if (wkrm.model_class_name, field) in semantic_input_objects:
            yield (field, graphene.Argument(semantic_input_objects[(wkrm.model_class_name, field)]))
        elif "/" not in field and (typ := data_types.to_graphene_mut(info, field, wkrm.model_class_name)):
            yield (field, typ)

def _to_graphene(wkrm):
    fields = [("id", {"type": str})] + list(wkrm.nodes.items())
    semantic = set()
    for field, info in fields:
        # We rely on the first pass having picked up all semantic fields and putting them
        # in semantic_schema_objects, so we can ignore '/' fields
        if (wkrm.model_class_name, field) in semantic_schema_objects:
            yield (field, graphene.Field(semantic_schema_objects[(wkrm.model_class_name, field)]))
        elif "/" not in field and (typ := data_types.to_graphene(info, field, wkrm.model_class_name)):
            yield (field, typ)

_resource_model_mappers = {
    wkrm.model_class_name: {
        field: partial(data_types.demap, wkrm.model_name, field) for field, _ in _to_graphene(wkrm)
    }
    for wkrm in _WELL_KNOWN_RESOURCE_MODELS
}
_resource_model_schemas = {
        wkrm.model_class_name: type(
            f"{wkrm.model_class_name}Schema",
            (graphene.ObjectType,),
            {field: typ for field, typ in _to_graphene(wkrm)}
        )
    for wkrm in _WELL_KNOWN_RESOURCE_MODELS
}
_resource_model_inputs = {
        wkrm.model_class_name: type(
            f"{wkrm.model_class_name}Input",
            (graphene.InputObjectType,),
            {
                field: typ for field, typ in _to_graphene_mut(wkrm)
            }
        )
    for wkrm in _WELL_KNOWN_RESOURCE_MODELS
}

class ResourceInstanceLoader(DataLoader):
    async def batch_load_fn(self, keys):
        # Here we call a function to return a user for each key in keys
        out = list(await sync_to_async(self._batch_load_fn_real)(keys))
        return out

    def _batch_load_fn_real(self, keys):
        ret = [attempt_well_known_resource_model(key) for key in keys]
        group = []
        for wkrm in ret:
            group.append(
                {field: mapper(getattr(wkrm, field, None)) for field, mapper in _resource_model_mappers[wkrm._wkrm.model_class_name].items()}
            )
        return group

ri_loader = ResourceInstanceLoader()


_name_map = {
    snake(wkrm.model_class_name): wkrm.model_class_name
    for wkrm in _WELL_KNOWN_RESOURCE_MODELS
}

async def resolver(field, root, _, info, **kwargs):
    only_one = False
    try:
        model_class_name = _name_map[field]
    except KeyError:
        if field.startswith("get_"):
            all_ids = [str(kwargs["id"])]
            only_one = True
        elif field.startswith("search_"):
            model_class_name = _name_map[field[7:]]
            model_class = get_well_known_resource_model_by_class_name(model_class_name)
            all_ids, _ = await sync_to_async(model_class.search)(**kwargs)
    else:
        model_class = get_well_known_resource_model_by_class_name(model_class_name)
        models = await sync_to_async(model_class.all_ids)()
        all_ids = [str(idx) for idx in models]
    if only_one:
        if len(all_ids) != 1:
            raise RuntimeError("Only one ID expected")
        return (await ri_loader.load_many(all_ids))[0]
    return await ri_loader.load_many(all_ids)

_full_resource_query_methods = {}
for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
    _full_resource_query_methods[snake(wkrm.model_class_name)] = graphene.List(_resource_model_schemas[wkrm.model_class_name])
    _full_resource_query_methods[f"get_{snake(wkrm.model_class_name)}"] = graphene.Field(_resource_model_schemas[wkrm.model_class_name], id=graphene.UUID(required=True))
    _full_resource_query_methods[f"search_{snake(wkrm.model_class_name)}"] = graphene.List(_resource_model_schemas[wkrm.model_class_name], text=graphene.String(), fields=graphene.List(graphene.String))
    _full_resource_query_methods[f"list_{snake(wkrm.model_class_name)}"] = graphene.List(_resource_model_schemas[wkrm.model_class_name])

ResourceQuery = type(
    "ResourceQuery",
    (graphene.ObjectType,),
    _full_resource_query_methods,
    default_resolver=resolver
)

class FileUploadMutation(graphene.Mutation):
    class Arguments:
        file = Upload(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, file, **kwargs):
        return FileUploadMutation(ok=True)


class Mutation(graphene.ObjectType):
    upload_file = FileUploadMutation.Field()

async def mutate_bulk_create(parent, info, mutation, wkrm, field_sets, do_index=False):
    resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
    field_sets = [{field: data_types.remap(wkrm.model_name, field, value) for field, value in field_set.items()} for field_set in field_sets]
    resources = await sync_to_async(resource_cls.create_bulk)(field_sets, do_index=do_index)
    ok = True
    kwargs = {
        snake(wkrm.model_class_name) + "s": resources,
        "ok": ok
    }
    return mutation(**kwargs)

async def mutate_create(parent, info, mutation, wkrm, **kwargs):
    resource = _build_resource(wkrm, **kwargs)
    await sync_to_async(resource.to_resource)()
    ok = True
    kwargs = {
        snake(wkrm.model_class_name): resource,
        "ok": ok
    }
    return mutation(**kwargs)

def _build_resource(wkrm, **kwargs):
    resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
    kwargs = {field: data_types.remap(wkrm.model_name, field, value) for field, value in kwargs.items()}
    resource = resource_cls.build(**kwargs)
    return resource

async def mutate_delete(parent, info, mutation, wkrm, id):
    resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
    resource = await sync_to_async(resource_cls.find)(id)
    await sync_to_async(resource.delete)()
    ok = True
    kwargs = {
        "ok": ok
    }
    return mutation(**kwargs)

_full_resource_mutation_methods = {}
for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
    ResourceSchema = _resource_model_schemas[wkrm.model_class_name]
    ResourceInputObjectType = _resource_model_inputs[wkrm.model_class_name]
    mutations = {}
    mutations["BulkCreateResource"] = type(
        f"BulkCreate{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            snake(wkrm.model_class_name) + "s": graphene.Field(graphene.List(ResourceSchema)),
            "mutate": partial(
                lambda *args, mutations=None, **kwargs: mutate_bulk_create(*args, mutation=mutations["BulkCreateResource"], **kwargs),
                wkrm=wkrm,
                mutations=mutations
            )
        },
        arguments={
            "field_sets": graphene.List(ResourceInputObjectType),
            "do_index": graphene.Boolean(required=False, default=True)
        }
    )
    mutations["CreateResource"] = type(
        f"Create{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            snake(wkrm.model_class_name): graphene.Field(ResourceSchema),
            "mutate": partial(
                lambda *args, mutations=None, **kwargs: mutate_create(*args, mutation=mutations["CreateResource"], **kwargs),
                wkrm=wkrm,
                mutations=mutations
            )
        },
        arguments={
            field: typ for field, typ in _to_graphene_mut(wkrm)
        }
    )
    mutations["DeleteResource"] = type(
        f"Delete{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            "mutate": partial(
                lambda *args, mutations=None, **kwargs: mutate_delete(*args, mutation=mutations["DeleteResource"], **kwargs),
                wkrm=wkrm,
                mutations=mutations
            )
        },
        arguments={
            "id": graphene.UUID()
        }
    )
    _full_resource_mutation_methods.update({
        f"create_{snake(wkrm.model_class_name)}": mutations["CreateResource"].Field(),
        f"bulk_create_{snake(wkrm.model_class_name)}": mutations["BulkCreateResource"].Field(),
        f"delete_{snake(wkrm.model_class_name)}": mutations["DeleteResource"].Field()
    })

FullResourceMutation = type(
    "FullResourceMutation",
    (Mutation,),
    _full_resource_mutation_methods,
)

resources_schema = graphene.Schema(query=ResourceQuery, mutation=FullResourceMutation)
