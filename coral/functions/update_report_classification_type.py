import uuid
from arches.app.functions.base import BaseFunction
from arches.app.models.system_settings import settings
from arches.app.models import models
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.contrib.gis.geos import GEOSGeometry
from django.db import connection, transaction
import json
from datetime import datetime


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
        if context and not context['escape_function']:
            return


        classification_map = {
            "application_details": {
                "not_received": "d33327e8-2b9d-4bab-a07e-f0ded18ded3e",
                "received": "2ae813e1-bff3-449d-9af1-3e2f6fbc3fce",
                "unclassified": "a3f95287-4817-4f04-a615-13012eae3169",
                "summary": "cb90cecc-8854-426f-9bcd-404da1b54ce7",
                "interim": "0e07f77f-761a-4d05-898c-4332a1b24e38",
                "preliminary": "98ec8bd3-6f7c-44ea-a157-8d72c78b0bea",
                "final": "4c9d7ed0-b92b-4173-b0a6-fc70254519a0"
            },
            "report_classification": {
                "c911706e-9015-4a4b-9e99-dd97ee04975d": "not_received",
                "5ba75505-e195-4625-bfb4-4e9a8615b61b": "received",
                "103b86ec-2324-4752-82a4-e3bd6df44be5": "unclassified",
                "31423973-518d-480f-8ad1-0bfb7812d16a": "summary",
                "3e73773f-8adf-44dd-a4da-3310bf5d238a": "interim",
                "8ab4d066-3989-49ad-903b-72703e2ccdac": "preliminary",
                "b82a7d0d-b446-4aff-b3ac-b6d5121fb5d0": "final"
            }
        }

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
        else:
            print("UPDATE CLASSIFICATION xxxx", len(reportTiles))
            
        applicationDetailsTile = Tile.objects.filter(
                nodegroup_id=self.config["application_details_nodegroup"], resourceinstance_id=tile.resourceinstance_id
            )

        def tileReportClassNode(tile):
            return tile.data[report_classification_date_node]

        reportTiles.sort(key=tileReportClassNode, reverse=True)

        if not len(reportTiles) > 0:
            new_value = str(classification_map["application_details"]["not_received"])
        else:
            mostRecent = reportTiles[0]
            new_value = str(classification_map["application_details"][classification_map["report_classification"][mostRecent.data[report_classification_type_node]]])
            if str(mostRecent.tileid) == str(tile.tileid):
                new_value = str(classification_map["application_details"][classification_map["report_classification"][tile.data[report_classification_type_node]]])
            else:
                new_value = str(classification_map["application_details"][classification_map["report_classification"][mostRecent.data[report_classification_type_node]]])
        
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
