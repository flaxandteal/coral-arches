from dateutil import parser
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.sql_query.builder import build_query
from coral.views.dashboards.sql_query.config.designation_config import DESIGNATION_SQL_QUERY_CONFIG
from coral.utils.reference_values import reference_label
from django.db import connection, DatabaseError
from arches_controlled_lists.models import ListItem
from querysets_shim.adapter import admin
from querysets_shim.values import EMPTY, descriptor_names, values_by_resource, related_resource_ids


class DesignationTaskStrategy(TaskStrategy):

    HERITAGE_ASSET_ALIASES = [
        'resourceid', 'hmc_reference_number', 'historic_parks_and_gardens',
        'ihr_number', 'hb_number', 'smr_number', 'monument_type',
        'input_date_value', 'statutory_consultee_notification_date_value',
    ]
    MEETING_ALIASES = [
        'resourceid', 'display_name_value', 'log_date',
        'follow_up_meeting_date_value', 'council', 'related_monuments_and_areas',
    ]

    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter='all'):
        from querysets_shim.models import Monument, MonumentRevision, Consultation
        with admin():
            filter_options = self.get_filter_options(groupId)
            filter_option = next((option for option in filter_options if option['id'] == filter), None)
            filter_dict = {'id': filter_option['id'], 'type': filter_option['type']}

            def run_sql_query(count=False):
                if count:
                    query = build_query(sort_by, count=True, filter=filter_dict, config=DESIGNATION_SQL_QUERY_CONFIG)
                else:
                    limit = page_size if isinstance(page_size, int) else 8
                    query = build_query(sort_by, reverse=sort_order == 'desc', filter=filter_dict,
                                        limit=limit, offset=(page - 1) * limit, config=DESIGNATION_SQL_QUERY_CONFIG)
                try:
                    with connection.cursor() as cursor:
                        cursor.execute(query)
                        return cursor.fetchall()
                except Exception as e:
                    raise DatabaseError(f"Error executing SQL query: {e}")

            rows = [(str(raw_id), model) for raw_id, _, model in run_sql_query()]
            page_ids = [id for id, _ in rows]

            def ids_of(model):
                return [id for id, row_model in rows if row_model == model]

            fields = {
                **values_by_resource(Monument, ids_of('Monument'), self.HERITAGE_ASSET_ALIASES),
                **values_by_resource(MonumentRevision, ids_of('MonumentRevision'), self.HERITAGE_ASSET_ALIASES),
                **values_by_resource(Consultation, ids_of('Consultation'), self.MEETING_ALIASES),
            }

            related_ha = []
            for values in fields.values():
                related_ha += related_resource_ids(values.get('related_monuments_and_areas'))

            prefetched = {
                'fields': fields,
                'names': descriptor_names(page_ids + related_ha),
            }

            counts = dict(run_sql_query(count=True))
            total_resources = sum(counts.values())
            counters = self.get_counters(counts=counts)

            tasks = []
            for id, model in rows:
                if model == 'Consultation':
                    tasks.append(self.build_meeting_data(id, prefetched))
                elif model in ('Monument', 'MonumentRevision'):
                    tasks.append(self.build_data(id, model, prefetched))

            return tasks, total_resources, counters

    def get_sort_options(self):
        """Return the available sort options for designation tasks."""
        return [
            {'id': 'resourceid', 'name': 'HA number'},
            {'id': 'hb_number', 'name': 'HB number'},
            {'id': 'smr_number', 'name': 'SMR number'},
            {'id': 'ihr_number', 'name': 'IHR number'},
            {'id': 'historic_parks_and_gardens', 'name': 'Garden and Parks number'},
        ]
    
    def get_filter_options(self, groupId=None):
        from querysets_shim.models import Monument
        with admin():
            """Return the available filter options for the designation tasks."""
            # Create the entries for the council filter options. Council is a
            # `reference` node, so its options come from a controlled list rather
            # than from the node config. Heritage Asset and Heritage Asset Revision
            # use separate council lists whose item ids differ, so the filter value
            # is the LA code from the label ("LA01 - Causeway Coast..." -> "LA01"),
            # which both lists share and which the SQL matches on.
            node_alias = Monument._._node_objects_by_alias()
            council_list_id = node_alias['council'].config['controlledList']

            council_items = ListItem.objects.filter(list_id=council_list_id)

            domain_values = []
            for item in council_items:
                label = item.find_best_label('en')
                if not label:
                    continue
                code = label.split(' - ')[0]
                domain_values.append({'id': code, 'name': label, 'type': 'council'})
            domain_values.sort(key=lambda council: council['id'])

            return [
                {'id': 'all', 'name': 'All', 'type': 'default'},
                {'id': 'Monument', 'name': 'Heritage Assets', 'type': 'heritage_asset'},
                {'id': 'MonumentRevision', 'name': 'Designations', 'type': 'revision'},
                {'id': 'Consultation', 'name': 'Evaluation Meetings', 'type': 'meetings'},
                *domain_values,
                {'id': 'stat_date', 'name': 'Statutory Consultee Notification Date', 'type': 'date'}
        ]

    def get_counters(self, counts):
        return {
            'Resource Types': {
                'Heritage Assets': counts.get('Monument', 0),
                'Designations': counts.get('MonumentRevision', 0),
                'Evaluation Meetings': counts.get('Consultation', 0)
            }
        }
    
    def build_data(self, resource_id, model, prefetched):
        values = prefetched['fields'].get(resource_id, EMPTY)
        notification_dates = [d for d in values.all('statutory_consultee_notification_date_value') if d]

        resource_data = {
            'id': resource_id,
            'resourceid': values.get('resourceid'),
            'state': 'HeritageAsset',
            'displayname': prefetched['names'].get(resource_id),
            'hmcreferencenumber': values.get('hmc_reference_number'),
            'historicparksandgardens': values.get('historic_parks_and_gardens'),
            'ihrnumber': values.get('ihr_number'),
            'hbnumber': values.get('hb_number'),
            'smrnumber': values.get('smr_number'),
            'monumenttype': self.reference_labels(values.get('monument_type')),
            'inputdatevalue': values.get('input_date_value'),
            'statutoryconsulteenotificationdatevalue': (
                max(notification_dates, key=parser.parse) if notification_dates else None
            ),
        }

        if model == 'Monument':
            resource_data['model'] = 'Heritage Asset'
            resource_data['slugs'] = [
                {'name': 'Add Building', 'slug': 'add-building-workflow'},
                {'name': 'Add Monument', 'slug': 'add-monument-workflow'},
                {'name': 'Add IHR', 'slug': 'add-ihr-workflow'},
                {'name': 'Add Garden', 'slug': 'add-garden-workflow'},
            ]
        else:
            resource_data['model'] = 'Designation'
            resource_data['slugs'] = [
                {'name': 'Heritage Asset Designation', 'slug': 'heritage-asset-designation-workflow'},
            ]

        for value in ['statutoryconsulteenotificationdatevalue', 'inputdatevalue']:
            if resource_data.get(value):
                resource_data[value] = self.convert_date_str(resource_data[value])

        return resource_data

    def build_meeting_data(self, resource_id, prefetched):
        values = prefetched['fields'].get(resource_id, EMPTY)
        related_ha = related_resource_ids(values.get('related_monuments_and_areas'))

        resource_data = {
            'id': resource_id,
            'resourceid': values.get('resourceid'),
            'state': 'Meeting',
            'model': 'Evaluation Meeting',
            'displaynamevalue': values.get('display_name_value'),
            'logdate': values.get('log_date'),
            'followupmeetingdatevalue': values.get('follow_up_meeting_date_value'),
            'council': self.reference_labels(values.get('council')),
            'relatedmonumentsandareas': [prefetched['names'].get(ha) for ha in related_ha],
            'slugs': [{'name': 'Evaluation Meeting', 'slug': 'evaluation-meeting-workflow'}]
        }

        for value in ['logdate', 'followupmeetingdatevalue']:
            if resource_data.get(value):
                resource_data[value] = self.convert_date_str(resource_data[value])

        return resource_data

    def reference_labels(self, value):
        """One label per selection — the card does `foreach` over the Type."""
        labels = [reference_label([entry]) for entry in value or []]
        return [label for label in labels if label]

    def convert_date_str(self, date_str):
        # ? The issue here is that the parse expects a string not a DateViewModel, therefore we convert it to a string
        date_obj = parser.parse(str(date_str))
        return date_obj.strftime("%d-%m-%Y")