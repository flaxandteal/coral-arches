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
                    "template_1": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_2": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_3": {
                        "nodes": [],
                        "string_template": ""
                    },
                },
                "description": {
                    "template_1": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_2": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_3": {
                        "nodes": [],
                        "string_template": ""
                    },
                },
                "map_popup": {
                    "template_1": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_2": {
                        "nodes": [],
                        "string_template": ""
                    },
                    "template_3": {
                        "nodes": [],
                        "string_template": ""
                    },
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
        config_list = sorted(
            [
                {
                    "template_key": key,
                    "nodes": value["nodes"],
                    "string_template": value["string_template"]
                }
                for key, value in config.items()
                if value["nodes"] or value["string_template"].strip()
            ],
            key=lambda x: x["template_key"],
            reverse=True
        )
        
        tile_cache = {}
        node_cache = {}
        print("CONF", config_list)

        for template_index, template in enumerate(config_list):
            result = template["string_template"]
            nodes = template["nodes"]
            is_last_template = template_index == len(config_list) - 1
            has_empty_node = False

            try:
                for config_item in nodes:                   
                    if context:
                        tile = context.get('tile')
                    
                    if not tile or tile.sortorder != 0:
                        tile = tile_cache.get(config_item["nodegroupId"], None)
                        if not tile:
                            tile = models.TileModel.objects.filter(nodegroup_id=uuid.UUID(config_item["nodegroupId"])).filter(
                                resourceinstance_id=resource.resourceinstanceid
                            ).order_by('sortorder').first()
                            tile_cache[config_item["nodegroupId"]] = tile

                    node_list = node_cache.get(config_item["nodegroupId"], None)
                    if not node_list:
                        node_list = models.Node.objects.filter(nodegroup_id=uuid.UUID(config_item["nodegroupId"]))
                        node_cache[config_item["nodegroupId"]] = node_list
                    
                    if not tile:
                        if not is_last_template:
                            has_empty_node = True
                            break
                        else:
                            # Only set nodeString as result for last template when no tile
                            config_item["result"] = config_item["nodeString"]
                        continue

                    for node in node_list:
                        data = {}
                        if tile.data and len(list(tile.data.keys())) > 0:
                            data = tile.data
                        elif tile.provisionaledits is not None and len(list(tile.provisionaledits.keys())) == 1:
                            userid = list(tile.provisionaledits.keys())[0]
                            data = tile.provisionaledits[userid]["value"]
                        
                        if str(node.nodeid) in data:
                            if not datatype_factory:
                                datatype_factory = DataTypeFactory()
                            datatype = datatype_factory.get_instance(node.datatype)
                            value = datatype.get_display_value(tile, node, language=language)
                            
                            if str(node.nodeid) == config_item["nodeId"]:
                                if value is None or str(value).strip() == "":
                                    if not is_last_template:
                                        has_empty_node = True
                                        break
                                    else:
                                        config_item["result"] = config_item["nodeString"]
                                else:
                                    config_item["result"] = value
                        else:
                            if str(node.nodeid) == config_item["nodeId"]:
                                if not is_last_template:
                                    has_empty_node = True
                                    break
                                else:
                                    config_item["result"] = config_item["nodeString"]

                # If we found an empty node and it's not the last template, skip to next template
                if has_empty_node and not is_last_template:
                    continue

                for node_config in nodes:
                    print("RESULT", node_config["result"])
                    if "result" in node_config:
                        result = result.replace(node_config["nodeString"], node_config["result"])
                
                return result

            except ValueError:
                logger.error(_("Invalid nodegroupid, {0}, participating in descriptor function.").format(config_item.get("nodegroupId", "unknown")))
                continue

        # Fallback if no template worked
        try:
            result = resource.descriptors[language][descriptor]
        except (KeyError, AttributeError):
            result = _("Undefined")
        
        return result