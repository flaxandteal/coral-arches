import uuid
import json
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.datatypes.datatypes import DataTypeFactory
from arches.app.functions.primary_descriptors import AbstractPrimaryDescriptorsFunction
from django.utils.translation import gettext as _
import logging 

logger = logging.getLogger(__name__)

details = {
    'name': 'Multi Nodegroup Descriptors',
    'type': 'primarydescriptors',
    'description': 'Updates the description strings for name, description and map popup allowing multiple nodegroups to be used in one string',
    'defaultconfig': {
            "descriptor_types": {
                "name": {
                "nodes": [],
                "string_template": ""
                },
                "map_popup": {
                "nodes": [],
                "string_template": ""
                },
                "description": {
                "nodes": [],
                "string_template": ""
                }
            }

        },
    'classname': 'MultiNodegroupDescriptorFunction',
    'component': 'views/components/functions/multi-group-descriptors',
    'functionid':'2199ec8c-59df-459e-b8d6-ec5431bdaa0e'
}

class MultiNodegroupDescriptorFunction(AbstractPrimaryDescriptorsFunction): 
    def get_primary_descriptor_from_nodes(self, resource, config, context=None, descriptor=None):
        """
        Arguments:
        resource -- the resource instance to which the primary decriptor will be assigned
        config -- the descriptor config which indicates how and what will define the descriptor

        Keyword Arguments:
        context -- string such as "copy" to indicate conditions under which a resource participates in a function.
        descriptor -- type of descriptor, e.g. "name", "map_popup", or "description"
        """

        datatype_factory = None
        language = context['language'] if (context is not None and 'language' in context) else None
        result = config["string_template"]
        print("CONFIG", config)
        updated = False
        tile_cache = {}
        node_cache = {}
        nodes = config["nodes"]

        try:
            for config in nodes:
                if context:
                    tile = context.get('tile')
                print("HERE2", tile, config)
                if not tile or tile.sortorder != 0:
                    print("ID", config['nodegroupId'], resource.resourceinstanceid)
                    tile = tile_cache.get(config["nodegroupId"], None)
                    if not tile:
                        tile = models.TileModel.objects.filter(nodegroup_id=uuid.UUID(config["nodegroupId"])).filter(
                            resourceinstance_id=resource.resourceinstanceid
                        ).order_by('sortorder').first()
                        print("MY TILE", tile)
                        tile_cache[config["nodegroupId"]] = tile

                node_list = node_cache.get(config["nodegroupId"], None)
                print("HERE3", node_list)
                if not node_list:
                    node_list = models.Node.objects.filter(nodegroup_id=uuid.UUID(config["nodegroupId"]))
                    node_cache[config["nodegroupId"]] = node_list
                print("wwwwwwwwwwwwwwwwwwwwwwwww", tile)
                if not tile:
                    continue
                print('4444444444444444444444444444444')

                for node in node_list:
                    data = {}
                    if tile.data and len(list(tile.data.keys())) > 0:
                        data = tile.data
                    elif tile.provisionaledits is not None and len(list(tile.provisionaledits.keys())) == 1:
                        userid = list(tile.provisionaledits.keys())[0]
                        data = tile.provisionaledits[userid]["value"]
                    print("DDDDDDDDDDDDD", data)
                    if str(node.nodeid) in data:
                        if not datatype_factory:
                            datatype_factory = DataTypeFactory()
                        datatype = datatype_factory.get_instance(node.datatype)
                        value = datatype.get_display_value(tile, node, language=language)
                        if value is None:
                            value = ""
                        if str(node.nodeid) == config["nodeId"]:
                            print("addding STRING", config)
                            config["result"] = value
                            print("AAAHHHHH", config["result"])

            for node_config in nodes:
                if "result" in node_config:
                    print("5555555", config)
                    # placeholder = "<" + node_config["value"] + ">"
                    result = result.replace(config["nodeString"], node_config["result"])
                    print("RREESSUULLLTT", result)
                    updated = True
                    
        except ValueError:
            logger.error(_("Invalid nodegroupid, {0}, participating in descriptor function.").format(config["nodegroup_id"]))
        if result.strip() == "":
            result = _("Undefined")
        if not updated:
            try:
                result = resource.descriptors[language][descriptor]
            except KeyError:
                pass
        print("IN THE RESULT", result)
        return result