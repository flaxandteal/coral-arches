from django.views.generic import View
from django.http import JsonResponse
from urllib.parse import parse_qs
from querysets_shim.adapter import admin
from coral.utils.reference_values import display_value

RESOURCE_INSTANCE_DATATYPES = ("resource-instance", "resource-instance-list")


class ORM(View):
    def post(self, request):
        from querysets_shim.models import Monument
        from querysets_shim.values import EMPTY, descriptor_names, related_resource_ids, values_by_resource

        data = parse_qs(request.body.decode())
        many = "resourceids[]" in data
        resourceids = data["resourceids[]"] if many else [data["resourceid"][0]]
        aliases = data["show_nodes[]"]

        with admin():
            datatypes = {
                alias: node.datatype
                for alias, node in Monument._._node_objects_by_alias().items()
                if alias in aliases
            }
            all_values = values_by_resource(Monument, resourceids, aliases)
            related = {
                alias: {
                    target
                    for resourceid in resourceids
                    for v in all_values.get(resourceid, EMPTY).all(alias)
                    for target in related_resource_ids(v)
                }
                for alias in aliases
                if datatypes.get(alias) in RESOURCE_INSTANCE_DATATYPES
            }
            names = descriptor_names(set().union(*related.values()))

            def texts_for(values, alias):
                if alias not in related:
                    return [display_value(v, datatypes.get(alias)) for v in values.all(alias)]
                return [names.get(target) for v in values.all(alias) for target in related_resource_ids(v)]

            response = {}
            for resourceid in resourceids:
                values = all_values.get(resourceid, EMPTY)
                response[resourceid] = {
                    alias: [text for text in texts_for(values, alias) if text] for alias in aliases
                }

        return JsonResponse(response if many else response[resourceids[0]])
