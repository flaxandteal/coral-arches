from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from arches_orm.view_models import ConceptListValueViewModel, ConceptValueViewModel
from arches_orm.adapter import admin 
from typing import List
from datetime import datetime
import pdb

class StateCareTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceid', sort_order='desc', filter='all'):
        from arches_orm.models import StateCareCondition, RiskAssessment, RangerInspection, Consultation
        with admin():

            resources = []
            tasks = []

            def _setup_default_query():
                curatorial_default_query = { 'resourceid__startswith': 'CIN/', 'report_submitted_by_value__isnull': True}
                state_care_default_query = {'signed_off_by__isnull': True}
                risk_assessment_default_query = {'sign_off_by__isnull': True}  
                ranger_inspection_default_query = {'reviewed_by__isnull': True}

                # had to add the or_where due to an issue with null not setting correctly on the node
                self.curatorial_inspections = Consultation.where(**curatorial_default_query).or_where(resourceid__startswith='CIN/',report_submitted_by_value=None)
                self.state_care_conditions = StateCareCondition.where(**state_care_default_query).or_where(signed_off_by=None)
                self.risk_assessments = RiskAssessment.where(**risk_assessment_default_query).or_where(sign_off_by=None)
                self.ranger_inspections = RangerInspection.where(**ranger_inspection_default_query).or_where(reviewed_by=None)

            def _apply_filters():
                if filter == 'all':
                    return
                
                filter_options = self.get_filter_options()
                filter_type = next((option['id'] for option in filter_options if option['id'] == filter), None)
                
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

                # if filter_type == 'council':
                #     self.curatorial_inspections = self.curatorial_inspections.where(council=filter) 
                #     self.state_care_conditions = None
                #     self.risk_assessments = None
                #     self.ranger_inspections = None

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
            if not accessor:
                return ""
            try:
                val = accessor(resource)
            except Exception:
                return ""
            if val is None:
                return ""
            if isinstance(val, list):
                return val[0] if val else ""
            return str(val)
        
        reverse = (sort_order == 'desc')
        sorted_resources = sorted(resources, key=lambda x: (x is None, safe_sort_value(x)), reverse=reverse)
        return sorted_resources
    
    def get_filter_options(self, groupId=None):
        from arches_orm.models import Monument
        with admin():
            """Return the available filter options for the state care tasks."""

            # create the entries for the council filter options ! unused until reverse queries available
            # node_alias = Monument._._node_objects_by_alias()
            # domain_options = node_alias['council'].config['options']

            # council_values = [
            #     {
            #         'id': option.get("text").get("en"), 
            #         'name': option.get("text").get("en"), 
            #         'type': 'council'
            #     } 
            #     for option in domain_options
            # ]

            return [
                {'id': 'all', 'name': 'All', 'type': 'default'},
                {'id': 'state_care', 'name': 'State Care Condition Survey', 'type': 'state_care'},
                {'id': 'risk_assessment', 'name': 'Risk Assessment', 'type': 'risk_assessment'},
                {'id': 'ranger_inspection', 'name': 'Ranger Inspection', 'type': 'ranger_inspection'},
                {'id': 'curatorial_inspection', 'name': 'Curatorial Inspection', 'type': 'curatorial_inspection'},
                # *council_values
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
        data = {}
        if isinstance(resource, StateCareCondition):
            data = self.build_data_state_care(resource)
        if isinstance(resource, RiskAssessment):
            data = self.build_data_risk(resource)
        if isinstance(resource, RangerInspection):
            data = self.build_data_ranger(resource)
        if isinstance(resource, Consultation):
            data = self.build_data_curatorial(resource)

        related_ha = data.pop('relatedha', [])

        ha_data = self.fetch_heritage_asset_data(related_ha)

        if ha_data:
            data.update(ha_data)

        # convert date times
        if data['date']:
            data['date'] = datetime.strptime(str(data['date']), "%Y-%m-%dT%H:%M:%S.%f%z").strftime("%d-%m-%Y")
        
        return data
    
    def extract_person_name(self, person):
        if person:
            return list(map(lambda p: p.name[0].full_name,  person))
            

    def build_data_curatorial(self, resource):

        reviewed_by = str(resource.sign_off.reviewed_by.reviewed_by_value)
        input_date = resource.sign_off.sign_off_date.sign_off_date_value
        related_ha = resource.related_monuments_and_areas
        
        resource_data = {
            'id': str(resource.id),
            'state': 'State',
            'displayname': resource._.resource.descriptors['en']['name'],
            'userheading': 'Assessment done by',
            'dateheading': 'Assessment Date',
            'inputby': reviewed_by,
            'date': input_date,
            'slug': 'curatorial-workflow',
            'model': 'Curatorial Inspection',
            'relatedha': related_ha
        }

        return resource_data
    
    def build_data_risk(self, resource):

        assessment_date = resource.sign_off.assessment_date
        assessment_done_by = self.extract_person_name(resource.sign_off.assessment_done_by)
        related_ha = resource.associated_heritage_assets
        
        resource_data = {
            'id': str(resource.id),
            'state': 'State',
            'displayname': resource._.resource.descriptors['en']['name'],
            'userheading': 'Assessment done by',
            'dateheading': 'Assessment date',
            'inputby': assessment_done_by,
            'date': assessment_date,
            'slug': 'risk-assessment-workflow',
            'model': 'Risk Assessment',
            'relatedha': related_ha
        }

        return resource_data
        
    def build_data_ranger(self, resource):

        report_date = resource.sign_off.report_submission_date
        submitted_by = self.extract_person_name(resource.sign_off.submitted_by)
        related_ha = resource.related_heritage_assets
        
        resource_data = {
            'id': str(resource.id),
            'state': 'State',
            'displayname': resource._.resource.descriptors['en']['name'],
            'userheading': 'Submitted by',
            'inputby': submitted_by,
            'dateheading': 'Report Submission Date',
            'date': report_date,
            'slug': 'ranger-inspection-workflow',
            'model': 'Ranger Inspection',
            'relatedha': related_ha
        }

        return resource_data
        
    def build_data_state_care(self, resource):

        completed_by = self.extract_person_name(resource.sign_off.completed_by_group.completed_by)
        completed_on = resource.sign_off.completed_on
        related_ha = resource.heritage_asset
        
        resource_data = {
            'id': str(resource.id),
            'state': 'State',
            'displayname': resource._.resource.descriptors['en']['name'],
            'userheading': 'Completed by',
            'dateheading': 'Completed on date',
            'inputby': completed_by,
            'date': completed_on,
            'slug': 'state-care-condition-workflow',
            'model': 'State Care Condition',
            'relatedha': related_ha
        }

        return resource_data
    
    def extract_value(self, item):
        """Helper function to extract the value from different datatypes"""
        if isinstance(item, ConceptListValueViewModel):
            return [concept.value.value for concept in item]
        if isinstance(item, ConceptValueViewModel):
            return item.value.value 
        else:
            return item
        
    def fetch_heritage_asset_data(self, resource_list):
                utilities = Utilities()

                heritage_asset = resource_list[0] if resource_list else None

                if not heritage_asset:
                    return None

                townland_concepts = utilities.node_check(lambda: heritage_asset.location_data.addresses[0].townlands.townland)
                townlands = self.extract_value(townland_concepts)
                council = utilities.node_check(lambda: heritage_asset.location_data.council)
            
                ha_refs = []
                
                for val in (
                    heritage_asset.heritage_asset_references.ihr_number,
                    heritage_asset.heritage_asset_references.hb_number,
                    heritage_asset.heritage_asset_references.smr_number,
                    heritage_asset.heritage_asset_references.historic_parks_and_gardens
                ):
                    if val and val != 'None':
                        ha_refs.append(val)

                ha_values_dict = {
                    'townland': townlands,
                    'council': council,
                    'haref': ha_refs
                }


                return ha_values_dict
        
    def get_sort_options(self):
        """Return the available sort options for designation tasks."""
        return [
            {'id': 'resourceid', 'name': 'Resource'},
            {'id': 'completed_on_date', 'name': 'Date Completed/Assessed'},
            {'id': 'completed_by', 'name': 'Completed/Assessed by'}
        ]

