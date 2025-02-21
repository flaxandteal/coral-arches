from django.views.generic import View
from django.http import JsonResponse
from arches_orm.adapter import admin
from django.core.paginator import Paginator
from django.core.cache import cache
import json
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
            cache_key = f'dashboard_{user_id}'

            task_resources = []
            counters = {}
            sort_by = request.GET.get('sortBy', None)
            sort_order = request.GET.get('sortOrder', None)
            filter = request.GET.get('filterBy', None)
            sort_options = []
            filter_options = []

            if not update and cache.get(cache_key):
                cache_data = cache.get(cache_key)
                data = json.loads(cache_data)
                task_resources = data['task_resources']
                counters = data['counters']
                sort_options = data['sort_options']
                filter_options = data['filter_options']
                utilities = Utilities()
                task_resources = utilities.sort_resources(task_resources, sort_by, sort_order)

            else:
                user_group_ids = self.get_groups(person_resource[0].id)
                strategies = set()
                for groupId in user_group_ids:
                    strategy = self.select_strategy(groupId)
                    if strategy:
                        strategies.add(self.select_strategy(groupId))
                for strategy in strategies:
                    if sort_by is not None and sort_order is not None and sort_by:
                        resources, counters, sort_options, filter_options = strategy.get_tasks(groupId, person_resource[0].id, sort_by, sort_order, filter)
                    else:
                        resources, counters, sort_options, filter_options = strategy.get_tasks(groupId, person_resource[0].id)
                    task_resources.extend(resources)

                cache_data = json.dumps({
                    'task_resources': task_resources,
                    'counters': counters,
                    'sort_options': sort_options,
                    'filter_options': filter_options
                    })
                cache.set(cache_key, cache_data, 60 * 15)

            page = int(request.GET.get('page', 1))
            items_per_page = int(request.GET.get('itemsPerPage', 10))
            paginator = Paginator(task_resources, items_per_page)
            pages = [page]
            if paginator.num_pages > 1:
                before = list(range(1, page))
                after = list(range(page + 1, paginator.num_pages + 1))
                default_ct = 2
                ct_before = default_ct if len(after) > default_ct else default_ct * 2 - len(after)
                ct_after = default_ct if len(before) > default_ct else default_ct * 2 - len(before)
                if len(before) > ct_before:
                    before = [1, None] + before[-1 * (ct_before - 1) :]
                if len(after) > ct_after:
                    after = after[0 : ct_after - 1] + [None, paginator.num_pages]
                pages = before + pages + after
            
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
                    'response': page_obj.object_list
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
            return PlanningTaskStrategy()
        elif groupId in [EXCAVATION_ADMIN_GROUP, EXCAVATION_USER_GROUP, EXCAVATION_CUR_E]:
            return ExcavationTaskStrategy()
        elif groupId in [SECOND_SURVEY_GROUP, DESIGNATIONS_GROUP]:
            return DesignationTaskStrategy()
        return





        
    


        
