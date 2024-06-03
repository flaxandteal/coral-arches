import uuid
from django.views.generic import View
from django.http import JsonResponse
from arches_orm.models import Person, Group, Consultation
from arches_orm.wkrm import WELL_KNOWN_RESOURCE_MODELS
from arches_orm.adapter import admin
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.core.paginator import Paginator
from datetime import datetime, timedelta
from collections import defaultdict 

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
        with admin():
            user_id = request.user.id
                        
            person_resource = Person.where(user_account = user_id)
            
            if not person_resource:
                return JsonResponse({"error": "User not found"}, status=404)
            
            groups = Group.all()

            userGroupIds = []

            for group in groups:
                for member in group.members:
                    if member.id == person_resource[0].id:
                        userGroupIds.append(str(group.id)) #needs to be a string and not uuid
            
            taskResources = []
            counters = {}
            sort_by = request.GET.get('sortBy', 'deadline')
            sort_order = request.GET.get('sortOrder', 'asc')
            sort_options = []

            #defines the data structure dependent upon the group
            for groupId in userGroupIds:
                if groupId in [PLANNING_GROUP, HM_GROUP, HB_GROUP, HM_MANAGER, HB_MANAGER]:
                    planningTasks = self.get_planning_consultations(groupId, person_resource[0].id, sort_by, sort_order)
                    taskResources.extend(planningTasks)
                    counters = self.get_count_groups(planningTasks, ['status', 'hierarchy_type'])
                    sort_options = [{'id': 'deadline', 'name': 'Deadline'}, {'id': 'date', 'name': 'Date'}]
                    break

            paginator = Paginator(taskResources, request.GET.get('itemsPerPage', 10))
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
                    'response': list(page_obj.object_list)
                }
            })

    def get_planning_consultations(self, groupId, userResouceId, sort_by='deadline', sort_order='asc'):
        
        
            TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
            TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
            TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

            is_user = groupId in [HM_GROUP, HB_GROUP] 
            is_manager = groupId in [HM_MANAGER, HB_MANAGER] 
            is_admin = groupId in [PLANNING_GROUP]

            resources = [] 

            consultations = Consultation.all()

            #filter out consultations that are not planning consultations
            planning_consultations=[c for c in consultations if c._._name.startswith('CON/')]

            #checks against type & status and assigns to user if in correct group
            for consultation in planning_consultations:
                    action_status = consultation.action[0].action_status if consultation.action else None
                    action_type = consultation.action[0].action_type if consultation.action else None
                    action_by = consultation.action[0].action_by[0].id if consultation.action and consultation.action[0].action_by else None

                    is_assigned_to_user = action_by == userResouceId

                    conditions_for_task = (
                        (is_manager and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]) or
                        (is_manager and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]) or
                        (is_user and is_assigned_to_user and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]) or
                        (is_user and is_assigned_to_user and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]) or
                        (is_admin)
                    )
                    if conditions_for_task:                 
                        task = self.build_planning_resource_data(consultation)
                        if task:
                            resources.append(task)

            #sort by deadline date, nulls first
            from datetime import datetime

            # Convert the 'deadline', 'date' field to a date and sort
            resources.sort(key=lambda x: (
                x[sort_by] is not None, datetime.strptime(x[sort_by], '%d-%m-%Y') 
                if x[sort_by] else None
            ), reverse=(sort_order == 'desc'))

            return resources
    
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
        return dict(counts)
    
    def get_count_groups(self, resources, count_groups: list):
        counters = {}

        for count in count_groups:
            counters[count] = self.get_count(resources, count)
        
        return counters

    def build_planning_resource_data(self, consultation):

        action_status = consultation.action[0].action_status if consultation.action else None
        date_entered = consultation.consultation_dates.log_date if consultation.consultation_dates else None
        deadline = consultation.action[0].target_date_n1 if consultation.action else None
        hierarchy_type = consultation.hierarchy_type
        address = consultation.location_data.addresses

        address_parts = [address.street.street_value, address.town_or_city.town_or_city_value, address.postcode.postcode_value]
        address = [part for part in address_parts if part is not None and part != 'None']

        if date_entered:
            date_entered = datetime.strptime(date_entered, "%Y-%m-%dT%H:%M:%S.%f%z").strftime("%d-%m-%Y")
        if deadline:
            deadline = datetime.strptime(deadline, "%Y-%m-%dT%H:%M:%S.%f%z").strftime("%d-%m-%Y")           

        resource_data = {
            'id': consultation.id,
            'displayname': consultation._._name,
            'displaydescription': consultation._._description,
            'status': self.convert_id_to_string(action_status),
            'hierarchy_type': self.convert_id_to_string(hierarchy_type),
            'date': date_entered,
            'deadline': deadline,
            'address': address,
            'responseslug': 'assign-consultation-workflow'
        }
        return resource_data
        