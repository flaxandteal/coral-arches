import uuid
from django.core.exceptions import ValidationError
from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.tile import Tile
import json

details = {
    "functionid": "e6bc8d3a-c0d6-434b-9a80-55ebb662dd0c",
    "name": "License Number Function",
    "type": "node",
    "description": "Automatically generates a new license number after checking the database",
    "defaultconfig": {"triggering_nodegroups": []},
    "classname": "LicenseNumber",
    "component": "views/components/functions/license-number-function",
}


class LicenseNumber(BaseFunction):
    def save(self, tile, request):
        print("LicenseNumber running before tile save")

    def post_save(self, tile, request):
        print("LicenseNumber running after tile save")

    def on_import(self, tile, request):
        print("LicenseNumber calling on import")

    def get(self, tile, request):
        print("LicenseNumber calling get")

    def delete(self, tile, request):
        print("LicenseNumber calling delete")
