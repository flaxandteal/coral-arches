# MIT License
#
# Copyright (c) 2020 Taku Fukada, 2022 Phil Weir

import os
import asyncio
import django
from asgiref.sync import sync_to_async

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coral.settings')
django.setup()

import graphene
from graphene_file_upload.scalars import Upload

from starlette.applications import Starlette
from starlette_graphene3 import GraphQLApp, make_graphiql_handler

from aiodataloader import DataLoader
from coral.resource_model_wrappers import attempt_well_known_resource_model, _WELL_KNOWN_RESOURCE_MODELS, get_well_known_resource_model_by_class_name

def _type_to_graphene(typ):
    if typ == str:
        return graphene.String()
    return graphene.List(lambda: _resource_model_schemas[typ])

def _type_to_graphene_mut(typ):
    if typ == str:
        return graphene.String()
    return graphene.List(graphene.String)

_resource_model_schemas = {
        wkrm.model_class_name: type(
            f"{wkrm.model_class_name}Schema",
            (graphene.ObjectType,),
            {field: _type_to_graphene(info["type"]) for field, info in ([("id", {"type": str})] + list(wkrm.nodes.items())) if "type" in info}
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
        return ret

ri_loader = ResourceInstanceLoader()


class User(graphene.ObjectType):
    id = graphene.ID()
    name = graphene.String()



class ProjectSchema(graphene.ObjectType):
    id = graphene.ID()
    basic_info_name = graphene.String()
    basic_info_language = graphene.String()
    description_statement = graphene.String()
    identifier = graphene.String()

class PersonSchema(graphene.ObjectType):
    id = graphene.ID()
    name = graphene.String()
    basic_info_name = graphene.String()
    statement_description = graphene.String()
    identifier = graphene.String()
    related_project = graphene.List(ProjectSchema)

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

_full_query_methods = {}
for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
    _full_query_methods[_convert(wkrm.model_class_name)] = graphene.List(_resource_model_schemas[wkrm.model_class_name])
    _full_query_methods[f"get_{_convert(wkrm.model_class_name)}"] = graphene.Field(_resource_model_schemas[wkrm.model_class_name], id=graphene.UUID(required=True))
    _full_query_methods[f"search_{_convert(wkrm.model_class_name)}"] = graphene.List(_resource_model_schemas[wkrm.model_class_name], text=graphene.String())

Query = type(
    "Query",
    (graphene.ObjectType,),
    _full_query_methods,
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

_full_mutation_methods = {}
for wkrm in _WELL_KNOWN_RESOURCE_MODELS:
    async def mutate_create(parent, info, **kwargs):
        resource_cls = get_well_known_resource_model_by_class_name(wkrm.model_class_name)
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
    CreateResource = type(
        f"Create{wkrm.model_class_name}",
        (graphene.Mutation,),
        {
            "ok": graphene.Boolean(),
            _convert(wkrm.model_class_name): graphene.Field(ResourceSchema),
            "mutate": lambda parent, info, **kwargs: mutate_create(parent, info, **kwargs)
        },
        arguments={
            field: _type_to_graphene_mut(info["type"]) for field, info in wkrm.nodes.items() if "type" in info
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
    _full_mutation_methods.update({
        f"create_{_convert(wkrm.model_class_name)}": CreateResource.Field(),
        f"delete_{_convert(wkrm.model_class_name)}": DeleteResource.Field()
    })

FullMutation = type(
    "FullMutation",
    (Mutation,),
    _full_mutation_methods,
)


app = Starlette(debug=DEBUG)
schema = graphene.Schema(query=Query, mutation=FullMutation)

app.mount("/", GraphQLApp(schema, on_get=make_graphiql_handler()))
