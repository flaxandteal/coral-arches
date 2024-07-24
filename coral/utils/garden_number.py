from arches.app.models.tile import Tile
from django.db.models import Max
import logging

logger = logging.getLogger(__name__)

HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
GARDEN_NUMBER_NODE_ID = "2c2d02fc-3aae-11ef-91fd-0242ac120003"


class GardenNumber:
    def __init__(self, county_name):
        logger.info("Initialising GardenNumber")
        self.county_name = county_name

        self.county_abbreviation = None
        if not self.county_name:
            logger.error("County name is not provided")
            raise ValueError("County name is not provided")

        try:
            self.county_abbreviation = self.abbreviate_county(self.county_name)
        except ValueError as e:
            logger.error("Failed to abbreviate the county name: %s", e)
            raise

    def id_number_format(self, index):
        return f"{self.county_abbreviation}:{str(index).zfill(3)}"
    
    def abbreviate_county(self, name):
        abbreviations = {
            "Antrim": "ANT",
            "Armagh": "ARM",
            "Down": "DOW",
            "Fermanagh": "FER",
            "Londonderry": "LDY",
            "Tyron": "TYR"
        }
        abbreviation = abbreviations.get(name, None)
        if abbreviation is None:
            raise ValueError(f"Abbreviation for county name '{name}' not found")
        return abbreviation
        
    def get_latest_id_number(self, resource_instance_id=None):
        latest_id_number_tile = None
        try:
            id_number_generated = {
                f"data__{GARDEN_NUMBER_NODE_ID}__icontains": self.county_abbreviation,
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
            logger.error("Failed querying for previous ID number tile: %s", e)
            raise e

        if not latest_id_number_tile:
            return

        latest_id_number = (
            latest_id_number_tile.data.get(GARDEN_NUMBER_NODE_ID).get("en").get("value")
        )

        logger.info("Previous ID number: %s", latest_id_number)
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
                    f"data__{GARDEN_NUMBER_NODE_ID}__icontains": self.county_abbreviation
                }
                id_number_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                    **generated_id_query,
                ).first()
            except Exception as e:
                logger.error("Failed checking if ID number tile already exists: %s", e)
                return retry()

            if id_number_tile:
                logger.info("A ID number has already been created for this resource")
                return

        latest_id_number = None
        try:
            latest_id_number = self.get_latest_id_number(resource_instance_id)
        except Exception as e:
            print("Failed getting the previously used ID number: %s", e)
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

        logger.info("ID number is unique, ID number: %s", id_number)
        return id_number

    def validate_id(self, id_number):
        try:
            # Runs a query searching for an identical ID value
            id_number_tile = Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                data__contains={
                    GARDEN_NUMBER_NODE_ID: {"en": {"direction": "ltr", "value": id_number}}
                },
            ).first()
            if id_number_tile:
                return False
        except Exception as e:
            logger.error("Failed validating ID number: %s", e)
            return False
        return True
