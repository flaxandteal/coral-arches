from datetime import datetime
from dateutil import parser
from coral.views.dashboards.base_strategy import TaskStrategy
from querysets_shim.view_models import ConceptListValueViewModel, ConceptValueViewModel
from coral.views.dashboards.sql_query.builder import build_query
from coral.views.dashboards.sql_query.config.designation_config import DESIGNATION_SQL_QUERY_CONFIG
from django.db import connection, DatabaseError
from arches_controlled_lists.models import ListItem
from querysets_shim.adapter import admin
from typing import List


class DesignationTaskStrategy(TaskStrategy):

    # Aliases build_data/build_meeting_data read. `nodes` caps how many alias
    # expressions get built, which is where the seconds go; it does not restrict
    # the tile data returned, so listing these is a speed hint, not a filter.
    DISPLAY_ALIASES = {
        'Monument': [
            'resourceid', 'hmc_reference_number', 'historic_parks_and_gardens',
            'ihr_number', 'hb_number', 'smr_number', 'monument_type',
            'input_date_value', 'statutory_consultee_notification_date_value',
        ],
        'Consultation': [
            'resourceid', 'display_name_value', 'log_date',
            'follow_up_meeting_date_value', 'council', 'related_monuments_and_areas',
        ],
    }
    DISPLAY_ALIASES['MonumentRevision'] = DISPLAY_ALIASES['Monument']

    def display_nodes(self, model_cls, model_name):
        """Node objects for the aliases this dashboard displays, if resolvable."""
        by_alias = model_cls._._node_objects_by_alias()
        nodes = [by_alias[a] for a in self.DISPLAY_ALIASES[model_name] if a in by_alias]
        return nodes or None


    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter='all'):
        from querysets_shim.models import Monument, MonumentRevision, Consultation
        with admin():

            resources = []
            tasks = []

            filter_options = self.get_filter_options(groupId)
            filter_option = next((option for option in filter_options if option['id'] == filter), None)
            filter_dict = {'id': filter_option['id'], 'type': filter_option['type']}

            def run_sql_query(
                    sort_by=sort_by,
                    sort_order=sort_order,
                    page=page,
                    page_size=page_size,
                    count=False
                ):
                offset = (page-1)*page_size
                limit = page_size if isinstance(page_size, int) else 8

                if count:
                    query = build_query(sort_by, count=True, filter=filter_dict, config=DESIGNATION_SQL_QUERY_CONFIG)
                else:
                    reverse = True if sort_order == 'desc' else False
                    query = build_query(sort_by, reverse=reverse, filter=filter_dict, limit=limit, offset=offset, config=DESIGNATION_SQL_QUERY_CONFIG)
                try:
                    with connection.cursor() as cursor:
                        cursor.execute(query)
                        results = cursor.fetchall()
                    return results
                except Exception as e:
                    raise DatabaseError(f"Error executing SQL query: {e}")
            
            def get_counts():
                results = run_sql_query(count=True)
                counts = dict(results)
                total = sum(counts.values())
                counts['total'] = total
                return counts
                
            results = run_sql_query()
            models = {
                'Monument': Monument,
                'MonumentRevision': MonumentRevision,
                'Consultation': Consultation,
            }

            ordered_ids = []
            ids_by_model = {}
            for raw_id, _, model in results:
                resource_id = str(raw_id)
                ordered_ids.append(resource_id)
                if model in models:
                    ids_by_model.setdefault(model, []).append(resource_id)

            found = {}
            for model, ids in ids_by_model.items():
                cls = models[model]
                for instance in cls.find_many(ids, nodes=self.display_nodes(cls, model)):
                    found[str(instance.id)] = instance

            resources = [found[id] for id in ordered_ids if id in found]

            resource_counts = get_counts()
            total_resources = resource_counts.get('total', 0)
            counters = self.get_counters(counts=resource_counts)

            for resource in resources:
                if isinstance(resource, Consultation):
                    task = self.build_meeting_data(resource)
                else:
                    task = self.build_data(resource, groupId)
                tasks.append(task)
            
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
    
    def build_data(self, resource, groupId):
        from querysets_shim.models import Monument, MonumentRevision

        # A nodegroup with no tile reads as None, and a cardinality-n one as [].
        # system_reference_numbers is always present: the query selects on it.
        references = resource.heritage_asset_references
        hmc_reference = resource.hmc_reference
        sign_off = resource.sign_off
        phases = resource.construction_phases
        approvals = resource.approvals

        resource_data = {
            'id': str(resource.id),
            'resourceid': resource.system_reference_numbers.resourceid,
            'state': 'HeritageAsset',
            'displayname': resource._.resource.descriptors.get('en', {}).get('name'),
            'hmcreferencenumber': hmc_reference.hmc_reference_number if hmc_reference else None,
            'historicparksandgardens': references.historic_parks_and_gardens if references else None,
            'ihrnumber': references.ihr_number if references else None,
            'hbnumber': references.hb_number if references else None,
            'smrnumber': references.smr_number if references else None,
            'monumenttype': self.reference_labels(phases[0].monument_type) if phases else None,
            'inputdatevalue': sign_off.input_date_value if sign_off else None,
            'statutoryconsulteenotificationdatevalue': (
                approvals[0].statutory_consultee_notification_date_value if approvals else None
            ),
        }

        if isinstance(resource, Monument):
            resource_data['model'] = 'Heritage Asset'
            resource_data['slugs'] = [
            {'name': 'Add Building', 'slug': 'add-building-workflow'},
            {'name': 'Add Monument', 'slug': 'add-monument-workflow'},
            {'name': 'Add IHR', 'slug': 'add-ihr-workflow'},
            {'name': 'Add Garden', 'slug': 'add-garden-workflow'},
        ]
        if isinstance(resource, MonumentRevision):
            resource_data['model'] = 'Designation'
            resource_data['slugs'] = [
            {'name': 'Heritage Asset Designation', 'slug': 'heritage-asset-designation-workflow'},
        ]
            
        if resource_data.get('statutoryconsulteenotificationdatevalue') and isinstance(resource_data['statutoryconsulteenotificationdatevalue'], list):
            dates = []
            for date in resource_data['statutoryconsulteenotificationdatevalue']:
                date_obj = parser.parse(date)
                dates.append(date_obj)
            resource_data['statutoryconsulteenotificationdatevalue'] = str(max(dates))

        # transform returned values
        date_values = [
            'statutoryconsulteenotificationdatevalue',
            'inputdatevalue'
        ]
        for value in date_values:
            if resource_data.get(value):
                resource_data[value] = self.convert_date_str(resource_data[value])

        return resource_data 
    
    def build_meeting_data(self, resource):
        references = resource.system_reference_numbers
        display_name = resource.display_name
        dates = resource.consultation_dates
        evaluation = resource.evaluation
        location = resource.location_data

        resource_data = {
            'id': str(resource.id),
            'resourceid': references.resourceid if references else None,
            'state': 'Meeting',
            'model': 'Evaluation Meeting',
            'displaynamevalue': display_name.display_name_value if display_name else None,
            'logdate': dates.log_date if dates else None,
            'followupmeetingdatevalue': evaluation.follow_up_meeting_date_value if evaluation else None,
            'council': self.reference_labels(location.council) if location else None,
            'slugs': [{'name': 'Evaluation Meeting', 'slug': 'evaluation-meeting-workflow'}]
        }

        resource_data['relatedmonumentsandareas'] = [
            ha._instance.descriptors.get('en', {}).get('name')
            for ha in resource.related_monuments_and_areas
        ]
        
        # transform returned values
        date_values = [
            'logdate',
            'followupmeetingdatevalue'
        ]
        for value in date_values:
            if resource_data.get(value):
                resource_data[value] = self.convert_date_str(resource_data[value])

        return resource_data  

    def reference_labels(self, references):
        """Labels of a v8 reference node — the card renders these as the Type."""
        labels = [
            ListItem.find_best_label_from_set(reference.labels, 'en')
            for reference in references or []
        ]
        return [label for label in labels if label]

    def extract_value(self, item):
        """Helper function to extract the value from different datatypes"""
        if isinstance(item, ConceptListValueViewModel):
            return [concept.value.value for concept in item]
        if isinstance(item, ConceptValueViewModel):
            return item.value.value 
        else:
            return item

    def get_values(self, nodes: List, resource):
        values = resource._._values
        resource_values = {}
        for node in nodes:
            value = values.get(node, None)
            if isinstance(value, list) and value:
                key = str(node).replace('_', '')
                if len(value) == 1:
                    resource_values[key] = self.extract_value(value[0].value)
                else:
                    resource_values[key] = [self.extract_value(item.value) for item in value]                   

        return resource_values   
    
    def sort_resources(self, resources, field_accessors, sort_by, sort_order):
        # Helper: safely retrieve the sort value
        def safe_sort_value(resource):
            accessors = field_accessors.get(sort_by, {})
            resource_type = type(resource)
            accessor = accessors.get(resource_type)
            if accessor:
                try:
                    return accessor(resource)
                except Exception:
                    return None
            return None

        # Partition resources into those with a valid sort value and those with None
        valid_items = []
        none_items = []
        for r in resources:
            val = safe_sort_value(r)
            if val == 'None' or val == None:
                none_items.append(r)
            else:
                valid_items.append((r, val))
        # Sort the valid items according to sort_order
        reverse = (sort_order == 'desc')
        sorted_valid = sorted(valid_items, key=lambda x: x[1], reverse=reverse)
        
        # Extract the sorted resource objects and append the ones with None
        sorted_resources = [item[0] for item in sorted_valid] + none_items
        return sorted_resources

    def convert_date_str(self, date_str):
        # ? The issue here is that the parse expects a string not a DateViewModel, therefore we convert it to a string
        date_obj = parser.parse(str(date_str))
        return date_obj.strftime("%d-%m-%Y")