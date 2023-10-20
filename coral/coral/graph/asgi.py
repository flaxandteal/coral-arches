# MIT License
#
# Copyright (c) 2020 Taku Fukada, 2022 Phil Weir

import os
import threading
import asyncio
import django
import contextlib
from django.contrib.auth import authenticate
from asgiref.sync import sync_to_async
import binascii
import base64
import logging
from functools import partial
from datetime import datetime, date
import graphene

from starlette.authentication import (
    AuthCredentials, AuthenticationBackend, AuthenticationError, SimpleUser
)
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.responses import PlainTextResponse
from starlette.routing import Route
from starlette.endpoints import HTTPEndpoint
from starlette.responses import PlainTextResponse
from starlette_graphene3 import GraphQLApp, make_graphiql_handler
from starlette.applications import Starlette


from starlette_context import context, plugins
from starlette_context.middleware import RawContextMiddleware

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coral.settings')

from oauth2_provider.oauth2_backends import OAuthLibCore
from oauthlib.common import Request as OauthlibRequest

class App(HTTPEndpoint):
    async def get(self, request):
        return PlainTextResponse("OK")


class BasicAuthBackend(AuthenticationBackend):
    async def authenticate(self, conn):
        if "Authorization" not in conn.headers:
            # FIXME: for now, allow anonymous internal access
            return AuthCredentials(["anonymous"]), SimpleUser("anonymous")
            # raise AuthenticationError('Require basic auth credentials')

        auth = conn.headers["Authorization"]
        try:
            scheme, credentials = auth.split()
            if scheme.lower() != 'basic':
                raise AuthenticationError('Invalid basic auth credentials')

        except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
            print(exc)
            raise AuthenticationError('Invalid basic auth credentials')

        oauth_lib = OAuthLibCore()
        uri = conn.url.path
        oauth_request = OauthlibRequest(
                uri, "POST", b"", {"HTTP_AUTHORIZATION": conn.headers["Authorization"]}
        )
        if not await sync_to_async(oauth_lib.server.request_validator.authenticate_client)(oauth_request):
            raise AuthenticationError('Incorrect basic auth credentials')

        def get_user(request):
            return request.client.user
        user = await sync_to_async(get_user)(oauth_request)
        if user:
            context.data["user"] = user
            return AuthCredentials(["authenticated"]), SimpleUser(user.username)

        raise AuthenticationError('Incorrect basic auth credentials')



middleware = [
    Middleware(
        RawContextMiddleware,
        plugins=(
            plugins.RequestIdPlugin(),
            plugins.CorrelationIdPlugin()
        )
    ),
    Middleware(AuthenticationMiddleware, backend=BasicAuthBackend())
]

@contextlib.asynccontextmanager
async def lifespan(app):
    await sync_to_async(django.setup)()

    from .resources import ResourceQuery, FullResourceMutation
    from .concepts import ConceptQuery, FullConceptMutation
    from .resource_models import ResourceModelQuery

    resources_schema = graphene.Schema(query=ResourceQuery, mutation=FullResourceMutation)
    concept_schema = graphene.Schema(query=ConceptQuery, mutation=FullConceptMutation)
    resource_model_schema = graphene.Schema(query=ResourceModelQuery)

    app.mount("/resources/", GraphQLApp(resources_schema, on_get=make_graphiql_handler()))
    app.mount("/concepts/", GraphQLApp(concept_schema, on_get=make_graphiql_handler()))
    app.mount("/resource-models/", GraphQLApp(resource_model_schema, on_get=make_graphiql_handler()))
    yield

app = Starlette(debug=DEBUG, routes=[Route("/", App)], middleware=middleware)
