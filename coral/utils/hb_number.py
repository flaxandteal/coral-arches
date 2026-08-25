from arches.app.models.tile import Tile
from arches.app.models.models import EditLog
from django.db.models import Q
import re


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"
HB_NUMBER_NODE_ID = "4b9883ef-9aad-559a-bd84-e4bb7b94a358"


def localised_value(data):
    """Node values are `{"en": {"value": ...}}`, but older tiles hold a bare string."""
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        return data.get("en", {}).get("value")
    return None


def used_hb_numbers(prefix, resource_instance_id=None):
    """Every HB number starting with `prefix` that has ever been used.

    An HB number is never reassigned, so neither source is enough on its own: the
    tiles hold the live numbers but lose any whose resource was deleted, and the
    edit log keeps the deleted ones but is blank for bulk-imported tiles, which
    are written with a NULL `newvalue`.
    """
    tiles = Tile.objects.filter(
        nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
        **{f"data__{HB_NUMBER_NODE_ID}__en__value__startswith": prefix},
    )
    logs = EditLog.objects.filter(
        Q(**{f"newvalue__{HB_NUMBER_NODE_ID}__icontains": prefix})
        | Q(**{f"oldvalue__{HB_NUMBER_NODE_ID}__icontains": prefix}),
        nodegroupid=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
    )
    if resource_instance_id:
        tiles = tiles.exclude(resourceinstance_id=resource_instance_id)
        logs = logs.exclude(resourceinstanceid=str(resource_instance_id))

    numbers = set()
    for tile in tiles:
        numbers.add(localised_value(tile.data.get(HB_NUMBER_NODE_ID)))
    for log in logs:
        for value in (log.newvalue, log.oldvalue):
            number = localised_value((value or {}).get(HB_NUMBER_NODE_ID))
            if number:
                numbers.add(number)

    return {number for number in numbers if number and number.startswith(prefix)}


class HbNumber:
    ward_distict_text = ""

    def __init__(self, ward_distict_text):
        self.ward_distict_text = ward_distict_text

    def id_number_format(self, index):
        
        district_number, ward_number = self.parse_district_ward()
        return f"HB{district_number}/{ward_number}/{str(index).zfill(3)}"
    
    def parse_district_ward(self):
        pattern = r"\(\d+/\d+\)"
        match = re.search(pattern, self.ward_distict_text)
        if not match:
            raise Exception(
                f"Provided {self.ward_distict_text} does not contain district or ward ID."
            )
        district_number, ward_number = match.group(0)[1:-1].split("/")
        return district_number, ward_number

    def get_latest_id_number(self, district_number, ward_number, resource_instance_id=None):
        prefix = f"HB{district_number}/{ward_number}/"

        # Suffixed numbers ("HB16/04/049 A") share the index of their base number,
        # so the trailing letters are simply ignored here.
        pattern = re.compile(rf"{re.escape(prefix)}(\d+)")
        indexes = []
        for number in used_hb_numbers(prefix, resource_instance_id):
            match = pattern.match(number)
            if match:
                indexes.append(int(match.group(1)))

        if not indexes:
            return None

        latest = max(indexes)
        print(f"Previous ID number: {prefix}{str(latest).zfill(3)}")
        return {"index": latest}

    def generate_id_number(self, resource_instance_id=None, attempts=0):
        if attempts >= 20:
            raise Exception(
                "After 20 attempts, it wasn't possible to generate an ID that was unique!"
            )

        def retry():
            nonlocal attempts, resource_instance_id
            attempts += 1
            return self.generate_id_number(resource_instance_id, attempts)

        district_number, ward_number = self.parse_district_ward()

        if resource_instance_id:
            id_number_tile = None
            try:
                generated_id_query = {
                    f"data__{HB_NUMBER_NODE_ID}__icontains": f"{district_number}/{ward_number}",
                }
                id_number_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                    **generated_id_query,
                ).first()
            except Exception as e:
                print(f"Failed checking if ID number tile already exists: {e}")
                raise e

            if id_number_tile:
                print("A ID number has already been created for this resource")
                id_number = id_number_tile.data.get(HB_NUMBER_NODE_ID, {}).get('en', {}).get('value', None)
                if not id_number:
                    raise ValueError('No ID found but one has been created for the resource')
                return id_number

        try:
            latest_id_number = self.get_latest_id_number(district_number, ward_number, resource_instance_id)
        except Exception as e:
            print(f"Failed getting the previously used ID number: {e}")
            raise e
        if latest_id_number:
            # Offset attempts so it starts at 1 and will try to generate
            # new increments for the total amount of allow attempts
            next_number = latest_id_number["index"] + (attempts + 1)
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
        data_query = {
            HB_NUMBER_NODE_ID: {"en": {"direction": "ltr", "value": id_number}}
        }
        if isinstance(id_number, dict):
            data_query[HB_NUMBER_NODE_ID] = id_number

        id_number_value = data_query.get(HB_NUMBER_NODE_ID, {}).get('en', {}).get('value', None)

        if not id_number_value:
            raise ValueError('To generate a new HB Number, select a Ward and District Numbering and click "generate"')

        district_number, ward_number = self.parse_district_ward()
        if f"{district_number}/{ward_number}" not in id_number_value:
            raise ValueError('The generated HB Number does not align with the selected Ward and District Numbering.')

        id_number_tile = Tile.objects.filter(
            nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
            data__contains=data_query,
        ).exclude(resourceinstance_id=resource_instance_id).first()
        return not bool(id_number_tile)