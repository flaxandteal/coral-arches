from django.views.generic import View
from django.http import JsonResponse
from django.db.models import Q
from django.core.cache import caches
from arches.app.models.models import TileModel
from querysets_shim.adapter import admin
import json
from coral.views.dashboards.paginator import get_paginator
from coral.views.dashboards.dashboard_register import get_strategy

class Dashboard(View):

    def get(self, request):
        with admin():
            dashboard_cache = caches['dashboard_versioning']

            user_id = request.user.id
            person_id = self.get_person_id(user_id)
            if not person_id:
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
            sort_by = request.GET.get('sortBy', None)
            sort_order = request.GET.get('sortOrder', None)
            filter = request.GET.get('filterBy', None)
            page = int(request.GET.get('page', 1))
            items_per_page = int(request.GET.get('itemsPerPage', 10))

            cache_key = f'dashboard_{user_id}_{version}_{dashboard}_{sort_by}_{sort_order}_{filter}_{page}_{items_per_page}'
            cache_data = dashboard_cache.get(cache_key)
            if not update and cache_data:
                data = json.loads(cache_data)
                task_resources = data['task_resources']
                counters = data['counters']
                sort_options = data['sort_options']
                filter_options = data['filter_options']
                total_resources = data['total_resources']
                sort_order = data['sort_order']
            else:
                key = f"groups_{user_id}"
                data_cache = dashboard_cache.get(key)

                if data_cache:
                    user_group_ids = json.loads(data_cache)
                else:
                    user_group_ids = self.get_groups(person_id)
                    dashboard_cache.set(key, json.dumps(user_group_ids), 60 * 15)

                strategies = []
                for groupId in user_group_ids:
                    strategy = get_strategy(groupId)
                    if strategy:
                        strategies.append({**strategy, 'groupId': groupId})

                if not strategies:
                    return JsonResponse({"error": "No valid strategy found"}, status=404)

                if dashboard:
                    chosen = next((s for s in strategies if s['name'] == dashboard), None)
                    if chosen is None:
                        return JsonResponse({"error": "User not in group"}, status=404)
                else:
                    chosen = strategies[0]
                strategy = chosen['strategy']

                task_params = {
                    'groupId': chosen['groupId'],
                    'userResourceId': person_id,
                    'page': page,
                    'page_size': items_per_page
                }

                if sort_by is not None and sort_order is not None:
                    task_params.update({'sort_by': sort_by, 'sort_order': sort_order})
                if filter is not None and filter != 'all':
                    task_params.update({'filter': filter})
                task_resources, total_resources, counters = strategy.get_tasks(**task_params)
                filter_options = strategy.get_filter_options(chosen['groupId'])
                sort_options = strategy.get_sort_options()
                sort_order = strategy.get_default_sort_order()

                cache_data = json.dumps({
                    'task_resources': task_resources,
                    'total_resources': total_resources,
                    'counters': counters,
                    'sort_options': sort_options,
                    'sort_order': sort_order,
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

    def get_person_id(self, user_id):
        """The Person whose `user_account` is this user, read off its tile."""
        from querysets_shim.models import Person

        account = Person._._node_objects_by_alias()['user_account']
        node = str(account.nodeid)
        person_id = TileModel.objects.filter(
            Q(**{f'data__{node}': user_id}) | Q(**{f'data__{node}': str(user_id)}),
            nodegroup_id=account.nodegroup_id,
        ).values_list('resourceinstance_id', flat=True).first()
        return str(person_id) if person_id else None

    def get_groups(self, person_id):
        """Ids of the Groups whose `members` include this Person, read off their tiles."""
        from querysets_shim.models import Group

        members = Group._._node_objects_by_alias()['members']
        group_ids = TileModel.objects.filter(
            nodegroup_id=members.nodegroup_id,
            **{f'data__{members.nodeid}__contains': [{'resourceId': person_id}]},
        ).values_list('resourceinstance_id', flat=True).distinct()
        return [str(id) for id in group_ids]
