from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
import datetime
import json
from django.db.models import Max

print("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=LICENCE FUNCTION UPDATE V1=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
LICENSE_GRAPH_ID = "cc5da227-24e7-4088-bb83-a564c4331efd"

LICENSE_NAME_NODEGROUP = "59d65ec0-48b9-11ee-84da-0242ac140007"
LICENSE_NAME_NODE = "59d6676c-48b9-11ee-84da-0242ac140007"

LICENSE_NUMBER_NODEGROUP = "6de3741e-c502-11ee-86cf-0242ac180006"
LICENSE_NUMBER_NODE = "9a9e198c-c502-11ee-af34-0242ac180006"

SYSTEM_REF_NODEGROUP = "991c3c74-48b6-11ee-85af-0242ac140007"
SYSTEM_REF_RESOURCE_ID_NODE = "991c49b2-48b6-11ee-85af-0242ac140007"

STATUS_NODEGROUP = "4f0f655c-48cf-11ee-8e4e-0242ac140007"
STATUS_NODE = "a79fedae-bad5-11ee-900d-0242ac180006"
STATUS_FINAL_VALUE = "8c454982-c470-437d-a9c6-87460b07b3d9"

CUR_D_DECISION_NODEGROUP = "c9f504b4-c42d-11ee-94bf-0242ac180006"
CUR_D_DECISION_NODE = "2a5151f0-c42e-11ee-94bf-0242ac180006"
CUR_D_DECISION_APPROVED_VALUE = "0c888ace-b068-470a-91cb-9e5f57c660b4"

ASSOCIATED_ACTIVIY_NODEGROUP = "a9f53f00-48b6-11ee-85af-0242ac140007"
ASSOCIATED_ACTIVIY_NODE = "a9f53f00-48b6-11ee-85af-0242ac140007"

LICENSE_NUMBER_PREFIX = "AE"

details = {
    "functionid": "e6bc8d3a-c0d6-434b-9a80-55ebb662dd0c",
    "name": "License Number",
    "type": "node",
    "description": "Automatically generates a new licence number after checking the database",
    "defaultconfig": {
        "triggering_nodegroups": [SYSTEM_REF_NODEGROUP, STATUS_NODEGROUP, CUR_D_DECISION_NODEGROUP]
    },
    "classname": "LicenseNumberFunction",
    "component": "",
}


def licence_number_format(year, index):
    return f"{LICENSE_NUMBER_PREFIX}/{year}/{str(index).zfill(2)}"


def get_latest_licence_number(licence_instance_id):
    latest_licence_number_tile = None
    try:
        licence_number_generated = {
            f"data__{LICENSE_NUMBER_NODE}__en__value__icontains": LICENSE_NUMBER_PREFIX,
        }
        query_result = Tile.objects.filter(
            nodegroup_id=LICENSE_NUMBER_NODEGROUP,
            **licence_number_generated,
        ).exclude(resourceinstance_id=licence_instance_id)
        query_result = query_result.annotate(
            most_recent=Max("resourceinstance__createdtime")
        )
        query_result = query_result.order_by("-most_recent")
        latest_licence_number_tile = query_result.first()
    except Exception as e:
        print(f"Failed querying for previous licence number tile: {e}")
        raise e

    if not latest_licence_number_tile:
        return

    latest_licence_number = (
        latest_licence_number_tile.data.get(LICENSE_NUMBER_NODE)
        .get("en")
        .get("value")
    )

    print(f"Previous licence number: {latest_licence_number}")
    licence_number_parts = latest_licence_number.split("/")
    return {"year": licence_number_parts[1], "index": int(licence_number_parts[2])}


def generate_licence_number(licence_instance_id, attempts=0):
    if attempts >= 5:
        raise Exception(
            "After 5 attempts, it wasn't possible to generate a licence number that was unique!"
        )

    def retry():
        nonlocal attempts, licence_instance_id
        attempts += 1
        return generate_licence_number(licence_instance_id, attempts)

    licence_number_tile = None
    try:
        licence_number_generated = {
            f"data__{LICENSE_NUMBER_NODE}__en__value__icontains": LICENSE_NUMBER_PREFIX,
        }
        licence_number_tile = Tile.objects.filter(
            resourceinstance_id=licence_instance_id,
            nodegroup_id=LICENSE_NUMBER_NODEGROUP,
            **licence_number_generated
        ).first()
    except Exception as e:
        print(f"Failed checking if licence number tile already exists: {e}")
        return retry()

    if licence_number_tile:
        print("A licence number has already been created for this licence")
        return

    latest_licence_number = None
    try:
        latest_licence_number = get_latest_licence_number(licence_instance_id)
    except Exception as e:
        print(f"Failed getting the previously used licence number: {e}")
        return retry()

    year = str(datetime.datetime.now().year)
    if latest_licence_number:
        if latest_licence_number["year"] != year:
            # If we are on a new year then we reset back to 1
            licence_number = licence_number_format(year, 1)
        else:
            # Otherwise we calculate the next number based on the latest
            next_number = latest_licence_number["index"] + 1
            licence_number = licence_number_format(year, next_number)
    else:
        # If there is no latest licence to work from we know
        # this is the first ever created
        licence_number = licence_number_format(year, 1)

    licence_number_tile = None
    try:
        # Runs a query searching for an external reference tile with the new licence ID
        licence_number_tile = Tile.objects.filter(
            nodegroup_id=LICENSE_NUMBER_NODEGROUP,
            data__contains={
                LICENSE_NUMBER_NODE: {
                    "en": {"direction": "ltr", "value": licence_number}
                }
            },
        ).first()
    except Exception as e:
        print(f"Failed validating licence number: {e}")
        return retry()

    if licence_number_tile:
        return retry()

    print(f"License number is unique, licence number: {licence_number}")
    return licence_number


class LicenseNumberFunction(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        tile_nodegroup_id = str(tile.nodegroup.nodegroupid)

        if tile_nodegroup_id == ASSOCIATED_ACTIVIY_NODEGROUP:
            print("HEY I FOUND ALL OF THE ASSOCIATED ACTIVITIES!")
            print(tile)
            print(json.dumps(vars(tile))
)
        if tile_nodegroup_id == SYSTEM_REF_NODEGROUP:
            status_tile = None
            try:
                status_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=STATUS_NODEGROUP,
                ).first()
            except Resource.DoesNotExist:
                status_tile = None

            if not status_tile:
                app_id = (
                    tile.data.get(SYSTEM_REF_RESOURCE_ID_NODE).get("en").get("value")
                )
                # Set the licese name to use the app id
                Tile.objects.get_or_create(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=LICENSE_NAME_NODEGROUP,
                    data={
                        LICENSE_NAME_NODE: {
                            "en": {
                                "direction": "ltr",
                                "value": f"Excavation License {app_id}",
                            }
                        }
                    },
                )
                return

        if tile_nodegroup_id == STATUS_NODEGROUP:
            if tile.data.get(STATUS_NODE) != STATUS_FINAL_VALUE:
                return
            try:
                cur_d_tile = Tile.objects.get(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=CUR_D_DECISION_NODEGROUP,
                )
                if cur_d_tile.data.get(CUR_D_DECISION_NODE) != CUR_D_DECISION_APPROVED_VALUE:
                    return
            except Tile.DoesNotExist:
                return
            
        if tile_nodegroup_id == CUR_D_DECISION_NODEGROUP:
            if tile.data.get(CUR_D_DECISION_NODE) != CUR_D_DECISION_APPROVED_VALUE:
                return
            try:
                status_tile = Tile.objects.get(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=STATUS_NODEGROUP,
                )
                if status_tile.data.get(STATUS_NODE) != STATUS_FINAL_VALUE:
                    return
            except Tile.DoesNotExist:
                return

        licence_number = generate_licence_number(resource_instance_id)

        if not licence_number:
            return

        try:
            # Configure the licence number
            Tile.objects.get_or_create(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=LICENSE_NUMBER_NODEGROUP,
                data={
                    LICENSE_NUMBER_NODE: {
                        "en": {"direction": "ltr", "value": licence_number}
                    },
                },
            )
            # Configure the licence name with the licence number included
            licence_name_tile = Tile.objects.get(
                resourceinstance_id=resource_instance_id,
                nodegroup_id=LICENSE_NAME_NODEGROUP,
            )
            licence_name_tile.data[LICENSE_NAME_NODE]["en"][
                "value"
            ] = f"Excavation License {licence_number}"
            licence_name_tile.save()
        except Exception as e:
            print(f"Failed saving licence number external ref or licence name: {e}")
            raise e

        return