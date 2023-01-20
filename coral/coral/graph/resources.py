# MIT License
#
# Copyright (c) 2020 Taku Fukada, 2022 Phil Weir

import os
import threading
import asyncio
import django
import logging
from functools import partial
from datetime import datetime, date
from asgiref.sync import sync_to_async

from .utils import _convert, string_to_enum

import graphene
from graphene_file_upload.scalars import Upload

from starlette.applications import Starlette
from starlette_graphene3 import GraphQLApp, make_graphiql_handler

from aiodataloader import DataLoader
from coral.resource_model_wrappers import attempt_well_known_resource_model, _WELL_KNOWN_RESOURCE_MODELS, get_well_known_resource_model_by_class_name

from arches.app.models import models
from arches.app.models.concept import Concept
from arches.app.datatypes.concept_types import ConceptDataType, ConceptListDataType
import asyncio

from arches.app.datatypes.datatypes import DataTypeFactory

import slugify


def string_to_enum(string):
    return slugify.slugify(string.replace(" ", "-")).replace("-", " ").title().replace(" ", "")

class DataTypes:
    node_datatypes = None
    inited = False

    def __init__(self):
        self.collections = {}
        self.remapped = {}
        self.demapped = {}

    def demap(self, model, field, value):
        if value is None:
            return None
        if (closure := self.demapped.get((model, field), None)):
            return closure(value)
        return value

    def remap(self, model, field, value):
        if (closure := self.remapped.get((model, field), None)):
            return closure(value)
        return value

    def init(self):
        if not self.inited:
            self.node_datatypes = {str(nodeid): datatype for nodeid, datatype in models.Node.objects.values_list("nodeid", "datatype")}
            self.datatype_factory = DataTypeFactory()

        for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
            for field, info in wkrm.nodes.items():
                if "nodeid" in info:
                    # AGPL Arches
                    datatype = self.node_datatypes[info["nodeid"]]
                    datatype_instance = self.datatype_factory.get_instance(datatype)
                    if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
                        collection = Concept().get_child_collections(models.Node.objects.get(nodeid=info["nodeid"]).config["rdmCollection"])
                        self.collections[info["nodeid"]] = {
                            "forward": {f"{string_to_enum(field)}.{string_to_enum(label[1])}": label[2] for label in collection},
                            "back": {label[2]: string_to_enum(label[1]) for label in collection}
                        }
                        nodeid = info["nodeid"]
                        if isinstance(datatype_instance, ConceptListDataType):
                            self.remapped[(wkrm.model_name, field)] = lambda vs: list(map(self.collections[nodeid]["forward"].get, map(str, vs)))
                            self.demapped[(wkrm.model_name, field)] = lambda vs: list(map(self.collections[nodeid]["back"].get, map(str, vs)))
                        else:
                            self.remapped[(wkrm.model_name, field)] = lambda v: self.collections[nodeid]["forward"][str(v)]
                            self.demapped[(wkrm.model_name, field)] = lambda v: self.collections[nodeid]["back"][str(v)]

    def to_graphene_mut(self, info, field):
        if "type" in info:
            typ = info["type"]

            if typ == str:
                return graphene.String()
            elif typ == date:
                return graphene.String()
            elif typ == datetime:
                return graphene.String()
            elif typ == float:
                return graphene.Float()
            elif typ == int:
                return graphene.Int()
            elif isinstance(typ, str):
                return graphene.List(graphene.String())

        if "nodeid" in info:
            # AGPL Arches
            datatype = self.node_datatypes[info["nodeid"]]
            datatype_instance = self.datatype_factory.get_instance(datatype)
            if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
                collection = self.collections[info["nodeid"]]
                # We lose the conceptid here, so cannot spot duplicates, but the idea is
                # to restrict transfer to being human-readable.
                raw_type = graphene.Enum(string_to_enum(field), [
                    (value, n) for n, value in enumerate(collection["back"].values())
                ])
                return graphene.Argument(graphene.List(raw_type) if isinstance(datatype_instance, ConceptListDataType) else raw_type)

    def to_graphene(self, info, field):
        if "type" in info:
            typ = info["type"]

            if typ == str:
                return graphene.String()
            elif typ == date:
                return graphene.String()
            elif typ == datetime:
                return graphene.String()
            elif typ == float:
                return graphene.Float()
            elif typ == int:
                return graphene.Int()
            elif isinstance(typ, str):
                return graphene.List(lambda: _resource_model_schemas[typ])

        if "nodeid" in info:
            # AGPL Arches
            datatype = self.node_datatypes[info["nodeid"]]
            datatype_instance = self.datatype_factory.get_instance(datatype)
            if isinstance(datatype_instance, ConceptDataType) or isinstance(datatype_instance, ConceptListDataType):
                collection = self.collections[info["nodeid"]]
                # We lose the conceptid here, so cannot spot duplicates, but the idea is
                # to restrict transfer to being human-readable.
                raw_type = graphene.Enum(string_to_enum(field), [
                    (value, n) for n, value in enumerate(collection["back"].values())
                ])

                return graphene.List(raw_type) if isinstance(datatype_instance, ConceptListDataType) else raw_type

data_types = DataTypes()

# Do synchronous data retrieval of "constants". After this, we assume they are available.
thread = threading.Thread(target=data_types.init)
thread.start()
thread.join()

def _to_graphene(wkrm):
    fields = [("id", {"type": str})] + list(wkrm.nodes.items())
    for field, info in fields:
        typ = data_types.to_graphene(info, field)
        if typ:
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
                {field: mapper(getattr(wkrm, field, None)) for field, mapper in _resource_model_mappers[wkrm.name].items()}
            )
        return group

ri_loader = ResourceInstanceLoader()


def _convert(class_name):
    return class_name.lower()

_name_map = {
    _convert(wkrm.model_class_name): wkrm.model_class_name
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
    _full_resource_query_methods[_convert(wkrm.model_class_name)] = graphene.List(_resource_model_schemas[wkrm.model_class_name])
    _full_resource_query_methods[f"get_{_convert(wkrm.model_class_name)}"] = graphene.Field(_resource_model_schemas[wkrm.model_class_name], id=graphene.UUID(required=True))
    _full_resource_query_methods[f"search_{_convert(wkrm.model_class_name)}"] = graphene.List(_resource_model_schemas[wkrm.model_class_name], text=graphene.String(), fields=graphene.List(graphene.String))

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

_full_resource_mutation_methods = {}
for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
    async def mutate_bulk_create(parent, info, field_sets):
        resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
        field_sets = [{field: data_types.remap(wkrm.model_name, field, value) for field, value in field_set.items()} for field_set in field_sets]
        resources = await sync_to_async(resource_cls.create_bulk)(field_sets)
        ok = True
        kwargs = {
            _convert(wkrm.model_class_name) + "s": resources,
            "ok": ok
        }
        return BulkCreateResource(**kwargs)

    async def mutate_create(parent, info, **kwargs):
        resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
        kwargs = {field: data_types.remap(wkrm.model_name, field, value) for field, value in kwargs.items()}
        resource = await sync_to_async(resource_cls.create)(**kwargs)
        ok = True
        kwargs = {
            _convert(wkrm.model_class_name): resource,
            "ok": ok
        }
        return CreateResource(**kwargs)

    async def mutate_delete(parent, info, id):
        resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
        resource = await sync_to_async(resource_cls.find)(id)
        await sync_to_async(resource.delete)()
        ok = True
        kwargs = {
            "ok": ok
        }
        return DeleteResource(**kwargs)

    ResourceSchema = _resource_model_schemas[wkrm.model_class_name]
    ResourceInputObjectType = type(
        f"{wkrm.model_class_name}Input",
        (graphene.InputObjectType,),
        {
            field: typ for field, typ in ((field, data_types.to_graphene_mut(info, field)) for field, info in wkrm.nodes.items()) if typ
        }
    )
    BulkCreateResource = type(
        f"BulkCreate{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            _convert(wkrm.model_class_name) + "s": graphene.Field(graphene.List(ResourceSchema)),
            "mutate": lambda parent, info, **kwargs: mutate_bulk_create(parent, info, **kwargs)
        },
        arguments={
            "field_sets": graphene.List(ResourceInputObjectType),
        }
    )
    CreateResource = type(
        f"Create{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            _convert(wkrm.model_class_name): graphene.Field(ResourceSchema),
            "mutate": lambda parent, info, **kwargs: mutate_create(parent, info, **kwargs)
        },
        arguments={
            field: typ for field, typ in ((field, data_types.to_graphene_mut(info, field)) for field, info in wkrm.nodes.items()) if typ
        }
    )
    DeleteResource = type(
        f"Delete{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            "mutate": lambda parent, info, **kwargs: mutate_delete(parent, info, **kwargs)
        },
        arguments={
            "id": graphene.UUID()
        }
    )
    _full_resource_mutation_methods.update({
        f"create_{_convert(wkrm.model_class_name)}": CreateResource.Field(),
        f"bulk_create_{_convert(wkrm.model_class_name)}": BulkCreateResource.Field(),
        f"delete_{_convert(wkrm.model_class_name)}": DeleteResource.Field()
    })

FullResourceMutation = type(
    "FullResourceMutation",
    (Mutation,),
    _full_resource_mutation_methods,
)

resources_schema = graphene.Schema(query=ResourceQuery, mutation=FullResourceMutation)
