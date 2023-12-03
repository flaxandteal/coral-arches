import logging

from arches.app.datatypes.base import BaseDataType
from arches.app.models.models import Widget
from arches.app.models.system_settings import settings
from django.contrib.auth.models import User

text = Widget.objects.get(name="user")

details = {
    "datatype": "user",
    "iconclass": "fa fa-location-arrow",
    "modulename": "user.py",
    "classname": "UserDataType",
    "defaultwidget": text,
    "defaultconfig": None,
    "configcomponent": None,
    "configname": None,
    "isgeometric": False,
    "issearchable": False,
}

logger = logging.getLogger(__name__)

class UserDataType(BaseDataType):
    def append_to_document(self, document, nodevalue, nodeid, tile, provisional=False):
        document["strings"].append({"string": nodevalue, "nodegroup_id": tile.nodegroup_id})

    def get_search_terms(self, nodevalue, nodeid=None):
        if nodevalue:
            user = User.objects.get(pk=int(nodevalue))
            return [user.email]
        return []

    def get_display_value(self, tile, node, **kwargs):
        if (user := self.get_user(tile, node)):
            return user.email
        return None

    def get_user(self, tile, node):
        data = self.get_tile_data(tile)
        if data:
            raw_value = data.get(str(node.nodeid))
            if raw_value is not None:
                user = User.objects.get(pk=int(raw_value))
                return user

    def compile_json(self, tile, node, **kwargs):
        json = super().compile_json(tile, node, **kwargs)
        data = self.get_tile_data(tile)
        if data:
            raw_value = data.get(str(node.nodeid))
            json["userId"] = int(raw_value)
        return json
