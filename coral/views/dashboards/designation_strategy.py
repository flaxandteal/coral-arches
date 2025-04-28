from datetime import datetime
from dateutil import parser
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from arches_orm.view_models import ConceptListValueViewModel, ConceptValueViewModel
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

            def _setup_default_conditions_and_get_count():
                """
                Method applies default class values to the proper ORM models with the default where conditions to grab proper data
                """
                monumentDefaultWhereConditions = { 'status_type_n1__not_equal': APPROVED }
                monumentRevisionDefaultWhereConditions = { 'desg_approved_by': None }
                consultationDefaultWhereConditions = { 'resourceid__startswith': 'EVM/', 'start_date': None }

                self.heritage_assets = Monument.where(**monumentDefaultWhereConditions)
                self.heritage_asset_revisions = MonumentRevision.where(**monumentRevisionDefaultWhereConditions)
                self.evaluation_meetings = Consultation.where(**consultationDefaultWhereConditions)

                # self.heritage_assets_total_count = self.heritage_assets.count()
                # self.heritage_asset_revisions_total_count = self.heritage_asset_revisions.count()
                # self.evaluation_meetings_total_count = self.evaluation_meetings.count()

            def _apply_filters():
                """
                Method apply there where conditions onto global define HA, HAR and EM for filterings
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
                    self.heritage_assets = self.heritage_assets.where(statutory_consultee_notification_date_value__not_equal=None)
                    self.heritage_asset_revisions = None;
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
                """
                Method apply GET selectors to get the records from the models queries
                """
                self.heritage_assets = self.heritage_assets.get() if self.heritage_assets != None else []
                self.heritage_asset_revisions = self.heritage_asset_revisions.get() if self.heritage_asset_revisions != None else []
                self.evaluation_meetings = self.evaluation_meetings.get() if self.evaluation_meetings != None else []

                resources.extend(self.heritage_assets)
                resources.extend(self.heritage_asset_revisions)
                resources.extend(self.evaluation_meetings)

            _setup_default_conditions_and_get_count()
            _apply_filters()
            _apply_selectors()

            total_resources = len(resources)

            start_index = (page -1) * page_size
            end_index = (page * page_size)
        
            # ! I can't develop use the sorting or pagination with emerald asuUnfortunately, emerald currently can't handle sorting by combing 
            # ! three models currently (Monument, MonumentRevision & Consultation)
            # ! There needs to be a join method in emerald, to allow the join of other models, however I don't have time to create this, therefore
            # ! the system below is fine and should be fast enough for the customer. 
            sorted_resources = self.sort_resources(resources, field_accessors, sort_by, sort_order)

 
            indexed_resources = sorted_resources[start_index:end_index]

            print('page_size : ', page_size)

            for resource in indexed_resources:
                if isinstance(resource, Consultation):
                    task = self.build_meeting_data(resource)
                else:
                    task = self.build_data(resource, groupId)
                tasks.append(task)

            counters = self.get_counters()
            
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
                {'id': 'heritage_asset', 'name': 'Heritage Assets', 'type': 'heritage_asset'},
                {'id': 'revision', 'name': 'Designations', 'type': 'revision'},
                {'id': 'meeting', 'name': 'Evaluation Meetings', 'type': 'meetings'},
                *domain_values,
                {'id': 'stat_date', 'name': 'Statutory Consultee Notification Date', 'type': 'date'}
        ]

    def get_counters(self):
        return {
            'Resource Types': {
                'Heritage Assets': len(self.heritage_assets),
                'Designations': len(self.heritage_asset_revisions),
                'Evaluation Meetings': len(self.evaluation_meetings)
            }
        }
    
    def build_data(self, resource, groupId):
        from arches_orm.models import Monument, MonumentRevision
        with admin():

            nodes = [
                'display_name',
                'hmc_reference_number',
                'historic_parks_and_gardens',
                'ihr_number',
                'hb_number',
                'smr_number',
                'monument_type',
                'input_date_value',
                'statutory_consultee_notification_date_value',
            ]

            node_values = self.get_values(nodes, resource)

            # Additional display values
            node_values['id'] = str(resource.id)
            node_values['resourceid'] = resource.system_reference_numbers.uuid.resourceid # this is pulled from here as the get values is retunrning a list

            node_values['state'] = 'HeritageAsset'
            
            # Resource specific values
            if isinstance(resource, Monument):
                node_values['model'] = 'Heritage Asset'
                node_values['slugs'] = [
                {'name': 'Add Building', 'slug': 'add-building-workflow'},
                {'name': 'Add Monument', 'slug': 'add-monument-workflow'},
                {'name': 'Add IHR', 'slug': 'add-ihr-workflow'},
                {'name': 'Add Garden', 'slug': 'add-garden-workflow'},
            ]
            if isinstance(resource, MonumentRevision):
                node_values['model'] = 'Designation'
                node_values['slugs'] = [
                {'name': 'Heritage Asset Designation', 'slug': 'heritage-asset-designation-workflow'},
            ]

            # return the most recent date for this node
            if node_values.get('statutoryconsulteenotificationdatevalue') and isinstance(node_values['statutoryconsulteenotificationdatevalue'], list):
                dates = []
                for date in node_values['statutoryconsulteenotificationdatevalue']:
                    date_obj = parser.parse(date)
                    dates.append(date_obj)
                node_values['statutoryconsulteenotificationdatevalue'] = str(max(dates))

            # transform returned values
            date_values = [
                'statutoryconsulteenotificationdatevalue',
                'inputdatevalue'
            ]
            for value in date_values:
                if node_values.get(value):
                    node_values[value] = self.convert_date_str(node_values[value])

            return node_values  

    def build_meeting_data(self, resource):
        from arches_orm.models import Consultation
        with admin():

            nodes = [
                'display_name_value',
                'log_date',
                'follow_up_meeting_date_value',
                'related_monuments_and_areas',
                'council'
            ]

            node_values = self.get_values(nodes, resource)

            # Additional display values
            node_values['id'] = str(resource.id)
            if node_values.get('relatedmonumentsandareas', None):
                node_values['relatedmonumentsandareas'] = node_values['relatedmonumentsandareas'][0].display_name

            node_values['state'] = 'Meeting'
            node_values['model'] = 'Evaluation Meeting'
            
            # Resource specific values
            node_values['slugs'] = [
            {'name': 'Evaluation Meeting', 'slug': 'evaluation-meeting-workflow'},
            ]

            # transform returned values
            date_values = [
                'logdate',
                'followupmeetingdatevalue'
            ]
            for value in date_values:
                if node_values.get(value):
                    node_values[value] = self.convert_date_str(node_values[value])

            return node_values  

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
    
    # def filter_by_date_value(self, resource):
    #     utilities = Utilities()
    #     approvals = utilities.node_check(lambda:resource.approvals)
    #     for approval in approvals:
    #         match = utilities.node_check(approval.statutory_consultee_notification_date.statutory_consultee_notification_date_value) == None
    #         if match:
    #             return True
    #     return False