"""User data type for associating with models.

Datatype to extend possible node values to Django groups.
"""


import logging

from arches.app.datatypes.base import BaseDataType
from arches.app.models.models import Widget, Node
from arches.app.models.tile import Tile
from django.contrib.auth.models import Group

text: Widget = Widget.objects.get(name="django-group")

details: dict[str, str | Widget | bool | None] = {
    "datatype": "django-group",
    "iconclass": "fa fa-location-arrow",
    "modulename": "django_group.py",
    "classname": "DjangoGroupDataType",
    "defaultwidget": text,
    "defaultconfig": None,
    "configcomponent": None,
    "configname": None,
    "isgeometric": False,
    "issearchable": False,
}

logger: logging.Logger = logging.getLogger(__name__)

class DjangoGroupDataType(BaseDataType):
    """DataType for a Django Group."""

    def append_to_document(self, document, nodevalue, nodeid, tile, provisional=False):
        document["strings"].append(
            {"string": nodevalue, "nodegroup_id": tile.nodegroup_id}
        )

    def get_search_terms(self, nodevalue, nodeid=None):
        return []

    def get_display_value(self, tile, node, **kwargs):
        if (group := self.get_django_group(tile, node)):
            return django_group.name
        return None

    def get_django_group(self, tile: Tile, node: Node) -> Group:
        data = self.get_tile_data(tile)
        if data:
            raw_value = data.get(str(node.nodeid))
            if raw_value is not None:
                group = Group.objects.get(pk=int(raw_value))
                return group

    def compile_json(self, tile, node, **kwargs):
        json = super().compile_json(tile, node, **kwargs)
        data = self.get_tile_data(tile)
        if data:
            raw_value = data.get(str(node.nodeid))
            json["djangoGroupId"] = int(raw_value)
        return json
