from django.views.generic import View
from django.http import JsonResponse
from urllib.parse import parse_qs
import arches_orm
from arches_orm.view_models.node_list import NodeListViewModel
from arches_orm.view_models import ConceptListValueViewModel

def multi_getattr(obj, attr, default=None):
    """
    Takes a string chain and gets the value attribute from the node
    Handles instances where NodeListViewModels are returned and does not need to be indexed in chain

    Args:
        obj (wkri): Arches orm well known resource instance where the data is being called from
        attr (str or list): a string or list of the nodes that need to be accessed for the data
    Returns:
        list: a list of the values from the nodes 
    """
    if isinstance(attr, str):
        attributes = attr.split(".")
    else:
        attributes = attr
    values = []
    for idx, i in enumerate(attributes):
        try:
            obj = getattr(obj, i)
            if isinstance(obj, NodeListViewModel):
                # TODO: should be handling multiple values but only seems to have one in when multiple tiles are present
                remaining_attr = attributes[idx + 1:]
                for tile in obj:
                    result = multi_getattr(tile, remaining_attr)
                    values.extend(result)
                return values
        except AttributeError:
            if default is not None:
                return default
            else:
                raise     
    return [obj]
class ORM(View):
    def handle_datatypes(self, data):
        """
        Handles the conversion of orm view models into their string value

        Args:
            data: Arches ORM datatype: The data to be converted, any Arches ORM data type can be passed

        Returns:
            str or list: string representation of the value of the node
        """
        if isinstance(data, ConceptListValueViewModel):
            values = []
            for concept in data:
                values.append(str(concept))
            return values
        return str(data)
            
    def post(self, request):
        data = parse_qs(request.body.decode())
        graphid = data["graphid"][0]
        resourceid = data["resourceid"][0]

        wkrm = arches_orm.wkrm.get_resource_models_for_adapter("arches-django")["by-graph-id"][str(graphid)]
        wkri = wkrm.find(str(resourceid))

        response = {}
        for node in data["show_nodes[]"]:
            output_values = []
            values = multi_getattr(wkri, node, "")
            for value in values:
                output_value = self.handle_datatypes(value)
                output_values.append(output_value)
            response[node] = output_values

        return JsonResponse(dict(response))
    
