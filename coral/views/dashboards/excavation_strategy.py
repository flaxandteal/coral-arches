from arches.app.models.tile import Resource
from datetime import datetime
from coral.views.dashboards.base_strategy import TaskStrategy
from coral.views.dashboards.dashboard_utils import Utilities
from arches_orm.arches_django.query_builder.query_builder import QueryBuilder
import copy

EXCAVATION_ADMIN_GROUP = "4fbe3955-ccd3-4c5b-927e-71672c61f298"
EXCAVATION_USER_GROUP = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_D = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_E = "214900b1-1359-404d-bba0-7dbd5f8486ef"

class ExcavationTaskStrategy(TaskStrategy):
    def get_tasks(self, groupId, userResourceId, page=1, page_size=8, sort_by='resourceinstance__createdtime', sort_order='desc', filter='All'):
        from arches_orm.models import License

        licencesDefaultWhereConditions = { 'resourceid__startswith': 'EL/' }
        queryBuilder = License.where(**licencesDefaultWhereConditions)

        def apply_filters(queryBuilder: QueryBuilder) -> "QueryBuilder":
            """
            Method can apply a where condition to the query builder

            Args:
                queryBuilder (QueryBuilder): The query builder object

            Returns:
                QueryBuilder: The query builder object
            """
                    
            if filter == 'All':
                return queryBuilder;
    
            return queryBuilder.where(report_classification_type=filter);
        
        def apply_order_by(queryBuilder: QueryBuilder) -> "QueryBuilder":
            """
            Method applies order by modifier to the query builder object

            Args:
                queryBuilder (QueryBuilder): The query builder object

            Returns:
                QueryBuilder: The query builder object
            """
            direction = '-'
            if (sort_order == 'asc'): direction = ''

            return queryBuilder.order_by(f'{direction}{sort_by}')

        def get_paginated_resources(queryBuilder: QueryBuilder) -> any:
            """
            Method applies a offset to the query builder to get the records from a certain range and it returns the WKRM with the range of records
            inside
            
            Args:
                queryBuilder (QueryBuilder): The query builder object

            Returns:
                Any: The WKRM
            """
            copyQueryBuilder = copy.deepcopy(queryBuilder) # ? We copy to not reference the main data as we can only apply 1 selector onto the query builder
            start_index = (page -1) * page_size
            end_index = (page * page_size)
            return copyQueryBuilder.offset(start_index, end_index)
    
        def get_count(queryBuilder: QueryBuilder) -> int:
            """
            Method gets the total count of records based on the query and this returns just the number of queries. Count doesn't return a instance of
            WKRM
            
            Args:
                queryBuilder (QueryBuilder): The query builder object

            Returns:
                int: The count of records
            """
            copyQueryBuilder = copy.deepcopy(queryBuilder) # ? We copy to not reference the main data as we can only apply 1 selector onto the query builder
            return copyQueryBuilder.count()
        
        def build_tasks(resources):
            tasks = []

            for resource in resources:
                task = self.build_data(resource, groupId)
                tasks.append(task)

            return tasks

        queryBuilder = apply_filters(queryBuilder)
        queryBuilder = apply_order_by(queryBuilder)

        resources = get_paginated_resources(queryBuilder)
        total_resources = get_count(queryBuilder)   
        tasks = build_tasks(resources)
        counters = []

        return tasks, total_resources, counters

    def get_sort_options(self):
        return [
            {'id': 'resourceinstance__createdtime', 'name': 'Created At'}, 
            {'id': 'valid_until_date', 'name': 'Valid Until'}
        ]
    
    def get_filter_options(self, groupId=None):
        return [
            {'id': 'All', 'name': 'All'},
            {'id': 'Final', 'name': 'Final'}, 
            {'id': 'Preliminary', 'name': 'Preliminary'}, 
            {'id': 'Interim', 'name': 'Interim'}, 
            {'id': 'Unclassified', 'name': 'Unclassified'}, 
            {'id': 'Summary', 'name': 'Summary'}
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
            date_obj = datetime.fromisoformat(str(valid_until_date))
            valid_until_date = date_obj.strftime("%d-%m-%Y")
            # valid_until_date = datetime.strptime(str(valid_until_date), "%Y-%m-%d %H:%M:%S%z").strftime("%d-%m-%Y")

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
            'reportstatus': report_status,
            'licencenumber': licence_number,
            'responseslug': response_slug
        }
        return resource_data