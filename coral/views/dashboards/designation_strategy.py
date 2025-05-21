from datetime import datetime
from dateutil import parser
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from arches_orm.view_models import ConceptListValueViewModel, ConceptValueViewModel
from coral.views.dashboards.sql_query import build_query
from django.db import connection
from arches_orm.adapter import admin 
from typing import List
import pdb

SECOND_SURVEY_GROUP = '1ce90bd5-4063-4984-931a-cc971414d7db'
DESIGNATIONS_GROUP = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'

APPROVED = "294f38d0-e391-4f7d-af83-72fbf7fcdfcb"
PROVISIONAL = "7f81d135-45ac-483f-96f4-2fa8ca882d79"

COUNCIL_NODE = "447973ce-d7e2-11ee-a4a1-0242ac120006"

class DesignationTaskStrategy(TaskStrategy):
    
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter='all'):
        from arches_orm.models import Monument, MonumentRevision, Consultation
        with admin():

            field_accessors = {
                'resourceid': {
                    Consultation: lambda r: r.related_monuments_and_areas[0].system_reference_numbers.uuid.resourceid,
                    Monument: lambda r: r.system_reference_numbers.uuid.resourceid,
                    MonumentRevision: lambda r: r.system_reference_numbers.uuid.resourceid
                },
                'hb_number': {
                    Consultation: lambda r: r.related_monuments_and_areas[0].heritage_asset_references.hb_number,
                    Monument: lambda r: r.heritage_asset_references.hb_number,
                    MonumentRevision: lambda r: r.heritage_asset_references.hb_number
                },
                'smr_number': {
                    Consultation: lambda r: r.related_monuments_and_areas[0].heritage_asset_references.smr_number,
                    Monument: lambda r: r.heritage_asset_references.smr_number,
                    MonumentRevision: lambda r: r.heritage_asset_references.smr_number
                },
                'ihr_number': {
                    Consultation: lambda r: r.related_monuments_and_areas[0].heritage_asset_references.ihr_number,
                    Monument: lambda r: r.heritage_asset_references.ihr_number,
                    MonumentRevision: lambda r: r.heritage_asset_references.ihr_number
                },
                'historic_parks_and_gardens': {
                    Consultation: lambda r: r.related_monuments_and_areas[0].heritage_asset_references.historic_parks_and_gardens,
                    Monument: lambda r: r.heritage_asset_references.historic_parks_and_gardens,
                    MonumentRevision: lambda r: r.heritage_asset_references.historic_parks_and_gardens
                }
            }

            resources = []
            tasks = []

            def run_sql_query(
                    sort_by=sort_by, 
                    sort_order=sort_order, 
                    filter=filter, 
                    page=page, 
                    page_size=page_size, 
                    count=False
                ):

                offset = (page-1)*page_size
                limit = page_size if isinstance(page_size, int) else 8

                filter_options = self.get_filter_options(groupId)
                filter_type = next((option['type'] for option in filter_options if option['id'] == filter), None)
                filter_dict = {'id': filter, 'type': filter_type}

                if count:
                    query = build_query(sort_by, count=True)
                else:
                    reverse = True if sort_order == 'desc' else False
                    query = build_query(sort_by, reverse=reverse, filter=filter_dict, limit=limit, offset=offset)

                with connection.cursor() as cursor:
                    cursor.execute(query)
                    results = cursor.fetchall()
                return results
            
            def get_counts():
                results = run_sql_query(count=True)
                counts = dict(results)
                total = sum(counts.values())
                counts['total'] = total
                return counts
                

            def _setup_default_conditions_and_get_count():
                monumentDefaultWhereConditions = { 'status_type_n1': 'Provisional' }
                # ! Strangly enough when using isnull on a resource list this doesn't work. This is due to internal SQL methods not casting Null or None properly
                # ! towards the backend within the annotations/expressions
                # ! https://github.com/flaxandteal/arches-orm/blob/emerald/0.3.2/arches_orm/arches_django/query_builder/annotations/expressions/expressions_postgresql.py#L21
                monumentRevisionDefaultWhereConditions = { 'desg_approved_by': None }
                consultationDefaultWhereConditions = { 'resourceid__startswith': 'EVM/', 'start_date__isnull': True }

                self.heritage_assets = Monument.where(**monumentDefaultWhereConditions)
                self.heritage_asset_revisions = MonumentRevision.where(**monumentRevisionDefaultWhereConditions)
                self.evaluation_meetings = Consultation.where(**consultationDefaultWhereConditions).or_where(start_date=None, resourceid__startswith='EVM/').or_where(start_date='null', resourceid__startswith='EVM/')

            def _apply_filters():
                """
                Method apply there where conditions onto  
                """
                if filter == 'all':
                    return;
            
                filter_options = self.get_filter_options(groupId)
                filter_type = next((option['type'] for option in filter_options if option['id'] == filter), None)

                if filter_type == 'council':        
                    self.heritage_assets = self.heritage_assets.where(council=filter)
                    self.heritage_asset_revisions = self.heritage_asset_revisions.where(council=filter)
                    self.evaluation_meetings = self.evaluation_meetings.where(council=filter)

                elif filter_type == 'date': 
                    self.heritage_asset_revisions = self.heritage_asset_revisions.where(statutory_consultee_notification_date_value__isnull=False)
                    self.heritage_assets = self.heritage_assets.where(statutory_consultee_notification_date_value__isnull=False)
                    self.evaluation_meetings = None;

                elif filter_type == 'heritage_asset':
                    self.heritage_asset_revisions = None;
                    self.evaluation_meetings = None;
                
                elif filter_type == 'revision':
                    self.heritage_assets = None;
                    self.evaluation_meetings = None;

                elif filter_type == 'meetings':
                    self.heritage_assets = None;
                    self.heritage_asset_revisions = None;

            def _apply_selectors():
                self.heritage_assets = self.heritage_assets.get() if self.heritage_assets != None else []
                self.heritage_asset_revisions = self.heritage_asset_revisions.get() if self.heritage_asset_revisions != None else []
                self.evaluation_meetings = self.evaluation_meetings.get() if self.evaluation_meetings != None else []

                resources.extend(self.heritage_assets)
                resources.extend(self.heritage_asset_revisions)
                resources.extend(self.evaluation_meetings)

            results = run_sql_query()
            resources = []
            for item in results:
                model = item[2]
                id = item[0]
                instance = None
                if model == 'Monument':
                    instance = Monument.find(str(id))
                elif model == 'MonumentRevision':
                    instance = MonumentRevision.find(str(id))
                elif model == 'Consultation':
                    instance = Consultation.find(str(id))
                if instance:
                    resources.append(instance)

            # _setup_default_conditions_and_get_count()
            # _apply_filters()
            # _apply_selectors()

            resource_counts = get_counts()
            total_resources = resource_counts.get('total', 0)
            counters = self.get_counters(counts=resource_counts)

            # start_index = (page -1) * page_size
            # end_index = (page * page_size)
        
            # # ! I can't develop use the sorting or pagination with emerald asuUnfortunately, emerald currently can't handle sorting by combing 
            # # ! three models currently (Monument, MonumentRevision & Consultation)
            # # ! There needs to be a join method in emerald, to allow the join of other models, however I don't have time to create this, therefore
            # # ! the system below is fine and should be fast enough for the customer. 
            # sorted_resources = self.sort_resources(resources, field_accessors, sort_by, sort_order)

 
            # indexed_resources = sorted_resources[start_index:end_index]

            # print('page_size : ', page_size)

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
        from arches_orm.models import Monument
        with admin():
            """Return the available filter options for the designation tasks."""
            # create the entries for the council filter options
            node_alias = Monument._._node_objects_by_alias()
            domain_options = node_alias['council'].config['options']

            domain_values = [{'id': option.get("id"), 'name': option.get("text").get("en"), 'type': 'council'} for option in domain_options]

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
        from arches_orm.models import Monument, MonumentRevision

        utilities = Utilities()

        resource_data = {
            'id': str(resource.id),
            'resourceid': resource.system_reference_numbers.uuid.resourceid,
            'state': 'HeritageAsset',
            'displayname': resource._.resource.descriptors['en']['name'],
            'hmcreferencenumber': resource.hmc_reference.hmc_reference_number,
            'historicparksandgardens': resource.heritage_asset_references.historic_parks_and_gardens,
            'ihrnumber': resource.heritage_asset_references.ihr_number,
            'hbnumber': resource.heritage_asset_references.hb_number,
            'smrnumber': resource.heritage_asset_references.smr_number,
            'monumenttype': self.extract_value(utilities.node_check(lambda: resource.construction_phases[0].phase_classification.monument_type)),
            'inputdatevalue': resource.garden_sign_off.input_date.input_date_value,
            'statutoryconsulteenotificationdatevalue': utilities.node_check(lambda: resource.approvals[0].statutory_consultee_notification_date.statutory_consultee_notification_date_value)
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
        resource_data = {
            'id': str(resource.id),
            'resourceid': resource.system_reference_numbers.uuid.resourceid,
            'state': 'Meeting',
            'model': 'Evaluation Meeting',
            'displaynamevalue': resource.display_name.display_name_value,
            'logdate': resource.consultation_dates.log_date,
            'followupmeetingdatevalue': resource.evaluation.follow_up_meeting_date.follow_up_meeting_date_value,
            'council': resource.location_data.council,
            'slugs': [{'name': 'Evaluation Meeting', 'slug': 'evaluation-meeting-workflow'}]
        }

        # Additional display values
        related_monuments = resource.related_monuments_and_areas

        ha_names = []
        for ha in related_monuments:
            ha_name = ha._.resource.descriptors['en']['name']
            ha_names.append(ha_name)
        
        resource_data['relatedmonumentsandareas'] = ha_names
        
        # transform returned values
        date_values = [
            'logdate',
            'followupmeetingdatevalue'
        ]
        for value in date_values:
            if resource_data.get(value):
                resource_data[value] = self.convert_date_str(resource_data[value])

        return resource_data  

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