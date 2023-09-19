from arches.app.functions.base import BaseFunction
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


def generate_license_number(resource_instance_id, attempts=0):
    license_graph_id = 'cc5da227-24e7-4088-bb83-a564c4331efd'
    total_licenses = Resource.objects.filter(
        graph_id=license_graph_id).count()
    two_digit_year = str(datetime.datetime.now().year)[-2:]
    license_number = f'AE/{two_digit_year}/{str(total_licenses).zfill(4)}'

    def retry():
        nonlocal license_number, attempts, resource_instance_id
        attempts += 1
        print(
            f'Failed creating license number because it already exists on another tile, license number: {license_number}')
        return generate_license_number(resource_instance_id, attempts)

    ext_ref_tile = None
    try:
        # Runs a query searching for an external reference tile with the new license ID
        ext_ref_tile = Tile.objects.filter(nodegroup_id='280b6cfc-4e4d-11ee-a340-0242ac140007',
                                           data__contains={
                                               '280b75bc-4e4d-11ee-a340-0242ac140007': {'en': {
                                                   'direction': 'ltr',
                                                   'value': license_number
                                               }},
                                               # Set external reference source as 'Excavation'
                                               '280b7a9e-4e4d-11ee-a340-0242ac140007': '9a383c95-b795-4d76-957a-39f84bcee49e'
                                           }).first()
    except Exception as e:
        print('Failed validating license number: ', e)
        return retry()

    if attempts >= 5:
        raise Exception(
            'After 5 attempts, it wasn\'t possible to generate a license number that was unique!')

    if ext_ref_tile:
        return retry()

    print(f'License number is unique, license number: {license_number}')
    return license_number


class LicenseNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        try:
            ext_ref_tile = Tile.objects.filter(resourceinstance_id=resource_instance_id,
                                               nodegroup_id='280b6cfc-4e4d-11ee-a340-0242ac140007').first()
        except Exception as e:
            print('Failed checking if license number tile already exists!')

        print('init check: ', ext_ref_tile)
        if ext_ref_tile:
            print('A license number has already been created for this license')
            return

        license_number = generate_license_number(resource_instance_id)

        # print('LicenseNumber: ', license_number)

        try:
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
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
                resourceinstance_id=resource_instance_id,
                nodegroup_id='59d65ec0-48b9-11ee-84da-0242ac140007',
                data={
                    '59d6676c-48b9-11ee-84da-0242ac140007': {'en': {
                        'direction': 'ltr',
                        'value': f'Excavation License {license_number}'
                    }}
                }
            )
        except Exception as e:
            print('Failed saving license name node: ', e)

        return
