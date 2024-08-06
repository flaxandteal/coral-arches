from django.views.generic import View
from django.http import JsonResponse
from arches_orm.wkrm import WELL_KNOWN_RESOURCE_MODELS
from arches_orm.adapter import admin
from django.core.paginator import Paginator
from datetime import datetime, timezone
from collections import defaultdict 
from django.core.cache import cache
import json
import logging
from itertools import chain 
import pdb

MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
HIERARCHY_NODE_GROUP = '0dd6ccb8-cffe-11ee-8a4e-0242ac180006'
PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'
STATUTORY = 'd06d5de0-2881-4d71-89b1-522ebad3088d'
NON_STATUTORY = 'be6eef20-8bd4-4c64-abb2-418e9024ac14'

class Dashboard(View):

    def get(self, request):
        from arches_orm.models import Person

        with admin():
            user_id = request.user.id                     
            person_resource = Person.where(user_account = user_id)
            
            if not person_resource:
                return JsonResponse({"error": "User not found"}, status=404)
            
            update = request.GET.get('update', 'true') == 'true'
            cache_key = f'dashboard_{user_id}'

            task_resources = []
            counters = {}
            sort_by = request.GET.get('sortBy', 'deadline')
            sort_order = request.GET.get('sortOrder', 'asc')
            sort_options = []

            if not update and cache.get(cache_key):
                cache_data = cache.get(cache_key)
                data = json.loads(cache_data)
                task_resources = data['task_resources']
                counters = data['counters']
                sort_options = data['sort_options']

            else:
                user_group_ids = self.get_groups(person_resource[0].id)
                strategies = set()
                for groupId in user_group_ids:
                    strategy = self.select_strategy(groupId)
                    if strategy:
                        strategies.add(self.select_strategy(groupId))
                for strategy in strategies:
                    resources, counters, sort_options = strategy.get_tasks(groupId, person_resource[0].id, sort_by, sort_order)
                    task_resources.extend(resources)

                cache_data = json.dumps({
                    'task_resources': task_resources,
                    'counters': counters,
                    'sort_options': sort_options
                    })
                cache.set(cache_key, cache_data, 60 * 15)

            paginator = Paginator(task_resources, request.GET.get('itemsPerPage', 10))
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)

            return JsonResponse({
                'paginator': {
                    'current_page': page_obj.number,
                    'end_index': page_obj.end_index(),
                    'has_next': page_obj.has_next(),
                    'has_other_pages': page_obj.has_other_pages(),
                    'has_previous': page_obj.has_previous(),
                    'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
                    'pages': list(paginator.page_range),
                    'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
                    'start_index': page_obj.start_index(),
                    'total': paginator.count,
                    'counters': counters,
                    'sort_options': sort_options,
                    'response': page_obj.object_list
                }
            })
    
    def get_groups(self, userId):
        from arches_orm.models import Group

        groups = Group.all()

        userGroupIds = []

        for group in groups:
            for member in group.members:
                if member.id == userId:
                    userGroupIds.append(str(group.id)) #needs to be a string and not uuid

        return userGroupIds
    
    def select_strategy(self, groupId):
        if groupId in [PLANNING_GROUP, HM_GROUP, HB_GROUP, HM_MANAGER, HB_MANAGER]:
            return PlanningTaskStrategy()
        return

class TaskStrategy:
    def get_tasks(self, groupId, userResourceId, sort_by, sort_order):
        raise NotImplementedError("Subclasses must implement this method")
    def build_data(self, consultation, groupId):
        raise NotImplementedError("Subclasses must implement this method")

class PlanningTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, sort_by='deadline', sort_order='asc'):
        from arches_orm.models import Consultation
    
        TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
        TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
        TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

        is_hm_manager = groupId in [HM_MANAGER] 
        is_hb_manager = groupId in [HB_MANAGER] 
        is_hm_user = groupId in [HM_GROUP] 
        is_hb_user = groupId in [HB_GROUP] 
        is_admin = groupId in [PLANNING_GROUP]

        resources = [] 

        utilities = Utilities()

        consultations = Consultation.all()

        #filter out consultations that are not planning consultations
        planning_consultations=[c for c in consultations if c._._name.startswith('CON/')]

        #checks against type & status and assigns to user if in correct group
        for consultation in planning_consultations:
                action_status = utilities.node_check(lambda: consultation.action[0].action_status )
                action_type = utilities.node_check(lambda: consultation.action[0].action_type) 
                assigned_to_list = utilities.node_check(lambda: consultation.action[0].assigned_to_n1, [])
                reassigned_to_list = utilities.node_check(lambda: consultation.assignment[0].re_assignee.re_assigned_to, [])

                user_assigned = any(assigned_to_list) or any(reassigned_to_list)

                is_assigned_to_user = False

                # first checks reassigned to as this overwrites the assigned to field if true
                if reassigned_to_list:
                    is_assigned_to_user = any(user.id == userResourceId for user in reassigned_to_list)
                elif assigned_to_list:
                    is_assigned_to_user = any(user.id == userResourceId for user in assigned_to_list)
                
                hm_status_conditions = [STATUS_OPEN, STATUS_HB_DONE, STATUS_EXTENSION_REQUESTED]
                hb_status_conditions = [STATUS_OPEN, STATUS_HM_DONE, STATUS_EXTENSION_REQUESTED]

                conditions_for_task = (
                    (is_hm_manager and action_status in hm_status_conditions and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH] and not user_assigned) or
                    (is_hb_manager and action_status in hb_status_conditions and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH] and not user_assigned) or
                    (is_hm_user and is_assigned_to_user and action_status in hm_status_conditions and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]) or
                    (is_hb_user and is_assigned_to_user and action_status in hb_status_conditions and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]) or
                    (is_admin)
                )
                if conditions_for_task:                 
                    task = self.build_data(consultation, groupId)
                    if task:
                        resources.append(task)

        #sort by deadline date, nulls first
        from datetime import datetime

        # Convert the 'deadline', 'date' field to a date and sort
        resources.sort(key=lambda x: (
            x[sort_by] is not None, datetime.strptime(x[sort_by], '%d-%m-%Y') 
            if x[sort_by] else None
        ), reverse=(sort_order == 'desc'))

        counters = utilities.get_count_groups(resources, ['status', 'hierarchy_type'])
        sort_options = [{'id': 'deadline', 'name': 'Deadline'}, {'id': 'date', 'name': 'Date'}]

        return resources, counters, sort_options
    
    def build_data(self, consultation, groupId):
        utilities = Utilities()

        action_status = utilities.node_check(lambda: consultation.action[0].action_status)
        date_entered = utilities.node_check(lambda: consultation.consultation_dates.log_date)
        deadline = utilities.node_check(lambda: consultation.action[0].action_dates.target_date_n1)
        hierarchy_type = utilities.node_check(lambda: consultation.hierarchy_type)
        address = utilities.node_check(lambda: consultation.location_data.addresses)

        address_parts = [address.street.street_value, address.town_or_city.town_or_city_value, address.postcode.postcode_value]
        address = [part for part in address_parts if part is not None and part != 'None']
        
        responseslug = utilities.get_response_slug(groupId) if groupId else None
        
        if date_entered:
            date_entered = datetime.strptime(date_entered, "%Y-%m-%dT%H:%M:%S.%f%z").strftime("%d-%m-%Y")

        deadline_message = None
        if deadline:
            deadline_date = datetime.strptime(deadline, "%Y-%m-%dT%H:%M:%S.%f%z")
            deadline_message = utilities.create_deadline_message(deadline_date)
            deadline = deadline_date.strftime("%d-%m-%Y")          

        resource_data = {
            'id': str(consultation.id),
            'displayname': consultation._._name,
            'displaydescription': consultation._._description,
            'status': utilities.convert_id_to_string(action_status),
            'hierarchy_type': utilities.convert_id_to_string(hierarchy_type),
            'date': date_entered,
            'deadline': deadline,
            'deadlinemessage': deadline_message,
            'address': address,
            'responseslug': responseslug
        }
        return resource_data

class Utilities:
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
            print(func)
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


        
