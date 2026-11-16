from django.views.generic import View
from django.http import JsonResponse
from urllib.parse import parse_qs
from querysets_shim.adapter import admin
from coral.utils.reference_values import display_value


class ORM(View):
    def post(self, request):
        from querysets_shim.models import Monument
        from querysets_shim.values import EMPTY, values_by_resource

        data = parse_qs(request.body.decode())
        resourceid = data["resourceid"][0]
        aliases = data["show_nodes[]"]

        with admin():
            datatypes = {
                alias: node.datatype
                for alias, node in Monument._._node_objects_by_alias().items()
                if alias in aliases
            }
            values = values_by_resource(Monument, [resourceid], aliases).get(resourceid, EMPTY)
            response = {}
            for alias in aliases:
                texts = [display_value(v, datatypes.get(alias)) for v in values.all(alias)]
                response[alias] = [text for text in texts if text]

        return JsonResponse(response)
