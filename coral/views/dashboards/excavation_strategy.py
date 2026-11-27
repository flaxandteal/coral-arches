from dateutil import parser
from django.db.models import Exists, OuterRef, Subquery, TextField, Value
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import Coalesce
from arches.app.models.models import ResourceInstance, TileModel
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from coral.utils.reference_values import reference_label
from querysets_shim.adapter import admin
from querysets_shim.values import EMPTY, active_language, values_by_resource, related_resource_ids

LICENCE_ALIASES = [
    'name', 'licence_number_value', 'cm_reference_number', 'valid_until_date',
    'report_classification_type', 'licensee', 'employing_body', 'associated_activities',
]
BLANK = Value('', output_field=TextField())
SORT_COLUMNS = {'resourceinstance__createdtime': 'createdtime', 'valid_until_date': 'sort_valid_until'}


def format_date(value):
    if not value:
        return None
    try:
        return parser.parse(str(value)).strftime("%d-%m-%Y")
    except (ValueError, OverflowError):
        return None


class ExcavationTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceinstance__createdtime', sort_order='desc', filter='all'):
        from querysets_shim.models import Activity, License, Organization, Person
        with admin():
            language = active_language()
            nodes = License._._node_objects_by_alias()

            def tiles_of(alias):
                return TileModel.objects.filter(
                    resourceinstance_id=OuterRef('pk'), nodegroup_id=nodes[alias].nodegroup_id)

            # Licence applications carry an EL/ reference; other Licence resources are not dashboard items.
            reference = nodes['resourceid']
            applications = TileModel.objects.filter(
                nodegroup_id=reference.nodegroup_id,
                **{f'data__{reference.nodeid}__{language}__value__startswith': 'EL/'})
            licences = ResourceInstance.objects.filter(
                graph_id=License._graphid, pk__in=Subquery(applications.values('resourceinstance_id')))

            if filter != 'all':
                report = nodes['report_classification_type']
                licences = licences.filter(Exists(tiles_of('report_classification_type').filter(
                    **{f'data__{report.nodeid}__contains': [{'labels': [{'value': filter}]}]})))

            valid_until = tiles_of('valid_until_date').annotate(
                v=KeyTextTransform(str(nodes['valid_until_date'].nodeid), 'data'))
            licences = licences.annotate(sort_valid_until=Coalesce(Subquery(valid_until.values('v')[:1]), BLANK))

            total_resources = licences.count()

            column = SORT_COLUMNS.get(sort_by, 'createdtime')
            order = [f'-{column}' if sort_order == 'desc' else column, 'resourceinstanceid']
            start_index = (page - 1) * page_size
            rows = list(licences.order_by(*order).values('resourceinstanceid', 'createdtime')[start_index:start_index + page_size])
            ids = [str(row['resourceinstanceid']) for row in rows]

            fields = values_by_resource(License, ids, LICENCE_ALIASES)
            person_ids, body_ids, activity_ids = [], [], []
            for values in fields.values():
                person_ids += related_resource_ids(values.get('licensee'))
                body_ids += related_resource_ids(values.get('employing_body'))
                activity_ids += related_resource_ids(values.get('associated_activities'))

            prefetched = {
                'fields': fields,
                'created': {str(row['resourceinstanceid']): row['createdtime'] for row in rows},
                'people': values_by_resource(Person, person_ids, ['full_name']),
                'bodies': values_by_resource(Organization, body_ids, ['organization_name']),
                'activities': values_by_resource(Activity, activity_ids, ['activity_name']),
                'response_slug': Utilities().get_response_slug(groupId) if groupId else None,
            }

            tasks = [self.build_data(id, groupId, prefetched) for id in ids]

            return tasks, total_resources, []

    def get_sort_options(self):
        return [
            {'id': 'resourceinstance__createdtime', 'name': 'Created At'},
            {'id': 'valid_until_date', 'name': 'Valid Until'}
        ]

    def get_filter_options(self, groupId=None):
        return [
            {'id': 'all', 'name': 'All'},
            {'id': 'Final', 'name': 'Final'},
            {'id': 'Preliminary', 'name': 'Preliminary'},
            {'id': 'Interim', 'name': 'Interim'},
            {'id': 'Unclassified', 'name': 'Unclassified'},
            {'id': 'Summary', 'name': 'Summary'},
            {'id': 'Not Received', 'name': 'Not Received'}
        ]

    def build_data(self, resource_id, groupId, prefetched):
        values = prefetched['fields'].get(resource_id, EMPTY)

        display_name = values.get('name') or ''
        if display_name.startswith("Excavation Licence"):
            display_name = display_name[len("Excavation Licence"):].strip()

        site_names = (prefetched['activities'].get(id, EMPTY).get('activity_name')
                      for id in related_resource_ids(values.get('associated_activities')))

        return {
            'id': resource_id,
            'state': 'Excavation',
            'displayname': display_name,
            'sitename': next((name for name in site_names if name), None),
            'createdat': str(prefetched['created'][resource_id]),
            'cmreference': values.get('cm_reference_number'),
            'validuntildate': format_date(values.get('valid_until_date')),
            'employingbody': self.names(values.get('employing_body'), prefetched['bodies'], 'organization_name'),
            'nominateddirectors': self.names(values.get('licensee'), prefetched['people'], 'full_name'),
            'reportstatus': reference_label(values.get('report_classification_type')) or None,
            'licencenumber': values.get('licence_number_value'),
            'responseslug': prefetched['response_slug'],
        }

    def names(self, value, resources, alias):
        names = [resources.get(id, EMPTY).get(alias) for id in related_resource_ids(value)]
        return [name for name in names if name]
