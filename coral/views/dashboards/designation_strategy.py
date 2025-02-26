from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from arches_orm.view_models import ConceptListValueViewModel, ConceptValueViewModel
from typing import List
import pdb

SECOND_SURVEY_GROUP = '1ce90bd5-4063-4984-931a-cc971414d7db'
DESIGNATIONS_GROUP = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'

APPROVED = "294f38d0-e391-4f7d-af83-72fbf7fcdfcb"
PROVISIONAL = "7f81d135-45ac-483f-96f4-2fa8ca882d79"

class DesignationTaskStrategy(TaskStrategy):
    
    def get_tasks(self, groupId, userResourceId, sort_by='resourceid', sort_order=None, filter=None):
        from arches_orm.models import Monument
        sort_options = [
              {'id': 'resourceid', 'name': 'HA number'},
              {'id': 'hb_number', 'name': 'HB number'},
              {'id': 'smr_number', 'name': 'SMR number'},
              {'id': 'ihr_number', 'name': 'IHR number'},
              {'id': 'garden_number', 'name': 'Garden and Parks number'},
              {'id': 'evaluation_reference', 'name': 'Evaluation reference'},
              {'id': 'revision_reference', 'name': 'Revision reference'},
        ]
        filter_options = []
        counters = []
        tasks = []
        ha_all = Monument.all(lazy=True)

        heritage_assets = [ha for ha in ha_all if ha.garden_sign_off.status_type_n1 != APPROVED]

        for ha in heritage_assets:
            task = self.build_data(ha, groupId)
            tasks.append(task)
        print("TASKS", tasks)
        return tasks, counters, sort_options, filter_options
    def build_data(self, resource, groupId):
        from arches_orm.models import Monument

        nodes = [
            'resourceid',
            'display_name',
            'hmc_reference_number',
            'historic_parks_and_gardens',
            'ihr_number',
            'hb_number',
            'smr_number',
            'monument_type',
            'input_date',
            'statutory_consultee_notification_date_value'
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
                print(node, value)
                if isinstance(value, list) and value:
                    key = str(node).replace('_', '')
                    print("V", value)
                    if len(value) == 1:
                        resource_values[key] = extract_value(value[0].value)
                    else:
                        resource_values[key] = [extract_value(item.value) for item in value]                   

            return resource_values   

        node_values = get_values(nodes, resource)

        # Additional display values
        node_values['id'] = str(resource.id)
        node_values['responseslug'] = Utilities().get_response_slug(groupId) if groupId else None
        node_values['state'] = 'HeritageAsset'
        node_values['slugs'] = [
            {'name': 'Add Building', 'slug': 'add-building-workflow'},
            {'name': 'Add Monument', 'slug': 'add-monument-workflow'},
            {'name': 'Add IHR', 'slug': 'add-ihr-workflow'},
            {'name': 'Add Garden', 'slug': 'add-garden-workflow'},
        ]

        return node_values         