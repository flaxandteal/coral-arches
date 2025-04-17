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
        "triggeringDateNode": "04494bbe-c769-11ee-82c4-0242ac180006",
        "updateDateNode": "06adec44-69b7-11ee-908a-0242ac120002",
        "updateDateNodeGroup": "a5e15f5c-51a3-11eb-b240-f875a44e0e11",
        "amount": 21,
        "unit": 'days',
        "triggering_nodegroups": ["04492152-c769-11ee-82c4-0242ac180006"]},
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

        new_date = self.add_time_to_date(tile.data[triggeringDateNode], amount, unit)
        try:
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
            return datetime.date(day, month, year)
        elif unit == 'days':
            new_date = date + timedelta(days=amount)
            return new_date.strftime('%Y-%m-%d')


    def updateTile(self, resourceinstance_id, node_group_id, node_id, date):
        reference_tile = Tile.objects.filter(
            resourceinstance_id = resourceinstance_id,
            nodegroup_id = node_group_id
        ).first()

        if not reference_tile:
            reference_tile = Tile.get_blank_tile_from_nodegroup_id(
                resourceid = resourceinstance_id,
                nodegroup_id = node_group_id
            )
        
        
        reference_tile.data[node_id] = date
        reference_tile.save()
