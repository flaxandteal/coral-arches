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
    
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter=None):
        from arches_orm.models import Monument, MonumentRevision, Consultation
        with admin():

            sort_nodes = {
                'resourceid': lambda resource: resource.system_reference_numbers.uuid.resourceid,
                'hb_number': lambda resource: resource.heritage_asset_references.hb_number,
                'smr_number': lambda resource: resource.heritage_asset_references.smr_number,
                'ihr_number': lambda resource: resource.heritage_asset_references.ihr_number,
                'garden_number': lambda resource: resource.heritage_asset_references.historic_parks_and_gardens
            }
            resources = []
            tasks = []
            ha_all = Monument.all(lazy=True)
            har_all = MonumentRevision.all(lazy=True)
            consultation_all = Consultation.all(lazy=True)

            heritage_assets = [ha for ha in ha_all if ha.garden_sign_off.status_type_n1 != APPROVED]
            heritage_asset_revisions = [
                har for har in har_all 
                if any(approval.desg_approver.desg_approved_by is None for approval in har.approvals)
            ]
            evaluation_meetings = [c for c in consultation_all if (resourceid := c.system_reference_numbers.uuid.resourceid) and resourceid.startswith('EVM/')]
            
            resources.extend(heritage_assets)
            resources.extend(heritage_asset_revisions)

            total_resources = len(resources)
            sorted_resources = self.sort_resources(resources, sort_nodes, sort_by, sort_order)

            start_index = (page -1) * page_size
            end_index = (page * page_size)
            indexed_resources = sorted_resources[start_index:end_index]

            for resource in indexed_resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)

            for consultation in evaluation_meetings:
                related_ha = consultation.related_monuments_and_areas
                meeting_tasks = []
                for ha in related_ha:
                    match = next((task for task in tasks if task['id'] == str(ha.id)), None)
                    if match:
                        meeting_tasks.append(match)
                for task in meeting_tasks:
                    task['meeting'] = True

            counters = []
            
            return tasks, total_resources, counters
    
    def get_sort_options(self):
        """Return the available sort options for designation tasks."""
        return [
            {'id': 'resourceid', 'name': 'HA number'},
            {'id': 'hb_number', 'name': 'HB number'},
            {'id': 'smr_number', 'name': 'SMR number'},
            {'id': 'ihr_number', 'name': 'IHR number'},
            {'id': 'garden_number', 'name': 'Garden and Parks number'},
        ]
    
    def get_filter_options(self, groupId=None):
        from arches_orm.models import Monument, MonumentRevision, MergeResourceTracker, Consultation
        with admin():
            """Return the available filter options for the designation tasks."""
            # create the entries for the council filter options
            node_alias = Monument._._node_objects_by_alias()
            domain_options = node_alias['council'].config['options']

            domain_values = [{'id': option.get("id"), 'name': option.get("text").get("en"), 'type': 'council'} for option in domain_options]

            return [
                *domain_values,
                {'id': 'approved_cur_d', 'name': 'To be approved by Cur D'},
                {'id': 'approved_spto', 'name': 'To be approved by SPTO'}, 
                {'id': 'stat_date', 'name': 'Statutory Consultee Notification Date'}
        ]

    def get_counters(self):
        return
    
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

            def extract_value(item):
                """Helper function to extract the value from different datatypes"""
                if isinstance(item, ConceptListValueViewModel):
                    return [concept.value.value for concept in item]
                if isinstance(item, ConceptValueViewModel):
                    return item.value.value 
                else:
                    return item

            def get_values(nodes: List, resource):
                values = resource._._values
                resource_values = {}
                
                for node in nodes:
                    value = values.get(node, None)
                    if isinstance(value, list) and value:
                        key = str(node).replace('_', '')
                        if len(value) == 1:
                            resource_values[key] = extract_value(value[0].value)
                        else:
                            resource_values[key] = [extract_value(item.value) for item in value]                   

                return resource_values   

            node_values = get_values(nodes, resource)

            # Additional display values
            node_values['id'] = str(resource.id)
            node_values['resourceid'] = resource.system_reference_numbers.uuid.resourceid # this is pulled from here as the get values is retunrning a list
            print(node_values['resourceid'])
            node_values['state'] = 'HeritageAsset'
            node_values['slugs'] = [
                {'name': 'Add Building', 'slug': 'add-building-workflow'},
                {'name': 'Add Monument', 'slug': 'add-monument-workflow'},
                {'name': 'Add IHR', 'slug': 'add-ihr-workflow'},
                {'name': 'Add Garden', 'slug': 'add-garden-workflow'},
            ]
            
            # Resource specific values
            if isinstance(resource, Monument):
                node_values['model'] = 'Heritage Asset'
            if isinstance(resource, MonumentRevision):
                node_values['model'] = 'Heritage Asset Revision'

            # transform returned values
            date_values = [
                'statutoryconsulteenotificationdatevalue',
                'inputdatevalue'
            ]
            for value in date_values:
                if node_values.get(value):
                    node_values[value] = self.convert_date_str(node_values[value])

            return node_values    

    def sort_resources(self, resources, sort_option, sort_by, sort_order):
        sort_function = sort_option[sort_by]
        resources.sort(key=lambda x: (
                    sort_function(x) is not None, 
                    sort_function(x) if sort_function(x) is not None else None,
                    sort_function(x)
                ), reverse=(sort_order == 'desc'))
        return resources

    def convert_date_str(self, date_str):
        date_obj = parser.parse(date_str)
        return date_obj.strftime("%d-%m-%Y")