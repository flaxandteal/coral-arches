from django.views.generic import View
from django.http import JsonResponse
from arches_orm.adapter import admin
from django.core.paginator import Paginator
from django.core.cache import caches
import json
from coral.views.dashboards.paginator import get_paginator
from coral.views.dashboards.dashboard_register import get_strategy

class Dashboard(View):

    def get(self, request):
        from arches_orm.models import Person
        with admin():
            dashboard_cache = caches['dashboard_versioning']

            user_id = request.user.id                     
            person_resource = Person.where(user_account=user_id).get()
            if not person_resource:
                return JsonResponse({"error": "User not found"}, status=404)
            
            update = request.GET.get('update', 'true') == 'true'
            
            # set a version key for the cache
            version_key = f"dashboard_version_{user_id}"
            version = dashboard_cache.get(version_key)

            if version is None:
                version = 1
                dashboard_cache.set(version_key, version, 60 * 15) 

            if update:
                version += 1
                dashboard_cache.set(version_key, version, 60 * 60)

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

            cache_key = f'dashboard_{user_id}_{version}_{page}'
            cache_data = dashboard_cache.get(cache_key)
            if not update and cache_data:
                data = json.loads(cache_data)
                task_resources = data['task_resources']
                counters = data['counters']
                sort_options = data['sort_options']
                filter_options = data['filter_options']
                total_resources = data['total_resources']

                # ! Could cause issues but shouldn't
                # utilities = Utilities()
                # task_resources = utilities.sort_resources(task_resources, sort_by, sort_order)
            else:
                key = f"groups_{user_id}"
                data_cache = dashboard_cache.get(key)

                if data_cache:
                    user_group_ids = json.loads(data_cache)
                else:
                    user_group_ids = self.get_groups(person_resource[0].id)
                    dashboard_cache.set(key, json.dumps(user_group_ids), 60 * 15) 
       
                strategies = []
                for groupId in user_group_ids:
                    strategy = get_strategy(groupId)
                    if strategy:
                        strategies.append(strategy)

                if not strategies:
                    return JsonResponse({"error": "No valid strategy found"}, status=404)
                
                if dashboard:
                    strategy = next((s['strategy'] for s in strategies if dashboard == s.name), None)
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
                if filter is not None and filter != 'all':
                    task_params.update({'page': page})
                    task_params.update({'filter': filter })
                resources, total_resources, counters = strategy.get_tasks(**task_params)
                filter_options = strategy.get_filter_options(groupId)
                sort_options = strategy.get_sort_options()
                sort_order = strategy.get_default_sort_order()
                task_resources.extend(resources)

                cache_data = json.dumps({
                    'task_resources': task_resources,
                    'total_resources': total_resources,
                    'counters': counters,
                    'sort_options': sort_options,
                    'filter_options': filter_options
                    })
                dashboard_cache.set(cache_key, cache_data, 60 * 15)

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
                'sort_order': sort_order,
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





        
    

