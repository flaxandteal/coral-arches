from arches.app.models.tile import Tile
from arches.app.models.models import EditLog 
import re


HERITAGE_ASSET_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
HB_NUMBER_NODE_ID = "250002fe-3aae-11ef-91fd-0242ac120003"

# get the latest id number - get list find the most recent suffix using the id number
# generate the next suffix
# append to the current number

class HbNumberSuffix:
    hb_number = ""

    def __init__(self, hb_number):
        self.hb_number = hb_number
        print('4444444444444', self.hb_number)

    # def id_number_format(self, index):
    #     district_number, ward_number = self.parse_district_ward()
    #     return f"HB{district_number}/{ward_number}/{str(index).zfill(3)}"
    
    def parse_suffix(self, hb_number):
        pattern = r"(HB\d{2}/\d{2}/\d{3})\s?([A-Z]*)$"
        match = re.match(pattern, hb_number)
        print("PARSDED HB NUMBER", hb_number)
        if not match:
            if self.hb_number == hb_number:
                return None
            else:
                raise Exception(f"Provided {hb_number} does not match the expected format.")
        base_number, suffix = match.groups()
        print(base_number)
        print("1" + suffix + "1")
        return base_number.strip() , suffix.strip()
    
    def increment_letter(self, suffix, attempts):
        print('11111111111111', suffix, attempts)
        if not suffix:
            return 'B'
        if suffix == 'Z':
            return 'AA'
        if len(suffix) > 1:
            increment = chr(ord(suffix[0]) + attempts)
            return increment + increment
        print('yyyyyyyyyyyyyooooooooooooo', "1" + chr(ord(suffix) + attempts) + "1")
        return chr(ord(suffix) + attempts)

    def get_latest_suffix(self, resource_instance_id=None):
        latest_id_number_tile = None
        try:
            id_number_generated = {
                f"newvalue__{HB_NUMBER_NODE_ID}__icontains": f"{self.hb_number}",
            }
            query_result = EditLog.objects.filter(
                nodegroupid=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                edittype='tile create',
                **id_number_generated
            ).order_by("-timestamp")            
            print('22222222222222222', query_result)
            if resource_instance_id:
                query_result.exclude(resourceinstanceid=resource_instance_id)
            latest_id_number_tile = query_result.first()
        except Exception as e:
            print(f"Failed querying for previous ID number tile: {e}")
            raise e

        if not latest_id_number_tile:
            return

        latest_id_number = (
            latest_id_number_tile.newvalue.get(HB_NUMBER_NODE_ID).get("en").get("value")
        )

        print(f"Previous ID number: {latest_id_number}")
        base_number, suffix = self.parse_suffix(latest_id_number)
        return {"suffix": suffix}

    def append_id_suffix(self, resource_instance_id=None, attempts=1):
        if attempts >= 20:
            raise Exception(
                "After 20 attempts, it wasn't possible to generate an ID that was unique!"
            )

        def retry():
            nonlocal attempts, resource_instance_id
            attempts += 1
            return self.append_id_suffix(resource_instance_id, attempts)

        if resource_instance_id:
            id_number_tile = None
            try:
                generated_id_query = {
                    f"data__{HB_NUMBER_NODE_ID}__icontains": f"{self.hb_number}",
                }
                id_number_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                    **generated_id_query,
                ).first()
            except Exception as e:
                print(f"Failed checking if ID number tile already exists: {e}")
                return 

            if id_number_tile:
                print("A ID number has already been created for this resource")
                id_number = id_number_tile.data.get(HB_NUMBER_NODE_ID, {}).get('en', {}).get('value', None)
                if not id_number:
                    raise ValueError('No ID found but one has been created for the resource')
                return id_number

        latest_suffix = None
        try:
            latest_suffix = self.get_latest_suffix(resource_instance_id)
        except Exception as e:
            print(f"Failed getting the previously used ID number: {e}")
            return retry()

        if latest_suffix:
            # Offset attempts so it starts at 1 and will try to generate
            # new increments for the total amount of allow attempts
            next_suffix = self.increment_letter(latest_suffix['suffix'], attempts)
        else:
            #return the suffix
            next_suffix = self.increment_letter(latest_suffix['suffix'], attempts)
        print("HERE", latest_suffix, next_suffix)

        if len(next_suffix) > 1:
            new_id_number = self.hb_number.strip() + next_suffix
        else:
            new_id_number = self.hb_number.strip() + " " + next_suffix
        passed = self.validate_id(new_id_number)
        if not passed:
            return retry()

        print(f"ID number is unique, ID number: {new_id_number}")
        return new_id_number

    def validate_id(self, id_number, resource_instance_id=None):
        data_query = {
            HB_NUMBER_NODE_ID: {"en": {"direction": "ltr", "value": id_number}}
        }
        if isinstance(id_number, dict):
            data_query[HB_NUMBER_NODE_ID] = id_number

        id_number_value = data_query.get(HB_NUMBER_NODE_ID, {}).get('en', {}).get('value', None)
        print('iiiiiiiiiiiiiiii', id_number_value)
        if not id_number_value:
            raise ValueError('To generate a new HB Number, select an existing HB Number and click "generate"')

        base_number, suffix = self.parse_suffix(id_number_value)
        if f"{base_number}{suffix}" not in id_number_value and f"{base_number} {suffix}" not in id_number_value:
            raise ValueError('The generated HB Number does not align with the selected HB Number.')
        try:
            id_number_tile = Tile.objects.filter(
                nodegroup_id=HERITAGE_ASSET_REFERENCES_NODEGROUP_ID,
                data__contains=data_query,
            ).exclude(resourceinstance_id=resource_instance_id).first()
        except Exception as e:
            print(f"Failed fetching existing tile")
        print('ttttttttttttttt', id_number_tile)
        return not bool(id_number_tile)