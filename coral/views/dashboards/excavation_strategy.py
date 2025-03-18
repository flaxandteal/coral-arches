from arches.app.models.tile import Resource
from datetime import datetime
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities

EXCAVATION_ADMIN_GROUP = "4fbe3955-ccd3-4c5b-927e-71672c61f298"
EXCAVATION_USER_GROUP = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_D = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_E = "214900b1-1359-404d-bba0-7dbd5f8486ef"

class ExcavationTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='createdat', sort_order='desc', filter='all'):
        from arches_orm.models import License
        utilities = Utilities()

        sort_options = ['createdat', 'validuntil']

        licences_all = License.all()

        licences =[l for l in licences_all if l.system_reference_numbers.uuid.resourceid.startswith('EL/')]
        if filter != 'all':
            # Checks the report status against the filter value
            licences = [l for l in licences if self.is_valid_license(l, filter)]
        
        sort_nodes = {
            'validuntildate': lambda resource: resource.decision[0].licence_valid_timespan.valid_until_date,
            'createdat': lambda resource: resource._.resource.createdtime
        }

        # Sort nodes allow us to access the model node value for sorting
        sorted_resources = utilities.sort_resources_date(licences, sort_nodes, sort_by, sort_order)

        # Get total number of resources
        total_resources = len(licences)

        # Build data only for the current page
        start_index = (page -1) * page_size
        end_index = (page * page_size)
        indexed_resources = sorted_resources[start_index:end_index]

        tasks = []

        for resource in indexed_resources:
            task = self.build_data(resource, groupId)
            tasks.append(task)

        counters = []

        return tasks, total_resources, counters

    def get_sort_options(self):
        return [
            {'id': 'createdat', 'name': 'Created At'}, 
            {'id': 'validuntildate', 'name': 'Valid Until'}
        ]
    
    def get_filter_options(self, groupId=None):
        return [
            {'id': 'all', 'name': 'All'},
            {'id': 'final', 'name': 'Final'}, 
            {'id': 'preliminary', 'name': 'Preliminary'}, 
            {'id': 'interim', 'name': 'Interim'}, 
            {'id': 'unclassified', 'name': 'Unclassified'}, 
            {'id': 'summary', 'name': 'Summary'}
        ]
    
    def build_data(self, licence, groupId):
        from arches_orm.models import License
        utilities = Utilities()

        resource_instance = Resource.objects.get(resourceinstanceid = licence.id)
        created_at = resource_instance.createdtime

        activity_list = utilities.node_check(lambda: licence.associated_activities)
        display_name = utilities.node_check(lambda:licence.licence_names.name),
        # issue_date = utilities.node_check(lambda:licence.decision[0].licence_valid_timespan.issue_date)
        cm_reference = utilities.node_check(lambda:licence.cm_references.cm_reference_number)
        valid_until_date = utilities.node_check(lambda:licence.decision[0].licence_valid_timespan.valid_until_date)
        employing_body = utilities.node_check(lambda:licence.contacts.companies.employing_body)
        nominated_directors = utilities.node_check(lambda:licence.contacts.licensees.licensee)
        licence_number = utilities.node_check(lambda:licence.licence_number.licence_number_value)
        nominated_directors_name_list = [utilities.node_check(lambda:director.name[0].full_name) for director in nominated_directors]

        employing_body_name_list = [utilities.node_check(lambda:body.names[0].organization_name) for body in employing_body]

        report_status = utilities.node_check(lambda:licence.application_details.report_classification_type)

        name = display_name[0]
        if name.startswith("Excavation Licence"):
            display_name = name[len("Excavation Licence"):].strip()

        site_name = next(
            (utilities.node_check(lambda:activity.activity_names[0].activity_name) for activity in activity_list if activity and activity.activity_names),
            None
        )

        response_slug = utilities.get_response_slug(groupId) if groupId else None

        # convert date format
        if valid_until_date:
            valid_until_date = datetime.strptime(valid_until_date, "%Y-%m-%dT%H:%M:%S.%f%z").strftime("%d-%m-%Y")

        resource_data = {
            'id': str(licence.id),
            'state': 'Excavation',
            'displayname': display_name,
            'sitename': site_name,
            'createdat': str(created_at),
            'cmreference': cm_reference,
            'validuntildate': valid_until_date,
            'employingbody': employing_body_name_list,
            'nominateddirectors': nominated_directors_name_list,
            'reportstatus': utilities.domain_value_string_lookup(License, 'report_classification_type', report_status), ## will need changed after Taiga #2199 is complete
            'licencenumber': licence_number,
            'responseslug': response_slug
        }
        return resource_data
    
    def is_valid_license(self, licence, filter):
        from arches_orm.models import License
        utilities = Utilities()
        classification_type = utilities.node_check(lambda:licence.application_details.report_classification_type)
        if not classification_type:
            return False
        string_value = utilities.domain_value_string_lookup(License, 'report_classification_type', classification_type)
        return string_value.lower() == filter