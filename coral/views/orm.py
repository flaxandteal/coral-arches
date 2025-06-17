from django.views.generic import View
from django.http import JsonResponse
from urllib.parse import parse_qs
from uuid import UUID
import arches_orm
import requests
import json 
from django.urls import reverse


# Function to get nested attributes from an object using a string path
# Example: location_data.addresses.0.street.street_value  0 being list index
def multi_getattr(obj, attr, default=None):
    attributes = attr.split(".")
    for i in attributes:
        try:
            idx = int(i)
            obj = obj[idx]
        except (ValueError, TypeError):
            try:
                obj = getattr(obj, i)
            except AttributeError:
                if default is not None:
                    return default
                else:
                    raise
        except (IndexError, KeyError):
            if default is not None:
                return default
            else:
                raise
    return obj


class ORM(View):
    def post(self, request):
        data = parse_qs(request.body.decode())
        graphid = data["graphid"][0]
        resourceid = data["resourceid"][0]

        wkrm = arches_orm.wkrm.get_resource_models_for_adapter("arches-django")["by-graph-id"][str(graphid)]
        wkri = wkrm.find(str(resourceid))

        response = {}
        for node in data["show_nodes[]"]:
            try:
                response[node] = str(multi_getattr(wkri, node, ""))

            except:
                response[node] = ""
            
            try:
                UUID(str(wkri._._values_list[node][0]).replace('{', '').replace('}', ''))

                nodeid = str(wkri._._values_list[node][0].node.nodeid)
                request = requests.get(request.build_absolute_uri(reverse('api_nodes',args=[nodeid])))
                request_response = json.loads(request.text)
                response[node] = [option for option in request_response[0]["config"]["options"] if option["id"] == str(wkri._._values_list[node][0]).replace('{', '').replace('}', '')][0]["text"]

            except Exception as e:
                print(e)
        return JsonResponse(dict(response))
    
