from arches.app.datatypes.base import BaseDataType
from arches.app.models.models import Widget
from arches.app.models.system_settings import settings

tm65point = Widget.objects.get(name="tm65point")

details = {
    "datatype": "tm65centrepoint",
    "iconclass": "fa fa-location-arrow",
    "modulename": "tm65centrepoint.py",
    "classname": "TM65CentreDataType",
    "defaultwidget": tm65point,
    "defaultconfig": None,
    "configcomponent": None,
    "configname": None,
    "isgeometric": False,
    "issearchable": False,
}


class TM65CentreDataType(BaseDataType):
    def validate(self, value, row_number=None, source=None, node=None, nodeid=None, strict=False, request=None):

        errors = []
        gridSquareArray = [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "T",
            "U",
            "V",
            "W",
            "X",
            "Y",
            "Z"
        ]
        try:
            # CS - Validation for datatype.  Replicates functionality in widget which will be removed once datatype validation is fixed.
            firstCharacter = value[0:1]
            numberElement = value[1:]

            firstCharacter in gridSquareArray
            isinstance(int(numberElement), int)
            len(value) == 11
        except Exception:
            errors.append({"type": "ERROR", "message": "Issue with input data"})

        return errors

    def append_to_document(self, document, nodevalue, nodeid, tile, provisional=False):

        document["strings"].append({"string": nodevalue, "nodegroup_id": tile.nodegroup_id})

    def get_search_terms(self, nodevalue, nodeid=None):
        return [nodevalue]