from arches.app.models.tile import Tile
from django.db.models import Max
import re


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
HB_NUMBER_NODE_ID = "250002fe-3aae-11ef-91fd-0242ac120003"


class HbNumber:
    ward_distict_text = ""

    def __init__(self, ward_distict_text):
        self.ward_distict_text = ward_distict_text

    def id_number_format(self, index):
        pattern = r"\(\d+/\d+\)"
        match = re.search(pattern, self.ward_distict_text)
        if not match:
            raise Exception(
                f"Provided {self.ward_distict_text} does not contain district or ward ID."
            )
        district_number, ward_number = match.group(0)[1:-1].split("/")
        return f"HB/{district_number}/{ward_number}/{str(index).zfill(3)}"

    def get_latest_id_number(self, resource_instance_id=None):
        latest_id_number_tile = None
        try:
            id_number_generated = {
                f"data__{HB_NUMBER_NODE_ID}__icontains": f"HB/",
            }
            query_result = Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                **id_number_generated,
            )
            if resource_instance_id:
                query_result.exclude(resourceinstance_id=resource_instance_id)
            query_result = query_result.annotate(
                most_recent=Max("resourceinstance__createdtime")
            )
            query_result = query_result.order_by("-most_recent")
            latest_id_number_tile = query_result.first()
        except Exception as e:
            print(f"Failed querying for previous ID number tile: {e}")
            raise e

        if not latest_id_number_tile:
            return

        latest_id_number = (
            latest_id_number_tile.data.get(HB_NUMBER_NODE_ID).get("en").get("value")
        )

        print(f"Previous ID number: {latest_id_number}")
        id_number_parts = latest_id_number.split("/")
        return {"index": int(id_number_parts[3])}

    def generate_id_number(self, resource_instance_id=None, attempts=0):
        if attempts >= 5:
            raise Exception(
                "After 5 attempts, it wasn't possible to generate an ID that was unique!"
            )

        def retry():
            nonlocal attempts, resource_instance_id
            attempts += 1
            return self.generate_id_number(resource_instance_id, attempts)

        if resource_instance_id:
            id_number_tile = None
            try:
                generated_id_query = {
                    f"data__{HB_NUMBER_NODE_ID}__icontains": self.ward_distict_text,
                }
                id_number_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                    **generated_id_query,
                ).first()
            except Exception as e:
                print(f"Failed checking if ID number tile already exists: {e}")
                return retry()

            if id_number_tile:
                print("A ID number has already been created for this resource")
                return

        latest_id_number = None
        try:
            latest_id_number = self.get_latest_id_number(resource_instance_id)
        except Exception as e:
            print(f"Failed getting the previously used ID number: {e}")
            return retry()

        if latest_id_number:
            next_number = latest_id_number["index"] + 1
            id_number = self.id_number_format(next_number)
        else:
            # If there is no latest resource to work from we know
            # this is the first ever created
            id_number = self.id_number_format(1)

        passed = self.validate_id(id_number)
        if not passed:
            return retry()

        print(f"ID number is unique, ID number: {id_number}")
        return id_number

    def validate_id(self, id_number):
        try:
            # Runs a query searching for an identical ID value
            id_number_tile = Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                data__contains={
                    HB_NUMBER_NODE_ID: {"en": {"direction": "ltr", "value": id_number}}
                },
            ).first()
            if id_number_tile:
                return False
        except Exception as e:
            print(f"Failed validating ID number: {e}")
            return False
        return True
