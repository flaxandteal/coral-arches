from arches.app.models import models
from arches_orm.adapter import admin 
from datetime import datetime
import html
from arches_orm.arches_django.query_builder.query_builder import QueryBuilder
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from coral.utils.user_role import UserRole
import copy
from typing import List, Dict, TypedDict

# MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
# ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
# HIERARCHY_NODE_GROUP = '0dd6ccb8-cffe-11ee-8a4e-0242ac180006'

PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

# TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
# TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
# TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

COUNCIL_NODE = '69500360-d7c5-11ee-a011-0242ac120006'
# STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
# STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
# STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
# STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
# STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'
STATUTORY = 'd06d5de0-2881-4d71-89b1-522ebad3088d'
# NON_STATUTORY = 'be6eef20-8bd4-4c64-abb2-418e9024ac14'

class SingleFilterDictInterface(TypedDict):
    id: str
    name: str
    type: str

class PlanningTaskStrategy(TaskStrategy):

    _user_role: UserRole = None;

    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='target_date_n1', sort_order='desc', filter='all'):
        from arches_orm.models import Consultation
        from arches_orm.models import Group
        with admin():        
            self._user_role = UserRole(groupId)

            resources = [] 

            domain_values = self.get_filter_council_options()
            members_filter = self.get_filter_members_options()
            groups_filter = self.get_filter_group_options()
            applied_queries = {}

            consultationsDefaultWhereConditions = { 'resourceid__startswith': 'CON/' }
            queryBuilder = Consultation.where(**consultationsDefaultWhereConditions)

            def apply_default_conditions(queryBuilder: "QueryBuilder") -> "QueryBuilder":
                """
                Method applies the default where conditions depending on the user's role, can only see certain fields

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm

                Returns:
                    QueryBuilder: This is the class of the query builder which is chainable in the arches orm
                """
                # * The Planning Admin
                if (self._user_role.planning_group['is_role']):
                    return queryBuilder;
            
                # * The HM manager
                elif (self._user_role.hm_manager['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HB done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HM").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__isnull=True).or_where(assigned_to_n1__contains=str(userResourceId)).or_where(assigned_to_n1=None).or_where(assigned_to_n1='null')

                # * The HM user
                elif (self._user_role.hm_user['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HB done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HM").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=str(userResourceId))
                    # * Response
                    queryBuilder = queryBuilder.where(response_team__not_equal="HM")

                # * The HB manager
                elif (self._user_role.hb_manager['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HM done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HB").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__isnull=True).or_where(assigned_to_n1__contains=str(userResourceId)).or_where(assigned_to_n1=None).or_where(assigned_to_n1='null')
                    # * Response
                    queryBuilder = queryBuilder.where(response_team__not_equal="HB")
            
                # * The HB user
                elif (self._user_role.hb_user['is_role']):
                    # * Action Status
                    queryBuilder = queryBuilder.where(action_status="Open").or_where(action_status="HM done").or_where(action_status="Extension requested")
                    # * Action Type
                    queryBuilder = queryBuilder.where(action_type="Assign To HB").or_where(action_type="Assign To Both HM & HB")
                    # * Assigned to
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=str(userResourceId))
                
                return queryBuilder
                        
            def apply_filters(queryBuilder: "QueryBuilder") -> "QueryBuilder":
                """
                Method handles the filtering for the drop down GUI within the frontend, this basically applies on the where condition for the queryBuilder

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm

                Returns:
                    QueryBuilder: This is the class of the query builder which is chainable in the arches orm
                """
                if (filter == 'all'):
                    return queryBuilder

                # ? Already talked with Stu but to increase speed use the filter.type here instead of using filter.value
                is_member_filter = any(member['id'] == filter for member in members_filter)
                is_domain_filter = any(value['id'] == filter for value in domain_values)
                is_group_filter = any(group['id'] == filter for group in groups_filter )

                if is_domain_filter:
                    queryBuilder = queryBuilder.where(council=filter)
                elif is_member_filter:
                    queryBuilder = queryBuilder.where(assigned_to_n1__contains=filter)
                elif is_group_filter:
                    queryBuilder = queryBuilder.where(action_type=filter)
                    
                return queryBuilder 

            def apply_order_by(queryBuilder: "QueryBuilder") -> "QueryBuilder":
                """
                Method handles applying the ordering by deadline date value which is another drop down in the GUI. It uses the modifier order_by to achieve
                this

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm

                Returns:
                    QueryBuilder: This is the class of the query builder which is chainable in the arches orm
                """
                direction = '-'
                if (sort_order == 'asc'): direction = ''

                return queryBuilder.order_by(f'{direction}{sort_by}')
            
            def get_paginated_resources(queryBuilder: "QueryBuilder") -> any: # WKRM
                """
                Method gets the final results from the filters & modifiters applied from the method above, however this method uses a selctor to only
                get a range of records

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm

                Returns:
                    any: The WKRM
                """
                copyQueryBuilder = copy.deepcopy(queryBuilder)
                start_index = (page -1) * page_size

                return copyQueryBuilder.offset(start_index, page_size)
            
            def get_counters(queryBuilder: "QueryBuilder") -> Dict[str, Dict[str, int | None]]:
                """
                Method returns the count for the hierarchy types and the action status, it takes full advantage of get_count method to get the count
                of each topic in action status and hierarchy types.

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm

                Returns:
                    Dict[str, Dict[str, int | None]]: The counters which is used within the frontend for display
                """
                def _get_counters_hierarchy_type():
                    keys = ['Statutory', 'Non-statutory', None]
                    topics = {}

                    for key in keys:
                        count = get_count(queryBuilder, { 'hierarchy_type': key })
                        if (count != 0):
                            topics['None' if (key == None) else key] = count

                    return topics;
                            
                def _get_counters_action_status():
                    keys = ['Extension requested', 'Open', 'Closed', 'HB done', 'HM done', None]
                    topics = {}

                    for key in keys:
                        count = get_count(queryBuilder, { 'action_status': key })
                        if (count != 0):
                            topics['None' if (key == None) else key] = count

                    return topics;
            
                return {
                    'status': _get_counters_action_status(),
                    'heirarchy_type': _get_counters_hierarchy_type()
                }

            def get_count(queryBuilder, whereConditions: None | Dict[str, any] =None) -> int:
                """_summary_

                Args:
                    queryBuilder (QueryBuilder): This is the class of the query builder which is chainable in the arches orm
                    whereConditions (None | Dict[str, any], optional): This is the where conditions, incase we want to count based on a certain
                        field value. Defaults to None.

                Returns:
                    int: Returns the count
                """

                copyQueryBuilder = copy.deepcopy(queryBuilder)

                if (whereConditions == None):
                    return copyQueryBuilder.count()
                else:
                    return copyQueryBuilder.where(**whereConditions).count()
            
            queryBuilder = apply_default_conditions(queryBuilder)
            queryBuilder = apply_filters(queryBuilder)
            
            counters = get_counters(queryBuilder)

            queryBuilder = apply_order_by(queryBuilder)

            total_resources = get_count(queryBuilder)
            resources = get_paginated_resources(queryBuilder)

            tasks = []

            for resource in resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)
                
            return tasks, total_resources, counters
        
    def get_sort_options(self):
        return [
            {'id': 'target_date_n1', 'name': 'Deadline'}, 
        ]
    
    def get_filter_council_options(self) -> List[SingleFilterDictInterface]:
        """
        Method gets a filter list towards members the council domain values options

        Returns:
            List[SingleFilterDictInterface]: A list of filters dicts
        """
        from arches.app.models import models
        with admin():
            # Create entries for council filter options
            council_node = models.Node.objects.filter(
                nodeid = COUNCIL_NODE,
                datatype = 'domain-value'
            ).first()

            domain_options = council_node.config.get("options")
            domain_values = [{'id': option.get("text").get("en"), 'name': option.get("text").get("en"), 'type': 'council'} for option in domain_options]

            return domain_values
    
    def get_filter_members_options(self) -> List[SingleFilterDictInterface]:
        """
        Method gets a filter list towards members within groups, however depending on your role, also depends on the members returned

        Returns:
            List[SingleFilterDictInterface]: A list of filters dicts
        """
        with admin():
            if (self._user_role.hb_manager['is_role'] or self._user_role.hb_user['is_role']):
                return self.get_group_members([HB_GROUP, HB_MANAGER])
            
            elif (self._user_role.hm_manager['is_role'] or self._user_role.hm_user['is_role']):
                return self.get_group_members([HM_GROUP, HM_MANAGER])
            
            elif (self._user_role.planning_group['is_role']):
                return self.get_group_members([HB_GROUP, HM_GROUP, HB_MANAGER, HM_MANAGER, PLANNING_GROUP])
            
            else:
                return []

    def get_filter_group_options(self) -> List[SingleFilterDictInterface]:
        """
        Method gets a filter list towards groups, however the user will only recieve this if there are a admin

        Returns:
            List[SingleFilterDictInterface]: A list of filters dicts
        """
        with admin():
            if (self._user_role.planning_group['is_role']):
                return [
                    {'id': 'Assign To HB', 'name': 'HB Group', 'type': 'group'}, 
                    {'id': 'Assign To HM', 'name': 'HM Group', 'type': 'group'}
                ]
            
            else:
                return []

    def get_filter_options(self, _=None):
        """Get filter options for planning tasks."""
        with admin():
            filter_options = [
                {'id': 'all', 'name': 'All', 'type': 'all'}, 
                *self.get_filter_group_options(), 
                *self.get_filter_members_options(), 
                *self.get_filter_council_options()
            ]
            
            return filter_options

    
    def get_group_members(self, groups: List[str]):
        from arches_orm.models import Group
        with admin():
            if (len(groups) == 0): return [];

            def get_groups():
                foundGroupRecords = Group.where(resourceinstance__resourceinstanceid=groups[0])

                for _, group in enumerate(groups[1:], start=1):
                    foundGroupRecords = foundGroupRecords.or_where(resourceinstance__resourceinstanceid=group)

                return foundGroupRecords.get()

            def transform_group_members(foundGroupRecords):
                members_filter = {}

                for foundGroupRecord in foundGroupRecords:
                    for member in foundGroupRecord.members:
                        if type(member).__name__ == 'PersonRelatedResourceInstanceViewModel':
                            members_key = str(member.id)
                            members_filter[members_key] = {
                                'id': str(member.id), 
                                'name': member.name[0].full_name, 
                                'type': 'person'
                            }
                return list(members_filter.values())

            foundGroupRecords = get_groups()
            return transform_group_members(foundGroupRecords)
    
    def build_data(self, consultation, groupId):
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

        # Initialise the team responses
        responded = {
            'HB': False,
            'HM': False,
            'type': action_type
        }

        # Look up for either te
        if responses:
            for response in responses:
                team = response.response_team
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
            deadline_date = datetime.strptime(str(deadline), "%Y-%m-%dT%H:%M:%S.%f%z")
            deadline_message = utilities.create_deadline_message(deadline_date)
            deadline = deadline_date.strftime("%d-%m-%Y")

        resource_data = {
            'id': str(consultation.id),
            'state': 'Planning',
            'displayname': consultation._.resource.descriptors['en']['name'],
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