import uuid
from django.views.generic import View
from django.http import JsonResponse
from arches_orm.models import Person, Group, Consultation
from arches_orm.wkrm import WELL_KNOWN_RESOURCE_MODELS
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from django.forms.models import model_to_dict

MEMBERS_NODEGROUP = 'bb2f7e1c-7029-11ee-885f-0242ac140008'
ACTION_NODEGROUP = 'a5e15f5c-51a3-11eb-b240-f875a44e0e11'
HIERARCHY_NODE_GROUP = '0dd6ccb8-cffe-11ee-8a4e-0242ac180006'
PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'

STATUS_CLOSED = '56ac81c4-85a9-443f-b25e-a209aabed88e'
STATUS_OPEN = 'a81eb2e8-81aa-4588-b5ca-cab2118ca8bf'
STATUS_HB_DONE = '71765587-0286-47de-96b4-4391aa6b99ef'
STATUS_HM_DONE = '4608b315-0135-49a0-9686-9bc3c36990d8'
STATUS_EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'
STATUTORY = 'd06d5de0-2881-4d71-89b1-522ebad3088d'
NON_STATUTORY = 'be6eef20-8bd4-4c64-abb2-418e9024ac14'

class Dashboard(View):

    def get(self, request):
        
        user_id = request.user.id
        person_resource = Person.where(user_account = user_id)
        
        if not person_resource:
            return JsonResponse({"error": "User not found"}, status=404)
        
        personId = str(person_resource[0].id)
        
        groups = Group.all()

        userGroupIds = []

        for group in groups:
            for member in group.members:
                if member.id == person_resource[0].id:
                    userGroupIds.append(str(group.id)) #needs to be a string and not uuid
        
        taskResources = []

        for group in userGroupIds:
            if group == PLANNING_GROUP:
                planningTasks = self.get_planning_consultations(userGroupIds)
                taskResources.extend(planningTasks)
                break
        return JsonResponse(taskResources, safe=False)

    def get_planning_consultations(self, userGroupIds):

        TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
        TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
        TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

        HM_GROUP = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
        HB_GROUP = '9a88b67b-cb12-4137-a100-01a977335298'

        is_hm_group = HM_GROUP in userGroupIds
        is_hb_group = HB_GROUP in userGroupIds

        resources = [] 

        consultations = Consultation.all()

        #filter out consultations that are not planning consultations
        planning_consultations=[c for c in consultations if c._name().startswith('CON/')]
        for consultation in planning_consultations:
                action_status = consultation.action[0].action_status if consultation.action else None
                action_type = consultation.action[0].action_type if consultation.action else None

                conditions_for_task = (
                    (is_hm_group and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HM, TYPE_ASSIGN_BOTH]) or
                    (is_hb_group and action_status == STATUS_OPEN and action_type in [TYPE_ASSIGN_HB, TYPE_ASSIGN_BOTH]) or
                    (not is_hm_group and not is_hb_group)
                )
                if conditions_for_task:                 
                    task = self.build_planning_resource_data(consultation)
                    if task:
                        resources.append(task)
        return resources
    
    def convert_id_to_string(self, id):
        if id == STATUS_OPEN:
            return 'Open'
        elif id == STATUS_CLOSED:
            return 'Closed'
        elif id == STATUS_HB_DONE:
            return 'HB done'
        elif id == STATUS_HM_DONE:
            return 'HM done'
        elif id == STATUS_EXTENSION_REQUESTED:
            return 'Extension requested'
        elif id == STATUTORY:
            return 'Statutory'
        elif id == NON_STATUTORY:
            return 'Non-statutory'
        elif id == None:
            return 'None'
    
    def build_planning_resource_data(self, consultation):
        action_status = consultation.action[0].action_status if consultation.action else None
        hierarchy_type = consultation.hierarchy_type
        resource_data = {
            'id': consultation.id,
            'displayname': consultation._name(),
            'displaydescription': consultation._description(),
            'status': self.convert_id_to_string(action_status),
            'hierarchy_type': self.convert_id_to_string(hierarchy_type),
            'responseslug': 'assign-consultation-workflow'
        }
        return resource_data
        