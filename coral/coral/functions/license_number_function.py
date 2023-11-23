from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
import datetime

# ResourceInstance - arches/arches/app/models/models.py
# an example of post_save() - arches/arches/app/models/tile.py

details = {
    "functionid": "e6bc8d3a-c0d6-434b-9a80-55ebb662dd0c",
    "name": "License Number",
    "type": "node",
    "description": "Automatically generates a new license number after checking the database",
    "defaultconfig": {
        "triggering_nodegroups": ["991c3c74-48b6-11ee-85af-0242ac140007"]
    },
    "classname": "LicenseNumberFunction",
    "component": "",
}

LICENSE_GRAPH_ID = "cc5da227-24e7-4088-bb83-a564c4331efd"

EXTERNAL_REF_NODEGROUP = "280b6cfc-4e4d-11ee-a340-0242ac140007"
EXTERNAL_REF_SOURCE_NODE = "280b7a9e-4e4d-11ee-a340-0242ac140007"
EXTERNAL_REF_NUMBER_NODE = "280b75bc-4e4d-11ee-a340-0242ac140007"
EXTERNAL_REF_NOTE_NODE = "280b78fa-4e4d-11ee-a340-0242ac140007"


def license_number_format(year, index):
    return f"AE/{year}/{str(index).zfill(2)}"


def get_latest_license_number(license_instance_id):
    latest_license = None
    try:
        latest_license = (
            Resource.objects.filter(graph_id=LICENSE_GRAPH_ID)
            .exclude(resourceinstanceid=license_instance_id)
            .latest("createdtime")
        )
    except Resource.DoesNotExist:
        return

    resource_instance_id = str(latest_license.resourceinstanceid)
    latest_license_number_tile = Tile.objects.filter(
        resourceinstance_id=resource_instance_id,
        nodegroup_id=EXTERNAL_REF_NODEGROUP,
        data__contains={
            # Check external reference source for 'Excavation'
            EXTERNAL_REF_SOURCE_NODE: "9a383c95-b795-4d76-957a-39f84bcee49e"
        },
    ).first()

    license_number = (
        latest_license_number_tile.data.get(EXTERNAL_REF_NUMBER_NODE)
        .get("en")
        .get("value")
        .split("/")
    )
    return {"year": license_number[1], "index": int(license_number[2])}


def generate_license_number(license_instance_id, attempts=0):
    if attempts >= 5:
        raise Exception(
            "After 5 attempts, it wasn't possible to generate a license number that was unique!"
        )

    def retry():
        nonlocal attempts, license_instance_id
        attempts += 1
        return generate_license_number(license_instance_id, attempts)

    ext_ref_tile = None
    try:
        ext_ref_tile = Tile.objects.filter(
            resourceinstance_id=license_instance_id, nodegroup_id=EXTERNAL_REF_NODEGROUP
        ).first()
    except Exception as e:
        print("Failed checking if license number tile already exists!")
        return retry()

    if ext_ref_tile:
        print("A license number has already been created for this license")
        return

    latest_license_number = None
    try:
        latest_license_number = get_latest_license_number(license_instance_id)
    except Exception as e:
        print("Failed getting the previously used license number: ", e)
        return retry()

    year = str(datetime.datetime.now().year)
    if latest_license_number:
        if latest_license_number["year"] != year:
            # If we are on a new year then we reset back to 1
            license_number = license_number_format(year, 1)
        else:
            # Otherwise we calculate the next number based on the latest
            next_number = latest_license_number["index"] + 1
            license_number = license_number_format(year, next_number)
    else:
        # If there is no latest license to work from we know
        # this is the first ever created
        license_number = license_number_format(year, 1)

    ext_ref_tile = None
    try:
        # Runs a query searching for an external reference tile with the new license ID
        ext_ref_tile = Tile.objects.filter(
            nodegroup_id=EXTERNAL_REF_NODEGROUP,
            data__contains={
                EXTERNAL_REF_NUMBER_NODE: {
                    "en": {"direction": "ltr", "value": license_number}
                },
                # Check external reference source for 'Excavation'
                EXTERNAL_REF_SOURCE_NODE: "9a383c95-b795-4d76-957a-39f84bcee49e",
            },
        ).first()
    except Exception as e:
        print("Failed validating license number: ", e)
        return retry()

    if ext_ref_tile:
        return retry()

    print(f"License number is unique, license number: {license_number}")
    return license_number


class LicenseNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        license_number = generate_license_number(resource_instance_id)

        if not license_number:
            return

        try:
            # Configure the license number
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=EXTERNAL_REF_NODEGROUP,
                data={
                    EXTERNAL_REF_NUMBER_NODE: {
                        "en": {"direction": "ltr", "value": license_number}
                    },
                    # Set external reference source as 'Excavation'
                    EXTERNAL_REF_SOURCE_NODE: "9a383c95-b795-4d76-957a-39f84bcee49e",
                    # Set empty value for rich text widget
                    EXTERNAL_REF_NOTE_NODE: {"en": {"value": "", "direction": "ltr"}},
                },
            )
            # Configure the license name with the number included
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id="59d65ec0-48b9-11ee-84da-0242ac140007",
                data={
                    "59d6676c-48b9-11ee-84da-0242ac140007": {
                        "en": {
                            "direction": "ltr",
                            "value": f"Excavation License {license_number}",
                        }
                    }
                },
            )
        except Exception as e:
            print("Failed saving license number external ref or license name: ", e)
            raise e

        return
