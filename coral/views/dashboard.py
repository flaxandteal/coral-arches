import uuid
from django.views.generic import View
from django.http import JsonResponse
from arches_orm.models import Person, Group
from arches_orm.wkrm import WELL_KNOWN_RESOURCE_MODELS
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.forms.models import model_to_dict

MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'

STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'

class Dashboard(View):

    def get(self, request):
        
        user_id = 72 #request.user.id
        person_resource = Person.where(user_account = user_id)
        
        if not person_resource:
            return JsonResponse({"error": "User not found"}, status=404)
        
        personId = str(person_resource[0].id)

        members = Tile.objects.filter(nodegroup_id = MEMBERS_NODEGROUP)

        #this searches tiles for groups that include the user
        userGroupIds = []
        for tile in members:
            object_data = tile.data.get(MEMBERS_NODEGROUP, {})

            if object_data is None:
                continue

            for object in object_data:
                if 'resourceId' in object and object['resourceId'] == personId:
                    userGroupIds.append(str(tile.resourceinstance_id))
        
        taskResources = []

        for group in userGroupIds:
            if group == PLANNING_GROUP:
                planningTasks = self.get_planning_consultations(userGroupIds)
                taskResources.extend(planningTasks)
                break
        print('111111', taskResources)
        return JsonResponse(taskResources, safe=False)

    def get_planning_consultations(self, userGroupIds):

        ACTION_STATUS_NODE = '19eef70c-69b8-11ee-8431-0242ac120002'
        ACTION_TYPE_NODE = 'e2585f8a-51a3-11eb-a7be-f875a44e0e11'

        TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
        TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
        TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

        HM_GROUP = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
        HB_GROUP = '9a88b67b-cb12-4137-a100-01a977335298'

        ActionTiles = Tile.objects.filter(nodegroup_id = ACTION_NODEGROUP) 

        resources = []

        #get resource id for all consultations status not closed
        for tile in ActionTiles:
            status_node = tile.data.get(ACTION_STATUS_NODE, {})
            action_type = tile.data.get(ACTION_TYPE_NODE, {})
            
            if status_node == STATUS_CLOSED:
                continue

            is_hm_group = HM_GROUP in userGroupIds
            is_hb_group = HB_GROUP in userGroupIds
            is_status_done_or_requested = status_node in [STATUS_HB_DONE, STATUS_HM_DONE, STATUS_EXTENSION_REQUESTED]
            is_action_type_none = action_type is None

            if is_hm_group and status_node == STATUS_OPEN and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]:
                task = self.build_resource_data(tile.resourceinstance_id, status_node)
                resources.append(task)
            elif is_hb_group and status_node == STATUS_OPEN and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]:
                task = self.build_resource_data(tile.resourceinstance_id, status_node)
                resources.append(task)
            elif not is_hm_group and not is_hb_group and (is_status_done_or_requested or is_action_type_none):
                task = self.build_resource_data(tile.resourceinstance_id, status_node)
                resources.append(task)

        return resources
    
    def get_status_string(self, status_node):
        if status_node == STATUS_OPEN:
            return 'Open'
        elif status_node == STATUS_CLOSED:
            return 'Closed'
        elif status_node == STATUS_HB_DONE:
            return 'HB done'
        elif status_node == STATUS_HM_DONE:
            return 'HM done'
        elif status_node == STATUS_EXTENSION_REQUESTED:
            return 'Extension requested'
        elif status_node == None:
            return 'None'
    
    def build_resource_data(self, resourceId, status):
        resource = Resource.objects.get(resourceinstanceid = resourceId)
        resource_data = {
            'id': str(resourceId),
            'displayname': resource.displayname(),
            'displaydescription': resource.displaydescription(),
            'status': self.get_status_string(status),
            'responseslug': 'assign-consultation-workflow'
        }
        return resource_data
        