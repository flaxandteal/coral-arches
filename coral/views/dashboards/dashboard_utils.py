from collections import defaultdict
import logging
from datetime import datetime, timezone
from arches.app.models import models

MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
HIERARCHY_NODE_GROUP = '0dd6ccb8-cffe-11ee-8a4e-0242ac180006'
PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

EXCAVATION_ADMIN_GROUP = "4fbe3955-ccd3-4c5b-927e-71672c61f298"
EXCAVATION_USER_GROUP = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_D = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_E = "214900b1-1359-404d-bba0-7dbd5f8486ef"

SECOND_SURVEY_GROUP = '1ce90bd5-4063-4984-931a-cc971414d7db'
DESIGNATIONS_GROUP = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'

STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'
STATUTORY = 'd06d5de0-2881-4d71-89b1-522ebad3088d'
NON_STATUTORY = 'be6eef20-8bd4-4c64-abb2-418e9024ac14'

class Utilities():
    def convert_id_to_string(self, id):
        if id == STATUS_OPEN:
            return 'Open'
        elif id == STATUS_CLOSED:
            return 'Closed'
        elif id == STATUS_HB_DONE:
            return 'HB done'
        elif id == STATUS_HM_DONE:
            return 'HM done'
        elif id == STATUS_EXTENSION_REQUESTED:
            return 'Extension requested'
        elif id == STATUTORY:
            return 'Statutory'
        elif id == NON_STATUTORY:
            return 'Non-statutory'
        elif id == None:
            return 'None'
        
    def domain_value_string_lookup(self, resource, node_alias, value_id):
        """
        Looks up the string representation of a domain value.

        Args:
            resource (Resource): The resource instance. Use The ORM model eg. Consultation.
            node_alias (str): The alias of the node.
            value_id (str): The ID of the value to look up. Use the node variable.

        Returns:
            str: The string representation of the domain value.
        """
        node = models.Node.objects.filter(
            alias = node_alias,
            graph_id = resource.graphid
        ).first()
        options = node.config.get("options")
        for option in options:
            if option.get("id") == value_id:
                return option.get("text").get("en")
        
    def get_count(self, resources, counter):
        counts = defaultdict(int)
        for resource in resources:
            counts[resource[counter]] += 1

        counts = {key: counts[key] for key in sorted(counts)}

        return counts
    
    def get_count_groups(self, resources, count_groups: list):
        counters = {}

        for count in count_groups:
            counters[count] = self.get_count(resources, count)

        
        return counters
    
    # Method to check if a node exists
    def node_check(self, func, default=None):
        try:
            logging.info(func())
            return func()
        except Exception as error:
            logging.warning(f'Node does not exist: {error}')
            return default
        
    def get_response_slug(self, groupId):
        if groupId in [HM_GROUP, HM_MANAGER]:
            return "hm-planning-consultation-response-workflow"
        elif groupId in [HB_GROUP, HB_MANAGER]:
            return "hb-planning-consultation-response-workflow"
        elif groupId in [PLANNING_GROUP]:
            return "assign-consultation-workflow"
        elif groupId in [EXCAVATION_ADMIN_GROUP, EXCAVATION_USER_GROUP, EXCAVATION_CUR_E]:
            return "licensing-workflow"
    
    def create_deadline_message(self, date):
        message = None
        date_now = datetime.now(timezone.utc)
        difference = (date.date() - date_now.date()).days

        if difference < 0:
            message = "Overdue"
        elif difference == 0:
            message = "Due Today"
        elif difference <= 3:
            day_word = "day" if difference == 1 else "days"
            message = f"{difference} {day_word} until due"

        return message
    
    def _parse_date(self, date_str):
        date_formats = ['%d-%m-%Y', '%Y-%m-%d %H:%M:%S.%f']
        print(date_str, type(date_str))
        for date_format in date_formats:
            try:
                return datetime.strptime(date_str, date_format)
            except ValueError:
                continue
        return date_str

    def sort_resources(self, resources, sort_by, sort_order):
        print('resources', resources)
        sorted_resources = sorted(
            resources,
            key=lambda x: self._parse_date(x[sort_by]),
            reverse=(sort_order == 'desc')
        )
        return sorted_resources
    
        