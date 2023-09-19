from arches.app.functions.base import BaseFunction
import logging
import uuid
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
import datetime

# ResourceInstance - arches/arches/app/models/models.py
# an example of post_save() - arches/arches/app/models/tile.py

details = {
    'functionid': 'e6bc8d3a-c0d6-434b-9a80-55ebb662dd0c',
    'name': 'License Number',
    'type': 'node',
    'description': 'Automatically generates a new license number after checking the database',
    'defaultconfig': {
        'triggering_nodegroups': ['991c3c74-48b6-11ee-85af-0242ac140007']
    },
    'classname': 'LicenseNumberFunction',
    'component': '',
}

class LicenseNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        license_graph_id = 'cc5da227-24e7-4088-bb83-a564c4331efd'
        total_licenses = Resource.objects.filter(graph_id=license_graph_id).count()
        two_digit_year = str(datetime.datetime.now().year)[-2:]
        license_number = f'AE/{two_digit_year}/{str(total_licenses).zfill(4)}'

        # print('LicenseNumber: ', license_number)

        resourceinstance_id = str(tile.resourceinstance.resourceinstanceid)

        try:
            Tile.objects.get_or_create(
                resourceinstance_id=resourceinstance_id,
                nodegroup_id='280b6cfc-4e4d-11ee-a340-0242ac140007',
                data={
                    '280b75bc-4e4d-11ee-a340-0242ac140007': {'en': {
                        'direction': 'ltr',
                        'value': license_number
                    }},
                    # Set external reference source as 'Excavation'
                    '280b7a9e-4e4d-11ee-a340-0242ac140007': '9a383c95-b795-4d76-957a-39f84bcee49e'
                }
            )
        except Exception as e:
            print('Failed saving license number external ref: ', e)

        try:
            Tile.objects.get_or_create(
                resourceinstance_id=resourceinstance_id,
                nodegroup_id='59d65ec0-48b9-11ee-84da-0242ac140007',
                data={
                    '59d6676c-48b9-11ee-84da-0242ac140007': { 'en': {
                        'direction': 'ltr',
                        'value': f'Excavation License {license_number}'
                    }}
                }
            )
        except Exception as e:
            print('Failed saving license name node: ', e)

        return
