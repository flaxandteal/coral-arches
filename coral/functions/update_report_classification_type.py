import uuid
from arches.app.functions.base import BaseFunction
from arches.app.models.system_settings import settings
from arches.app.models import models
from arches.app.models.tile import Tile
from coral.utils.reference_values import reference_value, selected_list_item_ids
from arches.app.models.resource import Resource
from django.contrib.gis.geos import GEOSGeometry
from django.db import connection, transaction
import json
from datetime import datetime
from celery import shared_task



details = {
    "name": "Update Report Classifcation Type",
    "type": "node",
    "description": "Updates the report classification status based on saves or edits to a licence's reports.",
    "defaultconfig": {"application_details_report_classification_node": "ff3de496-7117-11ef-83a1-0242ac120006", "report_classification_type_node": "8d13575c-dc70-11ee-8def-0242ac120006", 'report_classification_date_node': "ea6ea7a8-dc70-11ee-b70c-0242ac120006", "report_nodegroup": "f060583a-6120-11ee-9fd1-0242ac120003", "application_details_nodegroup": "4f0f655c-48cf-11ee-8e4e-0242ac140007", "triggering_nodegroups": ["f060583a-6120-11ee-9fd1-0242ac120003"]},
    "classname": "UpdateReportClassificationType",
    "component": "views/components/functions/update-report-classification-type",
    "functionid": "4c18f609-fe0d-4f4a-ba8c-70877f7ff3bc"
}


class UpdateReportClassificationType(BaseFunction):
    def get(self):
        raise NotImplementedError

    def save_report(self, tile, request, context):
        """Finds the appropriate classifcation based on report edits then updates the application details report classification node
        Args:
            self : UpdateReportClassificationType object.

            tile : Report Tile

            request : Request used to varify call is result of user action. N.B. Function Returns if empty.

            context : represents the context in which this function has been called.
        """
        if context and context.get('escape_function', False):
            return


        # Two separate controlled lists, Report Classification Type on the report tile and
        # Classification Type on the application details tile, with an item per name in
        # each. The maps translate between them.
        classification_map = {
            "application_details": {
                "not_received": "36218b55-7847-59eb-8033-5f2fa3d77da8",
                "received": "e0a253cd-e4c0-5f73-814a-377550b6bb33",
                "unclassified": "0d8b5c8e-c421-5fe7-8370-27e341e50b51",
                "summary": "b9af714f-5f44-5a2e-9cc5-83149bbb716e",
                "interim": "1e14b469-f4ef-51d6-a236-5b7a2f812417",
                "preliminary": "7eefa066-7eb3-51a5-bd64-2cc3a0fb3359",
                "final": "85b08591-c202-5ef2-9017-b56cc32dfefd"
            },
            "report_classification": {
                "0626c896-1cb1-52d6-ab2b-66b35d739962": "not_received",
                "9e4fce40-c2cd-5873-bf78-ee7219e0e93f": "received",
                "5597a6df-c707-5f98-953c-95eb37dbb3c3": "unclassified",
                "a47ccbbc-a58a-5c07-8506-75416abb699a": "summary",
                "15c4ee77-699c-5e92-ab30-2f5fc2b6ad8d": "interim",
                "1dbdc3aa-60f7-5c28-a5ff-35d586f5d6dd": "preliminary",
                "f8fd33af-9bc7-5834-9a3c-0014f6749d9e": "final"
            }
        }

        def classification_name(source_tile):
            """Which of the seven classifications a report tile carries, or None."""
            selected = selected_list_item_ids(source_tile.data.get(report_classification_type_node))
            names = classification_map["report_classification"]
            return next((names[item] for item in selected if item in names), None)

        application_details_report_classification_node = self.config["application_details_report_classification_node"]
        report_classification_type_node = self.config["report_classification_type_node"]
        report_classification_date_node = self.config["report_classification_date_node"]
        new_report_classification_type = tile.data[report_classification_type_node]

        try: 
            reportValue = tile.data[report_classification_type_node]
        except:
            return


        reportTiles = list(Tile.objects.filter(
                nodegroup_id=self.config["report_nodegroup"], resourceinstance_id=tile.resourceinstance_id
            ).exclude(tileid=tile.tileid))
        if not context['delete']:
            reportTiles.append(tile)
            
        applicationDetailsTile = Tile.objects.filter(
                nodegroup_id=self.config["application_details_nodegroup"], resourceinstance_id=tile.resourceinstance_id
            )

        def tileReportClassNode(tile):
            return tile.data[report_classification_date_node]

        reportTiles.sort(key=tileReportClassNode, reverse=True)

        if not len(reportTiles) > 0:
            name = "not_received"
        else:
            mostRecent = reportTiles[0]
            source = tile if str(mostRecent.tileid) == str(tile.tileid) else mostRecent
            name = classification_name(source) or "not_received"

        new_value = reference_value(classification_map["application_details"][name])
        
        applicationDetailsTile[0].update_node_value(
            application_details_report_classification_node, 
            new_value,
            applicationDetailsTile[0].tileid,
            applicationDetailsTile[0].nodegroup_id,
            request,
            applicationDetailsTile[0].resourceinstance_id
            )

    def save(self, tile, request, context=None):
        self.save_report(tile=tile, request=request, context={'escape_function': True, 'delete': False})
        return

    def post_save(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self, tile, request):
        self.save_report(tile=tile, request=request, context={'escape_function': True, 'delete': True})
        return

    def on_import(self, tile):
        self.save_report(tile=tile, request=None, context={'escape_function': False})
        return

    def after_function_save(self, tile, request):
        raise NotImplementedError
