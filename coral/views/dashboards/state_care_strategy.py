from coral.views.dashboards.base_strategy import TaskStrategy
from arches_orm.adapter import admin 
from typing import List
import pdb

class StateCareTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter='all'):
        from arches_orm.models import StateCareCondition, RiskAssessment, RangerInspection, Consultation
        with admin():

            resources = []
            tasks = []

            def _setup_default_query():
                curatorial_default_query = { 'resourceid__startswith': 'CIN/', 'sign_off_date_value': None}
                state_care_default_query = {'signed_off_date': None}
                risk_assessment_default_query = {'sign_off_date__isnull': False}  
                ranger_inspection_default_query = {'reviewed_date': None}

                self.curatorial_inspections = Consultation.where(**curatorial_default_query)
                self.state_care_conditions = StateCareCondition.where(**state_care_default_query)
                self.risk_assessments = RiskAssessment.where(**risk_assessment_default_query)
                self.ranger_inspections = RangerInspection.where(**ranger_inspection_default_query)

            def _apply_filters():
                if filter == 'all':
                    return
                
                filter_options = self.get_filter_options
                filter_type = next((option['type'] for option in filter_options if option['id'] == filter), None)
                
                if filter_type == 'state_care':
                    self.curatorial_inspections = None
                    self.risk_assessments = None
                    self.ranger_inspections = None

                if filter_type == 'risk_assessment':
                    self.curatorial_inspections = None
                    self.state_care_conditions = None
                    self.ranger_inspections = None

                if filter_type == 'ranger_inspection':
                    self.curatorial_inspections = None
                    self.state_care_conditions = None
                    self.risk_assessments = None

                if filter_type == 'curatorial_inspection':
                    self.state_care_conditions = None
                    self.risk_assessments = None
                    self.ranger_inspections = None

                if filter_type == 'council':
                    self.curatorial_inspections = self.curatorial_inspections.where(council=filter) 
                    self.state_care_conditions = None
                    self.risk_assessments = None
                    self.ranger_inspections = None

            def _apply_selectors():
                self.curatorial_inspections = self.curatorial_inspections.get() if self.curatorial_inspections != None else []
                self.state_care_conditions = self.state_care_conditions.get() if self.state_care_conditions != None else []
                self.risk_assessments = self.risk_assessments.get() if self.risk_assessments != None else []
                self.ranger_inspections = self.ranger_inspections.get() if self.ranger_inspections != None else []
            
                resources.extend(self.curatorial_inspections)
                resources.extend(self.state_care_conditions)
                resources.extend(self.risk_assessments)
                resources.extend(self.ranger_inspections)

            _setup_default_query()
            _apply_filters()
            _apply_selectors()

            total_resources = len(resources)

            start_index = (page -1) * page_size
            end_index = (page * page_size)
        
            # ! I can't develop use the sorting or pagination with emerald asuUnfortunately, emerald currently can't handle sorting by combing 
            # ! three models currently (Monument, MonumentRevision & Consultation)
            # ! There needs to be a join method in emerald, to allow the join of other models, however I don't have time to create this, therefore
            # ! the system below is fine and should be fast enough for the customer. 

            field_accessors = {
                'completed_on_date': {
                    Consultation: lambda r: r.consultation_dates.log_date,
                    RiskAssessment: lambda r: r.sign_off.assessment_date,
                    RangerInspection: lambda r: r.sign_off.report_submission_date,
                    StateCareCondition: lambda r: r.sign_off.completed_on
                },
                'completed_by': {
                    Consultation: lambda r: r.report_subimtted_by.report_submitted_by_value,
                    RiskAssessment: lambda r: r.sign_off.assessment_done_by,
                    RangerInspection: lambda r: r.sign_off.submitted_by,
                    StateCareCondition: lambda r: r.sign_off.completed_by_group.completed_by
                }
            }

            sorted_resources = self.sort_resources(resources, field_accessors, sort_by, sort_order)

 
            indexed_resources = sorted_resources[start_index:end_index]

            print('page_size : ', page_size)

            for resource in indexed_resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)

            counters = self.get_counters()
            
            return tasks, total_resources, counters

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
                    return ""
            return ""
        
        reverse = (sort_order == 'desc')
        sorted_resources = sorted(resources, key=lambda x: safe_sort_value(x), reverse=reverse)
        return sorted_resources
    
    def get_filter_options(self, groupId=None):
        from arches_orm.models import Monument
        with admin():
            """Return the available filter options for the state care tasks."""

            # create the entries for the council filter options
            node_alias = Monument._._node_objects_by_alias()
            domain_options = node_alias['council'].config['options']

            council_values = [
                {
                    'id': option.get("text").get("en"), 
                    'name': option.get("text").get("en"), 
                    'type': 'council'
                } 
                for option in domain_options
            ]

            return [
                {'id': 'all', 'name': 'All', 'type': 'default'},
                {'id': 'heritage_asset', 'name': 'Heritage Assets', 'type': 'heritage_asset'},
                {'id': 'state_care', 'name': 'State Care Condition Survey', 'type': 'state_care'},
                {'id': 'risk_assessment', 'name': 'Risk Assessment', 'type': 'risk_assessment'},
                {'id': 'ranger_inspection', 'name': 'Ranger Inspection', 'type': 'ranger_inspection'},
                {'id': 'curatorial_inspection', 'name': 'Curatorial Inspection', 'type': 'curatorial_inspection'},
                {'id': 'completed_by', 'name': 'Completed by', 'type': 'completed_by'},
                {'id': 'completed_on_date', 'name': 'Completed on date', 'type': 'completed_on'},
            ]

    def get_counters(self):
        return {
            'Resource Types': {
                'State Care Condition Surveys': len(self.state_care_conditions),
                'Risk Assessments': len(self.risk_assessments),
                'Ranger Inspections': len(self.ranger_inspections),
                'Curatorial Inspections': len(self.curatorial_inspections)
            }
        }

    def build_data(self, resource, groupId):
        from arches_orm.models import StateCareCondition, RiskAssessment, RangerInspection, Consultation
        with admin():

            CONFIG_MAPPING = {
                StateCareCondition: {
                    'model': 'State Care Condition Survey',
                    'slug': 'state-care-condition-survey-workflow',
                    'nodes': 
                        [
                            ('heritage_asset', 'related_ha'),
                            'completed_by',
                            'completed_on',
                            'resourceid'
                        ]     
                },
                RiskAssessment: {
                    'model': 'Risk Assessment',
                    'slug': 'risk-assessment-workflow',
                    'nodes': 
                    [
                        ('associated_heritage_assets', 'related_ha'),
                        'assessment_date',
                        'assessment_done_by',
                        'resourceid'
                    ]
                },
                RangerInspection: {
                    'model': 'Ranger Inspection',
                    'slug': 'ranger-inspection-workflow',
                    'nodes': 
                    [
                        ('related_heritage_assets', 'related_ha'),
                        'report_submission_date',
                        'submitted_by',
                        'resourceid'
                    ]
                },
                Consultation: {
                    'model': 'Curatorial Inspection',
                    'slug': 'curatorial-inspection-workflow',
                    'nodes': 
                    [
                        'reviewed_by_value',
                        'log_date',
                        ('related_mounments_and_areas', 'related_ha'),
                        'resourceid'
                    ]
                }
            }

            def fetch_heritage_asset_data(heritage_asset):
                monument_nodes = [
                    'townland',
                    'council',
                    'smr_number'
                ]

                monument_values = get_values(monument_nodes, heritage_asset[0])

                return monument_values

            
            def get_values(nodes: List, resource):
                values = resource._._values
                if isinstance(resource, RiskAssessment):
                    print("A Test ", resource.details.property_status)
                    print("MY VALUES", values)
                    pdb.set_trace()
                resource_values = {}
                for node in nodes:
                    key = str(node).replace('_', '')

                    if isinstance(node, tuple):
                        node_alias, key = node
                        key = str(key).replace('_', '')
                    else:
                        node_alias = node
                    value = values.get(node_alias, None)
                    if isinstance(value, list) and value:
                        if len(value) == 1:
                            resource_values[key] = value[0].value
                        else:
                            resource_values[key] = [item.value for item in value]            
                return resource_values 

            for graph, config in CONFIG_MAPPING.items():
                # Set model specific nodes from config
                if isinstance(resource, graph):
                    node_values = get_values(config.get('nodes', []), resource)
                    node_values['model'] = config.get('model')
                    node_values['slug'] = config.get('slug')
                    node_values['state'] = 'statecare'
                
                    # Set common values
                    node_values['id'] = str(resource.id)

                    # Get Heritage Asset Node details
                    if node_values.get('relatedha', None):
                        ha_values = fetch_heritage_asset_data(node_values.get('relatedha'))
                        node_values.update(ha_values)
                        node_values.pop('relatedha')
            
            return node_values
        
    def get_sort_options(self):
        """Return the available sort options for designation tasks."""
        return [
            {'id': 'resourceid', 'name': 'Resource'},
        ]
    
