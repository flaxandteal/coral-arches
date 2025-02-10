from django.views.generic import View
from django.http import JsonResponse
from urllib.parse import parse_qs
from uuid import UUID
import arches_orm
import requests
import json 
from django.urls import reverse


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
                if node in wkri._._values_list.keys():
                    response[node] = str(wkri._._values_list[node][0]).replace('{', '').replace('}', '')
                else:
                    response[node] = ""

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
    
