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
import graphene
from starlette.routing import Route
from starlette.endpoints import HTTPEndpoint
from starlette.responses import PlainTextResponse
from starlette_graphene3 import GraphQLApp, make_graphiql_handler
from starlette.applications import Starlette

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coral.settings')
django.setup()

from .resources import ResourceQuery, FullResourceMutation
from .concepts import ConceptQuery, FullConceptMutation
from .resource_models import ResourceModelQuery

resources_schema = graphene.Schema(query=ResourceQuery, mutation=FullResourceMutation)
concept_schema = graphene.Schema(query=ConceptQuery, mutation=FullConceptMutation)
resource_model_schema = graphene.Schema(query=ResourceModelQuery)

class App(HTTPEndpoint):
    async def get(self, request):
        return PlainTextResponse("OK")

app = Starlette(debug=DEBUG, routes=[Route("/", App)])
app.mount("/resources/", GraphQLApp(resources_schema, on_get=make_graphiql_handler()))
app.mount("/concepts/", GraphQLApp(concept_schema, on_get=make_graphiql_handler()))
app.mount("/resource-models/", GraphQLApp(resource_model_schema, on_get=make_graphiql_handler()))
