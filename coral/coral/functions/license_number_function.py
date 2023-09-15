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
        'ext_cross_ref_nodegroup': '280b6cfc-4e4d-11ee-a340-0242ac140007',
        'license_number_node': '280b75bc-4e4d-11ee-a340-0242ac140007',
        'triggering_nodegroups': ['59d65ec0-48b9-11ee-84da-0242ac140007']
    },
    'classname': 'LicenseNumberFunction',
    'component': '',
}

# TODO: Number should only be generated once
# TODO: Number should be validated


class LicenseNumberFunction(BaseFunction):
    def save(self, tile, request, context):
        logger = logging.getLogger(__name__)
        logger.warning('********** LicenseNumber running before tile save')
        print('********** LicenseNumber running before tile save: ', tile)

    def post_save(self, tile, request, context):
        logger = logging.getLogger(__name__)
        logger.warning('********** LicenseNumber running after tile save')
        print('********** LicenseNumber running after tile save')

        license_graph_id = 'cc5da227-24e7-4088-bb83-a564c4331efd'
        total_licenses = Resource.objects.filter(
            graph_id=license_graph_id).count()
        two_digit_year = str(datetime.datetime.now().year)[-2:]
        license_number = f'AE/{two_digit_year}/{str(total_licenses).zfill(4)}'

        print('LicenseNumber result: ', license_number)

        resourceinstance_id = str(tile.resourceinstance.resourceinstanceid)
        ext_cross_ref_tile, created = Tile.objects.get_or_create(
            # tileid=uuid.uuid4(),
            resourceinstance_id=resourceinstance_id,
            nodegroup_id='280b6cfc-4e4d-11ee-a340-0242ac140007',
            defaults={
                'data': {'280b75bc-4e4d-11ee-a340-0242ac140007': {'en': {
                    'direction': 'ltr',
                    'value': license_number
                }}}
            }
        )

        if not created:
            print('LicenseNumber Created was false')
            # try:
            #     ext_cross_ref_tile.data = {'280b75bc-4e4d-11ee-a340-0242ac140007': {'en': {
            #         'direction': 'ltr',
            #         'value': license_number
            #     }}}
            # except Exception as e:
            #     print('tile.data assignment error: ', e)
            # try:
            #     ext_cross_ref_tile.save(request=request)
            # except Exception as e:
            #     print('tile.save error: ',e)

        # try:
        #     ext_cross_ref_tile.save(request=request)
        # except Exception as e:
        #     print('tile.save error: ',e)

        return

    def on_import(self, tile, request):
        logger = logging.getLogger(__name__)
        logger.warning('********** LicenseNumber calling on import')
        print('********** LicenseNumber calling on import')

    def get(self, tile, request):
        logger = logging.getLogger(__name__)
        logger.warning('********** LicenseNumber calling get')
        print('********** LicenseNumber calling get')

    def delete(self, tile, request):
        logger = logging.getLogger(__name__)
        logger.warning('********** LicenseNumber calling delete')
        print('********** LicenseNumber calling delete')
