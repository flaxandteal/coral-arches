
from arches.app.models import models
from arches_orm.adapter import admin 
from datetime import datetime
import html
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from coral.utils.user_role import UserRole
import copy
from typing import List

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

    _user_role: UserRole = None;

    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='target_date_n1', sort_order='desc', filter='all'):
        from arches_orm.models import Consultation
        from arches_orm.models import Group
        with admin():        
            self._user_role = UserRole(groupId)

            resources = [] 
            utilities = Utilities()
            filter_options = self.get_filter_options(groupId)

            domain_values = [f for f in filter_options if f.get('type') == 'council']
            members_filter = [f for f in filter_options if f.get('type') == 'person']
            groups_filter = [f for f in filter_options if f.get('type') == 'group']

            consultationsDefaultWhereConditions = { 'resourceid__startswith': 'CON/' }
            queryBuilder = Consultation.where(**consultationsDefaultWhereConditions)
            foundGroups = Group.where(resourceinstance__resourceinstanceid=HM_MANAGER).get()
            for group in foundGroups:
                test = [
                    {'id': str(member.id), 'name': member.name[0].full_name, 'type': 'person'}
                    for member in group.members
                    if type(member).__name__ == 'PersonRelatedResourceInstanceViewModel'
                ]
                # members_filter.extend(members)
                print(test)
            # print('GROUP HERE : ', foundGroup)

            copyQueryBuilder = copy.deepcopy(queryBuilder)
            results = copyQueryBuilder.get()

            for result in results:
                if result.action and len(result.action) > 0:
                    action = result.action[0]
                    if (action.action_type):
                        print('ACTION TYPE : ', action.action_type)
            
            def apply_default_conditions(queryBuilder):
                # def get_paginated_resources(queryBuilder):
                #     copyQueryBuilder = copy.deepcopy(queryBuilder)
                #     # start_index = (page -1) * page_size
                #     # end_index = (page * page_size)
                #     # return copyQueryBuilder.offset(start_index, end_index)
                #     return copyQueryBuilder.get()

                # * The admin
                if (self._user_role.planning_group['is_role']):
                    return;
            
                # * The HM manager
                elif (self._user_role.hm_manager['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HM done").or_where(action_status="Extension requested")
                    # print('LENGTH ACTION STATUS : ', len(get_paginated_resources(queryBuilder)))

                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HM").or_where(action_type="Assign To Both HM & HB")
                    # print('LENGTH ACTION TYPE : ', len(get_paginated_resources(queryBuilder)))

                    # * Assigned to
                    # ! This doesn't work with None for some strange reason
                    queryBuilder = queryBuilder.where(assigned_to_n1=None).or_where(assigned_to_n1__contains=str(userResourceId))
                    # print('LENGTH ASSIGNMENT : ', len(get_paginated_resources(queryBuilder)))

                # * The HM user
                elif (self._user_role.hm_user['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HM done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HM").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=str(userResourceId))

                # * The HB manager
                elif (self._user_role.hb_manager['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HB done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HB").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    # ! This doesn't work with None for some strange reason
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=str(userResourceId)).or_where(assigned_to_n1=None)
            
                # * The HB user
                elif (self._user_role.hb_user['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HB done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HB").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=str(userResourceId))
                
                return queryBuilder
                        
            def apply_filters(queryBuilder):
                if (filter == 'all'):
                    return queryBuilder

                # ? Seems like there can be three filter options for domains here.
                # ! We can speed this up by prefixing the sub string on the value and then removing it
                is_member_filter = any(member['id'] == filter for member in members_filter)
                is_domain_filter = any(value['id'] == filter for value in domain_values)
                is_group_filter = any(group['id'] == filter for group in groups_filter )

                print('is_member_filter : ', is_member_filter)
                print('is_domain_filter : ', is_domain_filter)
                print('is_group_filter : ', is_group_filter)

                if is_domain_filter:
                    queryBuilder = queryBuilder.where(council=filter)
                elif is_member_filter:
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=filter)
                elif is_group_filter:
                    queryBuilder = queryBuilder.where(action_type=filter)
                    
                return queryBuilder 

            def apply_order_by(queryBuilder):
                direction = '-'
                if (sort_order == 'desc'): direction = ''

                return queryBuilder.order_by(f'{direction}{sort_by}')
            
            def get_paginated_resources(queryBuilder):
                copyQueryBuilder = copy.deepcopy(queryBuilder)
                start_index = (page -1) * page_size
                end_index = (page * page_size)
                return copyQueryBuilder.offset(start_index, end_index)
                
            def get_count(queryBuilder):
                copyQueryBuilder = copy.deepcopy(queryBuilder)
                return copyQueryBuilder.count()
            
            queryBuilder = apply_default_conditions(queryBuilder)
            queryBuilder = apply_filters(queryBuilder)
            queryBuilder = apply_order_by(queryBuilder)
            
            total_resources = get_count(queryBuilder)
            resources = get_paginated_resources(queryBuilder)

            tasks = []

            for resource in resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)

            count_nodes = {
                'status': lambda resource: resource.action[0].action_status,
                'heirarchy_type': lambda resource: resource.hierarchy_type
            }

            # ! We can work out the count
            counters = utilities.get_count_groups(resources, count_nodes)
            
            return tasks, total_resources, counters
        
    def get_sort_options(self):
        return [
            {'id': 'target_date_n1', 'name': 'Deadline'}, 
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
            domain_values = [{'id': option.get("text").get("en"), 'name': option.get("text").get("en"), 'type': 'council'} for option in domain_options]

            # Get members of groups for filtering
            planning_team_groups = [HB_GROUP, HM_GROUP, HB_MANAGER, HM_MANAGER, PLANNING_GROUP]
            hb_groups = [HB_GROUP, HB_MANAGER]
            hm_groups = [HM_GROUP, HM_MANAGER]

            members_filter = []
            groups_filter = []
            
            # ! We can maybe use here resourceinstance__id here to search for resource instances
            if is_hb_manager or is_hb_user:
                members_filter = self.get_group_members(hb_groups)
            elif is_hm_manager or is_hm_user:
                members_filter = self.get_group_members(hm_groups)
            elif is_admin:
                members_filter = self.get_group_members(planning_team_groups)
                groups_filter = [
                    {'id': 'Assign To HB', 'name': 'HB Group', 'type': 'group'}, 
                    {'id': 'Assign To HM', 'name': 'HM Group', 'type': 'group'}
                ]       

            filter_options = [
                {'id': 'all', 'name': 'All', 'type': 'all'}, 
                *groups_filter, 
                *members_filter, 
                *domain_values
            ]
            
            return filter_options

    
    def get_group_members(self, groups: List[str]):
        from arches_orm.models import Group
        with admin():
            if (len(groups) == 0): return [];

            def get_groups():
                foundGroupRecords = Group.where(resourceinstance__resourceinstanceid=groups[0])

                for _, group in enumerate(groups[1:], start=1):
                    foundGroupRecords = foundGroupRecords.or_where(resourceinstance__resourceinstanceid=group).get()

                return foundGroupRecords.get()

            def transform_group_members(foundGroupRecords):
                members_filter = []

                for foundGroupRecord in foundGroupRecords:
                    members = [
                        {'id': str(member.id), 'name': member.name[0].full_name, 'type': 'person'}
                        for member in foundGroupRecord.members
                        if type(member).__name__ == 'PersonRelatedResourceInstanceViewModel'
                    ]
                    members_filter.extend(members)

                return members_filter

            foundGroupRecords = get_groups()
            return transform_group_members(foundGroupRecords)
    
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
            deadline_date = datetime.strptime(str(deadline), "%Y-%m-%d %H:%M:%S%z")
            deadline_message = utilities.create_deadline_message(deadline_date)
            deadline = deadline_date.strftime("%d-%m-%Y")          

        resource_data = {
            'id': str(consultation.id),
            'state': 'Planning',
            # 'displayname': consultation._._name, ! issue with get_discripter 
            # 'displaydescription': html.unescape(consultation._._description), ! issue with get_discripter 
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
