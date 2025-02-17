from arches.app.models.tile import Tile
from django.db.models import Max
from datetime import datetime
from dateutil.relativedelta import relativedelta 


SYSTEM_REFERENCE_NODEGROUP = "b37552ce-9527-11ea-a00c-f875a44e0e11"
SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "b37552be-9527-11ea-9213-f875a44e0e11"

ID_NUMBER_PREFIX = "AFC"
ID_NUMBER_PATTERN = r"AFC/\d{2}.*"


class AfcNumber:
    def calculate_tax_year(self):
        current_month = datetime.now().month
        current_year = datetime.now()

        if current_month < 4:
            previous_year = current_year - relativedelta(years=1)
            return f"{previous_year.strftime('%y')}/{current_year.strftime('%y')}"
        
        next_year = current_year + relativedelta(years=1)
        return f"{current_year.strftime('%y')}/{next_year.strftime('%y')}"

    def id_number_format(self, index):
        return f"{ID_NUMBER_PREFIX}{str(index).zfill(2)}-{self.calculate_tax_year()}"

    def get_latest_id_number(self, resource_instance_id=None):
        latest_id_number_tile = None
        try:
            id_number_generated = {
                f"data__{SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID}__en__value__regex": ID_NUMBER_PATTERN,
            }
            print("id_number_generated ", id_number_generated)
            query_result = Tile.objects.filter(
                nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
                **id_number_generated,
            )
            print("query_result ", str(list(query_result)))
            if resource_instance_id:
                query_result.exclude(resourceinstance_id=resource_instance_id)
            query_result = query_result.annotate(
                most_recent=Max("resourceinstance__createdtime")
            )
            print("query_result resource instance ", str(query_result));
            
            query_result = query_result.order_by("-most_recent")
            print("query_result order by ", str(list(query_result)));
            latest_id_number_tile = query_result.first()
            print("latest_id_number_tile ", str((latest_id_number_tile)));
        except Exception as e:
            print(f"Failed querying for previous ID number tile: {e}")
            raise e

        if not latest_id_number_tile:
            return

        latest_id_number = (
            latest_id_number_tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID)
            .get("en")
            .get("value")
        )

        print(str(latest_id_number))

        print(f"Previous ID number: {latest_id_number}")
        id_number_parts = latest_id_number.split("/")
        return {"index": int(id_number_parts[1])}

    def generate_id_number(self, resource_instance_id=None, attempts=0):
        if attempts >= 20:
            raise Exception(
                "After 20 attempts, it wasn't possible to generate an ID that was unique!"
            )

        def retry():
            nonlocal attempts, resource_instance_id
            attempts += 1
            return self.generate_id_number(resource_instance_id, attempts)

        if resource_instance_id:
            id_number_tile = None
            try:
                generated_id_query = {
                    f"data__{SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID}__en__value__regex": ID_NUMBER_PATTERN,
                }
                id_number_tile = Tile.objects.filter(
                    resourceinstance_id=resource_instance_id,
                    nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
                    **generated_id_query,
                ).first()
            except Exception as e:
                print(f"Failed checking if ID number tile already exists: {e}")
                return retry()

            if id_number_tile:
                print("A ID number has already been created for this resource")
                id_number = (
                    id_number_tile.data.get(SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID, {})
                    .get("en", {})
                    .get("value", None)
                )
                if not id_number:
                    raise ValueError(
                        "No ID found but one has been created for the resource"
                    )
                return id_number

        latest_id_number = None
        try:
            latest_id_number = self.get_latest_id_number(resource_instance_id)
        except Exception as e:
            print(f"Failed getting the previously used ID number: {e}")
            return retry()

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
            SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID: {
                "en": {"direction": "ltr", "value": id_number}
            }
        }
        if isinstance(id_number, dict):
            data_query[SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID] = id_number

        id_number_tile = (
            Tile.objects.filter(
                nodegroup_id=SYSTEM_REFERENCE_NODEGROUP,
                data__contains=data_query,
            )
            .exclude(resourceinstance_id=resource_instance_id)
            .first()
        )

        return not bool(id_number_tile)
