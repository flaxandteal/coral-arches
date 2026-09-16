from arches.app.models import models
from arches.app.models.models import TileModel
from arches.app.models.tile import Tile
from django.db.models import Count, F, Q, Subquery
from querysets_shim.adapter import admin
from querysets_shim.wrapper import _with_ancestor_nodegroups
from datetime import datetime
import html
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from coral.utils.user_role import UserRole
import copy
from typing import List, Dict, TypedDict

# MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'

PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

# Action is cardinality-n: a consultation accumulates action tiles and the
# dashboard means the current one. `tiles` carries no timestamp, so recency is
# Date Entered, then sortorder.
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
ACTION_DATE_ENTERED = '305f5f29-0b5f-53a2-bcef-4aca4ba677c1'
ACTION_STATUS = 'b07b2cf2-bccf-5823-a93a-dab9e132c9b6'
ACTION_TYPE = 'e2585f8a-51a3-11eb-a7be-f875a44e0e11'
ACTION_ASSIGNED_TO = '528bd120-1525-543b-b046-06fd4e00b432'
ACTION_TARGET_DATE = '345e7fda-7f62-5e55-8fed-85e68b13dade'

ASSIGN_HM = 'Assign To HM'
ASSIGN_HB = 'Assign To HB'
ASSIGN_BOTH = 'Assign To Both HM & HB'

# Council and Hierarchy Type are single-value nodes whose node id and nodegroup
# id coincide.
COUNCIL_NODE = '4ddb3a60-3d1c-5873-8168-ed0ba1c92644'
HIERARCHY_NODEGROUP = '3e16208d-9560-5998-8ba1-203cd599a5d8'
HIERARCHY_TYPE = HIERARCHY_NODEGROUP

def latest_actions():
    """One row per consultation — its most recent Action tile, values extracted.

    A reference node annotates as `[{labels: [{value: ...}]}]`, so the label the
    dashboard filters on sits behind that path rather than at the top level.
    """
    return (
        TileModel.objects.filter(nodegroup_id=ACTION_NODEGROUP)
        .annotate(
            entered=F(f'data__{ACTION_DATE_ENTERED}'),
            action_status=F(f'data__{ACTION_STATUS}__0__labels__0__value'),
            action_type=F(f'data__{ACTION_TYPE}__0__labels__0__value'),
            target_date=F(f'data__{ACTION_TARGET_DATE}'),
            assigned_to=F(f'data__{ACTION_ASSIGNED_TO}'),
        )
        .order_by('resourceinstance_id', F('entered').desc(nulls_last=True), '-sortorder')
        .distinct('resourceinstance_id')
    )


def reference_label(node):
    """The label of a reference node, or None.

    A reference node reads back as Reference objects carrying their own labels,
    which the dashboard serialises to JSON — so the value has to be flattened to
    text here rather than handed on as the node.
    """
    from arches_controlled_lists.models import ListItem

    labels = [
        ListItem.find_best_label_from_set(reference.labels, 'en')
        for reference in node or []
    ]
    labels = [label for label in labels if label]
    return ', '.join(labels) if labels else None


def not_in(field, values):
    """Exclude these values while keeping rows that have none.

    `exclude(field__in=[...])` drops NULLs with them — SQL `NOT IN` is unknown
    against NULL — which would hide every consultation whose current action has
    no status yet.
    """
    return Q(**{f'{field}__isnull': True}) | ~Q(**{f'{field}__in': values})


class SingleFilterDictInterface(TypedDict):
    id: str
    name: str
    type: str

class PlanningTaskStrategy(TaskStrategy):

    _user_role: UserRole = None;

    # Hydrating a whole Consultation builds all 584 of its aliases; build_data
    # reads these. Same approach as designation_strategy.DISPLAY_ALIASES.
    # Value aliases only — the alias map skips semantic nodes, so naming a
    # grouping node here does nothing. display_nodes() adds the ancestors.
    DISPLAY_ALIASES = [
        'action_status', 'action_type', 'assigned_to_n1', 'target_date_n1',
        'hierarchy_type', 'classification_type', 'council',
        'street_value', 'town_or_city_value', 'postcode_value',
        'related_heritage_assets',
    ]

    def display_nodes(self, model_cls):
        """Node objects for the aliases this dashboard displays, if resolvable."""
        by_alias = model_cls._._node_objects_by_alias()
        nodes = [by_alias[alias] for alias in self.DISPLAY_ALIASES if alias in by_alias]
        # arches-querysets resolves ancestry through the nodes it is handed, so a
        # narrowed list KeyErrors on anything nested more than one level deep.
        return _with_ancestor_nodegroups(nodes, by_alias.values()) or None

    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='target_date_n1', sort_order='asc', filter='all'):
        from querysets_shim.models import Consultation
        with admin():
            self._user_role = UserRole(groupId)

            council_values = self.get_filter_council_options()
            members_filter = self.get_filter_members_options()
            groups_filter = self.get_filter_group_options()

            is_member_filter = any(m['id'] == filter for m in members_filter)
            is_council_filter = any(c['id'] == filter for c in council_values)
            is_group_filter = any(g['id'] == filter for g in groups_filter)

            def role_conditions():
                """(action types this role sees, statuses it hides, own-work-only).

                A manager sees the whole team's queue, a user only their own.
                Planning admin sees everything, so carries no Action condition.
                """
                role = self._user_role
                if role.planning_group['is_role']:
                    return None, None, False
                if role.hm_manager['is_role']:
                    return [ASSIGN_HM, ASSIGN_BOTH], ['Closed', 'HM done'], False
                if role.hm_user['is_role']:
                    return [ASSIGN_HM, ASSIGN_BOTH], ['Closed', 'HM done'], True
                if role.hb_manager['is_role']:
                    return [ASSIGN_HB, ASSIGN_BOTH], ['Closed', 'HB done'], False
                if role.hb_user['is_role']:
                    return [ASSIGN_HB, ASSIGN_BOTH], ['Closed', 'HB done'], True
                return None, None, False

            action_types, hidden_statuses, own_only = role_conditions()

            def current_actions():
                """Each consultation's current Action tile, narrowed to this role.

                A consultation with no Action tile has no task, so it does not
                appear — the dashboard lists work, not consultations.
                """
                qs = latest_actions()
                if action_types:
                    qs = qs.filter(action_type__in=action_types)
                if hidden_statuses:
                    qs = qs.filter(not_in('action_status', hidden_statuses))
                if own_only and userResourceId:
                    qs = qs.filter(assigned_to__icontains=str(userResourceId))
                if is_member_filter:
                    qs = qs.filter(assigned_to__icontains=filter)
                elif is_group_filter:
                    qs = qs.filter(action_type__in=[filter, ASSIGN_BOTH])
                return qs

            def consultation_ids():
                """Ids matching the filters that live on the Consultation itself."""
                conditions = {'resourceid__startswith': 'CON/'}
                if is_council_filter:
                    conditions['council'] = filter
                return Consultation.where(**conditions).id_queryset()

            # Everything below stays a queryset, so Postgres does the filtering,
            # sorting and paging and hands back one page. Materialising the ids
            # here instead would pull every consultation into Python on a
            # 300k-resource set to show eight of them.
            matching = TileModel.objects.filter(
                tileid__in=Subquery(current_actions().values('tileid')),
                resourceinstance_id__in=Subquery(consultation_ids()),
            )

            target = F(f'data__{ACTION_TARGET_DATE}')
            # Undated work sorts last either way, rather than crowding the top
            # of a descending sort.
            order = target.desc(nulls_last=True) if sort_order == 'desc' else target.asc(nulls_last=True)

            total_resources = matching.count()
            start_index = (page - 1) * page_size
            page_ids = list(
                matching.order_by(order)
                .values_list('resourceinstance_id', flat=True)[start_index:start_index + page_size]
            )

            def get_counters() -> Dict[str, Dict[str, int | None]]:
                """Status and hierarchy tallies, counted in the database.

                Previously this hydrated every matching Consultation and tallied
                `resource.action[0]` in Python — the first Action tile, not the
                current one, so anything with an earlier empty action counted as
                None.
                """
                def tally(qs, field):
                    rows = qs.values(field).annotate(n=Count('tileid'))
                    counts = {(r[field] or 'None'): r['n'] for r in rows}
                    # A consultation with no tile at all has no row to group, so
                    # it would otherwise be missing from the tally rather than
                    # counted as unset, and the counters would not sum to the
                    # total the dashboard reports beside them.
                    untiled = total_resources - sum(counts.values())
                    if untiled > 0:
                        counts['None'] = counts.get('None', 0) + untiled
                    return dict(sorted(counts.items()))

                status_tiles = matching.annotate(
                    status=F(f'data__{ACTION_STATUS}__0__labels__0__value'))
                hierarchy_tiles = TileModel.objects.filter(
                    nodegroup_id=HIERARCHY_NODEGROUP,
                    resourceinstance_id__in=Subquery(matching.values('resourceinstance_id')),
                ).annotate(hierarchy=F(f'data__{HIERARCHY_TYPE}__0__labels__0__value'))
                return {
                    'status': tally(status_tiles, 'status'),
                    'heirarchy_type': tally(hierarchy_tiles, 'hierarchy'),
                }

            counters = get_counters()
            tasks = [self.build_data(resource, groupId)
                     for resource in Consultation.find_many(
                         page_ids, nodes=self.display_nodes(Consultation))]

            return tasks, total_resources, counters

    def get_sort_options(self):
        return [
            {'id': 'target_date_n1', 'name': 'Deadline'}, 
        ]
    
    def get_default_sort_order(self):
        return 'asc'

    def get_filter_council_options(self) -> List[SingleFilterDictInterface]:
        """
        Method gets a filter list towards members the council domain values options

        Returns:
            List[SingleFilterDictInterface]: A list of filters dicts
        """
        from arches.app.models import models
        from arches_controlled_lists.models import ListItemValue
        with admin():
            # Council is a `reference` node since the v8 controlled-list migration,
            # so its options come from the list it is bound to rather than from
            # config["options"], which only domain-value nodes carry.
            council_node = models.Node.objects.filter(nodeid=COUNCIL_NODE).first()
            list_id = (council_node.config or {}).get('controlledList') if council_node else None
            if not list_id:
                return []

            labels = ListItemValue.objects.filter(
                list_item__list_id=list_id, valuetype_id='prefLabel'
            ).order_by('list_item__sortorder').values_list('value', flat=True)

            # The label is the filter id: it is what the tile stores and what
            # get_tasks matches on.
            return [{'id': label, 'name': label, 'type': 'council'} for label in labels]
    
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
        from querysets_shim.models import Group
        with admin():
            if (len(groups) == 0): return [];

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

            # One query by id, rather than an OR chain across resource ids.
            return transform_group_members(Group.find_many(groups))
    
    def build_data(self, consultation, groupId):
        utilities = Utilities()

        action = next(iter(consultation.action or []), None)
        location = consultation.location_data
        address = location.addresses if location else None

        action_status = reference_label(action.action_status if action else None)
        action_type = reference_label(action.action_type if action else None)
        assigned_to = action.assigned_to_n1 if action else None
        deadline = action.target_date_n1 if action else None
        hierarchy_type = reference_label(consultation.hierarchy_type)
        council = reference_label(location.council if location else None)
        classification = reference_label(consultation.classification_type)
        related_ha = consultation.related_heritage_assets

        # the orm stopped returning multiple tiles for responses, this is a fall back
        responses = Tile.objects.filter(
            resourceinstance_id=consultation.id,
            nodegroup_id='af7677ba-cfe2-11ee-8a4e-0242ac180006'
        ).values_list('data__cd77b29c-2ef6-11ef-b1c4-0242ac140006', flat=True)
        
        # A Heritage Asset with no reference numbers has no tile for the
        # nodegroup at all, so this reads None rather than an empty branch.
        ha_refs = []
        for ha in related_ha or []:
            references = getattr(ha, 'heritage_asset_references', None)
            if references is None:
                continue
            for alias in ('ihr_number', 'hb_number', 'smr_number', 'historic_parks_and_gardens'):
                value = getattr(references, alias, None)
                if value is not None and str(value).strip():
                    ha_refs.append(value)

        assigned_to_names = None
        if assigned_to:
            assigned_to_names = list(map(lambda person: person.name[0].full_name,  assigned_to))

        # Initialise the team responses
        responded = {
            'HB': False,
            'HM': False,
            'type': action_type
        }

        # Look up for either team
        teams = {
            '2628d62f-c206-4c06-b26a-3511e38ea243': 'HM',
            '70fddadb-8172-4029-b8fd-87f9101a3a2d': 'HB'
        }
        if responses:
            for response in responses:
                team = teams.get(response, None)
                if team in responded:
                    responded[team] = True

        # Street, Town or City and Postcode are siblings of the address rather
        # than branches under it, so the value alias is reached directly.
        address_parts = [
            address.street_value if address else None,
            address.town_or_city_value if address else None,
            address.postcode_value if address else None,
        ]
        address = [part for part in address_parts if part is not None and part != 'None']
        
        responseslug = utilities.get_response_slug(groupId) if groupId else None

        deadline_message = None
        if deadline:
            deadline_date = utilities._parse_date(str(deadline))
            deadline_message = utilities.create_deadline_message(deadline_date)
            deadline = deadline_date.strftime("%d-%m-%Y")

        resource_data = {
            'id': str(consultation.id),
            'state': 'Planning',
            'displayname': consultation._.resource.descriptors['en']['name'],
            'status': action_status,
            'hierarchy_type': hierarchy_type,
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
