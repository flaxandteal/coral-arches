from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
from datetime import datetime, timedelta
import calendar
import logging

logger = logging.getLogger(__name__)

details = {
    "functionid": "55499090-4a36-480d-b16c-df3fce976646",
    "name": "Add Time to Date",
    "type": "node",
    "description": "Add a set amount of time to a date node when another date node is updated",
    "defaultconfig": {
        "triggeringDateNode": "932dee8f-ebc8-57ea-bac3-18920b43f4a6",
        "updateDateNode": "345e7fda-7f62-5e55-8fed-85e68b13dade",
        "updateDateNodeGroup": "a5e15f5c-51a3-11eb-b240-f875a44e0e11",
        "amount": 21,
        "unit": 'days',
        "createMissingTile": False,
        "triggering_nodegroups": ["4b195f82-50eb-5030-9f82-acdd3f7ba6c9"]},
    "classname": "AddTimeToDate",
    "component": "",
}


class AddTimeToDate(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return
        
        triggeringDateNode = self.config["triggeringDateNode"]
        updateDateNode = self.config["updateDateNode"]
        updateDateNodeGroup = self.config["updateDateNodeGroup"]
        amount = self.config["amount"]
        unit = self.config["unit"]
        resourceinstance_id = tile.resourceinstance.resourceinstanceid

        triggering_date = tile.data.get(triggeringDateNode)
        if not triggering_date:
            return
        try:
            new_date = self.add_time_to_date(triggering_date, amount, unit)
            self.updateTile(resourceinstance_id, updateDateNodeGroup, updateDateNode, new_date)
            logger.info(f"Updated tile with new date: {new_date}")
        except Exception as e:
            logger.error(f"Error updating tile: {e}")

    def add_time_to_date(self, date_string, amount, unit):
        date = datetime.strptime(date_string, '%Y-%m-%d')
        if unit == 'months':
            month = date.month - 1 + amount
            year = date.year + month // 12
            month = month % 12 + 1
            day = min(date.day, calendar.monthrange(year,month)[1])
            return date.replace(year=year, month=month, day=day).strftime('%Y-%m-%d')
        elif unit == 'days':
            new_date = date + timedelta(days=amount)
            return new_date.strftime('%Y-%m-%d')


    def updateTile(self, resourceinstance_id, node_group_id, node_id, date):
        reference_tile = list(Tile.objects.filter(
            resourceinstance_id = resourceinstance_id,
            nodegroup_id = node_group_id
        ).order_by('sortorder', 'tileid'))
        
        if len(reference_tile) > 1:
            logger.warning(
                f"Resource {resourceinstance_id} has {len(reference_tile)} tiles for nodegroup {node_group_id}. Using the first one."
            )
            
        reference_tile = reference_tile[0] if reference_tile else None

        if not reference_tile:
            if not self.config.get("createMissingTile", False):
                logger.warning(
                    f"No tile found for resource {resourceinstance_id} and nodegroup {node_group_id}. Not creating a new tile."
                )
                return
            reference_tile = Tile.get_blank_tile_from_nodegroup_id(
                resourceid = resourceinstance_id,
                nodegroup_id = node_group_id
            )
        
        reference_tile.data[node_id] = date
        reference_tile.save()
