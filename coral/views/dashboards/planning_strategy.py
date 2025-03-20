
from arches.app.models import models
from arches_orm.adapter import admin 
from datetime import datetime
import html
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities

MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
HIERARCHY_NODE_GROUP = '0dd6ccb8-cffe-11ee-8a4e-0242ac180006'
PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

COUNCIL_NODE = '69500360-d7c5-11ee-a011-0242ac120006'
STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'
STATUTORY = 'd06d5de0-2881-4d71-89b1-522ebad3088d'
NON_STATUTORY = 'be6eef20-8bd4-4c64-abb2-418e9024ac14'

class PlanningTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='deadline', sort_order='desc', filter='all'):
        from arches_orm.models import Consultation
        with admin():        
            is_hm_manager = groupId in [HM_MANAGER] 
            is_hb_manager = groupId in [HB_MANAGER] 
            is_hm_user = groupId in [HM_GROUP] 
            is_hb_user = groupId in [HB_GROUP] 
            is_admin = groupId in [PLANNING_GROUP]

            resources = [] 

            utilities = Utilities()

            filter_options = self.get_filter_options(groupId)

            domain_values = [f for f in filter_options if f.get('type') == 'council']
            members_filter = [f for f in filter_options if f.get('type') == 'person']
            groups_filter = [f for f in filter_options if f.get('type') == 'group']

            consultations = Consultation.all()

            #filter out consultations that are not planning consultations
            planning_consultations=[c for c in consultations if (resourceid := c.system_reference_numbers.uuid.resourceid) and resourceid.startswith('CON/')]
            # check the correct filter group and apply the filter
            if filter != 'all':
                is_member_filter = any(member['id'] == filter for member in members_filter)
                is_domain_filter = any(value['id'] == filter for value in domain_values)
                is_group_filter = any(group['id'] == filter for group in groups_filter )
                if is_domain_filter:
                    planning_consultations = [c for c in planning_consultations if self.filter_by_domain_value(c, filter)]
                elif is_member_filter:
                    planning_consultations = [c for c in planning_consultations if self.filter_by_person(c, filter)]
                elif is_group_filter:
                    planning_consultations = [c for c in planning_consultations if self.filter_by_group(c, filter)]
            

            #checks against type & status and assigns to user if in correct group
            for consultation in planning_consultations:
                    action_status = utilities.node_check(lambda: consultation.action[0].action_status )
                    action_type = utilities.node_check(lambda: consultation.action[0].action_type) 
                    assigned_to_list = utilities.node_check(lambda: consultation.action[0].assigned_to_n1)

                    user_assigned = any(assigned_to_list or [])
                    is_assigned_to_user = False

                    if assigned_to_list:
                        is_assigned_to_user = any(user.id == userResourceId for user in assigned_to_list)
                    
                    hm_status_conditions = [STATUS_OPEN, STATUS_HB_DONE, STATUS_EXTENSION_REQUESTED]
                    hb_status_conditions = [STATUS_OPEN, STATUS_HM_DONE, STATUS_EXTENSION_REQUESTED]
                    conditions_for_task = (
                        (is_hm_manager and action_status in hm_status_conditions and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH] and (not user_assigned or is_assigned_to_user)) or
                        (is_hb_manager and action_status in hb_status_conditions and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH] and (not user_assigned or is_assigned_to_user)) or
                        (is_hm_user and is_assigned_to_user and action_status in hm_status_conditions and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]) or
                        (is_hb_user and is_assigned_to_user and action_status in hb_status_conditions and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]) or
                        (is_admin)
                    )
                    if conditions_for_task:  
                        resources.append(consultation)
            sort_nodes = {
                'deadline': lambda resource: resource.action[0].action_dates.target_date_n1,
            }

            # Sort nodes allow us to access the model node value for sorting
            sorted_resources = utilities.sort_resources_date(resources, sort_nodes, sort_by, sort_order)

            # Get total number of resources
            total_resources = len(resources)

            # Build data only for the current page
            start_index = (page -1) * page_size
            end_index = (page * page_size)
            indexed_resources = sorted_resources[start_index:end_index]

            tasks = []

            for resource in indexed_resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)

            count_nodes = {
                'status': lambda resource: resource.action[0].action_status,
                'heirarchy_type': lambda resource: resource.hierarchy_type
            }

            counters = utilities.get_count_groups(resources, count_nodes)
            
            return tasks, total_resources, counters
        
    def get_sort_options(self):
        return [
            {'id': 'deadline', 'name': 'Deadline'}, 
        ]
    
    def get_filter_options(self, groupId=None):
        """Get filter options for planning tasks."""
        from arches.app.models import models
        with admin():
            # Define constants needed for filters
            is_hm_manager = groupId in [HM_MANAGER] 
            is_hb_manager = groupId in [HB_MANAGER] 
            is_hm_user = groupId in [HM_GROUP] 
            is_hb_user = groupId in [HB_GROUP] 
            is_admin = groupId in [PLANNING_GROUP]
            
            # Create entries for council filter options
            council_node = models.Node.objects.filter(
                nodeid = COUNCIL_NODE,
                datatype = 'domain-value'
            ).first()

            domain_options = council_node.config.get("options")
            domain_values = [{'id': option.get("id"), 'name': option.get("text").get("en"), 'type': 'council'} for option in domain_options]

            # Get members of groups for filtering
            planning_team_groups = [HB_GROUP, HM_GROUP, HB_MANAGER, HM_MANAGER, PLANNING_GROUP]
            hb_groups = [HB_GROUP, HB_MANAGER]
            hm_groups = [HM_GROUP, HM_MANAGER]

            members_filter = []
            groups_filter = []
            
            if is_hb_manager or is_hb_user:
                members_filter = self.get_group_members(hb_groups)
            elif is_hm_manager or is_hm_user:
                members_filter = self.get_group_members(hm_groups)
            elif is_admin:
                members_filter = self.get_group_members(planning_team_groups)
                groups_filter = [
                    {'id': TYPE_ASSIGN_HB, 'name': 'HB Group', 'type': 'group'}, 
                    {'id': TYPE_ASSIGN_HM, 'name': 'HM Group', 'type': 'group'}
                ]       

            filter_options = [
                {'id': 'all', 'name': 'All', 'type': 'all'}, 
                *groups_filter, 
                *members_filter, 
                *domain_values
            ]
            
            return filter_options

    
    def get_group_members(self, groups):
        from arches_orm.models import Group
        with admin():
            members_filter = []
            for group in groups:
                    group_resource = Group.find(group)
                    members = [
                        {'id': str(member.id), 'name': member.name[0].full_name, 'type': 'person'}
                        for member in group_resource.members
                        if type(member).__name__ == 'PersonRelatedResourceInstanceViewModel'
                    ]
                    members_filter.extend(members)
            return members_filter
    
    def build_data(self, consultation, groupId):
        from arches_orm.models import Consultation
        utilities = Utilities()

        action_status = utilities.node_check(lambda: consultation.action[0].action_status)
        action_type = utilities.node_check(lambda: consultation.action[0].action_type)
        assigned_to = utilities.node_check(lambda: consultation.action[0].assigned_to_n1)
        deadline = utilities.node_check(lambda: consultation.action[0].action_dates.target_date_n1)
        hierarchy_type = utilities.node_check(lambda: consultation.hierarchy_type)
        address = utilities.node_check(lambda: consultation.location_data.addresses)
        council = utilities.node_check(lambda: consultation.location_data.council)
        responses = utilities.node_check(lambda: consultation.response_action)
        classification = utilities.node_check(lambda: consultation.classification_type)
        related_ha = utilities.node_check(lambda: consultation.related_heritage_assets)

        ha_refs = []
        for ha in related_ha:
            ihr = ha.heritage_asset_references.ihr_number
            hb = ha.heritage_asset_references.hb_number
            smr = ha.heritage_asset_references.smr_number
            gardens = ha.heritage_asset_references.historic_parks_and_gardens

            def valid(val):
                return val is not None and val.strip() != ''

            if valid(ihr):
                ha_refs.append(ihr)
            if valid(hb):
                ha_refs.append(hb)
            if valid(smr):
                ha_refs.append(smr)
            if valid(gardens):
                ha_refs.append(gardens)

        assigned_to_names = None
        if assigned_to:
            assigned_to_names = list(map(lambda person: person.name[0].full_name,  assigned_to))

        if classification:
            classification = utilities.domain_value_string_lookup(Consultation, 'classification_type', classification)

        # Initialise the team responses
        responded = {
            'HB': False,
            'HM': False,
            'type': utilities.domain_value_string_lookup(Consultation, 'action_type', action_type)
        }

        # Look up for either te
        if responses:
            for response in responses:
                team = utilities.domain_value_string_lookup(Consultation, 'response_team', response.response_team)
                if team in responded:
                    responded[team] = True

        address_parts = [
            address.street.street_value, 
            address.town_or_city.town_or_city_value, 
            address.postcode.postcode_value
        ]
        address = [part for part in address_parts if part is not None and part != 'None']
        
        responseslug = utilities.get_response_slug(groupId) if groupId else None

        deadline_message = None
        if deadline:
            deadline_date = datetime.strptime(deadline, "%Y-%m-%dT%H:%M:%S.%f%z")
            deadline_message = utilities.create_deadline_message(deadline_date)
            deadline = deadline_date.strftime("%d-%m-%Y")          

        resource_data = {
            'id': str(consultation.id),
            'state': 'Planning',
            'displayname': consultation._._name,
            'displaydescription': html.unescape(consultation._._description),
            'status': utilities.convert_id_to_string(action_status),
            'hierarchy_type': utilities.convert_id_to_string(hierarchy_type),
            'assigned_to': assigned_to_names,
            'ha_refs': ha_refs,
            'deadline': deadline,
            'deadlinemessage': deadline_message,
            'address': address,
            'council': council,
            'classification': classification,
            'responseslug': responseslug,
            'responded': responded
        }
        return resource_data
    
    def filter_by_domain_value(self, consultation, filter):
        utilities = Utilities()
        council_value = utilities.node_check(lambda:consultation.location_data.council)
        if not council_value:
            return False
        return council_value == filter
    
    def filter_by_person(self, consultation, filter):
        utilities = Utilities()
        person_list = utilities.node_check(lambda:consultation.action[0].assigned_to_n1)
        if not person_list:
            return False
        return any(str(person.id) == filter for person in person_list)   
    
    def filter_by_group(self, consultation, filter):
        TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'
        utilities = Utilities()
        action_type = utilities.node_check(lambda:consultation.action[0].action_type)
        if not action_type:
            return False
        return action_type == filter or action_type == TYPE_ASSIGN_BOTH