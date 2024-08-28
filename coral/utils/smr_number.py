from arches.app.models.tile import Tile
from django.db.models import Max


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
SMR_NUMBER_NODE_ID = "158e1ed2-3aae-11ef-a2d0-0242ac120003"


class SmrNumber:
    map_sheet_id = ""

    def __init__(self, map_sheet_id):
        self.map_sheet_id = map_sheet_id

    def id_number_format(self, index):
        return f"{self.map_sheet_id}:{str(index).zfill(3)}"

    def get_latest_id_number(self, resource_instance_id=None):
        latest_id_number_tile = None
        try:
            id_number_generated = {
                f"data__{SMR_NUMBER_NODE_ID}__icontains": self.map_sheet_id,
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
            latest_id_number_tile.data.get(SMR_NUMBER_NODE_ID).get("en").get("value")
        )

        print(f"Previous ID number: {latest_id_number}")
        id_number_parts = latest_id_number.split(":")
        return {"index": int(id_number_parts[1])}

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
                    f"data__{SMR_NUMBER_NODE_ID}__icontains": self.map_sheet_id,
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

    def validate_id(self, id_number, resource_instance_id=None):
        try:
            data_query = {
                SMR_NUMBER_NODE_ID: {"en": {"direction": "ltr", "value": id_number}}
            }
            if isinstance(id_number, dict):
                data_query[SMR_NUMBER_NODE_ID] = id_number

            id_number_tile = Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                data__contains=data_query,
            ).exclude(resourceinstance_id=resource_instance_id).first()

            if id_number_tile:
                return False
        except Exception as e:
            print(f"Failed validating ID number: {e}")
            return False
        return True
