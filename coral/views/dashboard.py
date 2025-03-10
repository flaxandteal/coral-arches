from django.views.generic import View
from django.http import JsonResponse
from arches_orm.adapter import admin
from django.core.paginator import Paginator
from django.core.cache import cache
import json
from coral.views.dashboards.paginator import get_paginator
from coral.views.dashboards.planning_strategy import PlanningTaskStrategy
from coral.views.dashboards.excavation_strategy import ExcavationTaskStrategy
from coral.views.dashboards.designation_strategy import DesignationTaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities


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

class Dashboard(View):

    def get(self, request):
        from arches_orm.models import Person
        with admin():
            user_id = request.user.id                     
            person_resource = Person.where(user_account = user_id)
            if not person_resource:
                return JsonResponse({"error": "User not found"}, status=404)
            
            update = request.GET.get('update', 'true') == 'true'
            
            dashboard = request.GET.get('dashboard', None)
            task_resources = []
            counters = {}
            sort_by = request.GET.get('sortBy', None)
            sort_order = request.GET.get('sortOrder', None)
            filter = request.GET.get('filterBy', None)
            page = int(request.GET.get('page', 1))
            items_per_page = int(request.GET.get('itemsPerPage', 10))
            sort_options = []
            filter_options = []

            cache_key = f'dashboard_{user_id}_{page}'

            if not update and cache.get(cache_key):
                cache_data = cache.get(cache_key)
                data = json.loads(cache_data)
                task_resources = data['task_resources']
                counters = data['counters']
                sort_options = data['sort_options']
                filter_options = data['filter_options']
                total_resources = data['total_resources']
                utilities = Utilities()
                task_resources = utilities.sort_resources(task_resources, sort_by, sort_order)

            else:
                key = f"groups_{user_id}"
                if cache.get(key):
                    group_data = cache.get(key)
                    user_group_ids = json.loads(group_data)
                else:
                    user_group_ids = self.get_groups(person_resource[0].id)
                    cache.set(key, json.dumps(user_group_ids), 60 * 15) 

                user_group_ids = self.get_groups(person_resource[0].id)           
                strategies = []
                for groupId in user_group_ids:
                    strategy = self.select_strategy(groupId)
                    if strategy:
                        strategies.append(strategy)

                if not strategies:
                    return JsonResponse({"error": "No valid strategy found"}, status=404)
                
                if dashboard:
                    strategy = next((s['strategy'] for s in strategies if dashboard == s.id), None)
                    if strategy is None:
                        return JsonResponse({"error": "User not in group"}, status=404)
                else: 
                    strategy = strategies[0]['strategy']
                    
                task_params = {
                    'groupId': groupId,
                    'userResourceId': person_resource[0].id,
                    'page': page,
                    'page_size': items_per_page
                }
                    
                if sort_by is not None and sort_order is not None:
                    task_params.update({'sort_by': sort_by, 'sort_order': sort_order})
                if filter is not None:
                    task_params.update({'filter': filter })
                resources, total_resources, counters = strategy.get_tasks(**task_params)
                filter_options = strategy.get_filter_options(groupId)
                sort_options = strategy.get_sort_options()
                task_resources.extend(resources)

                cache_data = json.dumps({
                    'task_resources': task_resources,
                    'total_resources': total_resources,
                    'counters': counters,
                    'sort_options': sort_options,
                    'filter_options': filter_options
                    })
                cache.set(cache_key, cache_data, 60 * 15)

            paginator, pages = get_paginator(total_resources, page, items_per_page)

            page_obj = paginator.get_page(page)

            return JsonResponse({
                'paginator': {
                    'current_page': page_obj.number,
                    'end_index': page_obj.end_index(),
                    'has_next': page_obj.has_next(),
                    'has_other_pages': page_obj.has_other_pages(),
                    'has_previous': page_obj.has_previous(),
                    'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
                    'pages': pages,
                    'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
                    'start_index': page_obj.start_index(),
                    'total': paginator.count,
                    'response': task_resources
                },
                'counters': counters,
                'sort_options': sort_options,
                'filter_options': filter_options,
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
            return { id: groupId, 'name': 'Planning Dashboard', 'strategy': PlanningTaskStrategy() }
        elif groupId in [EXCAVATION_ADMIN_GROUP, EXCAVATION_USER_GROUP, EXCAVATION_CUR_E]:
            return { id: groupId, 'name': 'Excavation Dashboard', 'strategy': ExcavationTaskStrategy() }
        elif groupId in [SECOND_SURVEY_GROUP, DESIGNATIONS_GROUP]:
            return { id: groupId, 'name': 'Records and Designation Dashboard', 'strategy': DesignationTaskStrategy() }
        return





        
    


        
