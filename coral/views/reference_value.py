from django.views.generic import View
from arches.app.utils.response import JSONResponse
from coral.utils.reference_values import reference_value


class ReferenceValueView(View):
    """Resolve a controlled-list item id into a `reference` tile value.

    The frontend cannot build this shape itself - it needs the item's uri and label
    rows - so anywhere JS has only an item id (workflow prefills, defaults) it asks here.
    """

    def get(self, request, list_item_id):
        value = reference_value(list_item_id)
        if not value:
            return JSONResponse(
                {"message": f"No controlled list item '{list_item_id}'"}, status=404
            )
        return JSONResponse(value)
