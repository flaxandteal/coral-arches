from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
import pdb

# node groups
ASSIGNMENT = "dc9bfb24-cfd9-11ee-8cc1-0242ac180006"
ACTION = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"

# nodes
ACTION_ASSIGNED_TO = "8322f9f6-69b5-11ee-93a1-0242ac120002"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ASSIGNMENT_ASSIGNED_TO = "50d15bec-cfda-11ee-8cc1-0242ac180006"
ASSIGNMENT_TEAM = "6b8f5866-2f0d-11ef-b37c-0242ac140006"


# team
HB_TEAM = "18b628c9-149f-4c37-bc27-e8e0d714a037"
HM_TEAM = "e377b8a9-ced0-4186-84ff-0b5c3ece9c78"

# status
TYPE_ASSIGN_HM = '94817212-3888-4b5c-90ad-a35ebd2445d5'
TYPE_ASSIGN_HB = '12041c21-6f30-4772-b3dc-9a9a745a7a3f'
TYPE_ASSIGN_BOTH = '7d2b266f-f76d-4d25-87f5-b67ff1e1350f'

details = {
    "functionid": "9a4760fc-9a00-4ba1-b35c-18dbe26f1beb",
    'name': 'Update Response Assignee',
    'type': 'node',
    'description': 'This will update the assignee on the reponse workflow to match that in the consultation and vice versa',
    'defaultconfig': {
        'triggering_nodegroups': [
            ACTION,
            ASSIGNMENT
        ],
    },
    'classname': 'UpdateAssignedTo',
    'component': '',
}
                  

class UpdateAssignedTo(BaseFunction): 
    def update_matching_node(self, tile, nodegroup, existing_node, update_node, team):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        assigned_to_value = tile.data[existing_node]
        
        try:
            existing_tile = Tile.objects.filter(
                resourceinstance_id = resource_instance_id,
                nodegroup_id = nodegroup,
                data__contains = {ASSIGNMENT_TEAM:team}
            ).first()
            if existing_tile.data[update_node] == tile.data[existing_node]:
                return
            existing_tile.data[update_node] = assigned_to_value
            existing_tile.save()
            return
        except:
            Tile.objects.get_or_create(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=nodegroup,
            data = { update_node: assigned_to_value, ASSIGNMENT_TEAM:team }
        )
        return      

    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        if str(tile.nodegroup_id) == ACTION:
            action_type = tile.data[ACTION_TYPE]

            if action_type == TYPE_ASSIGN_HM:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HM_TEAM)
            elif action_type == TYPE_ASSIGN_HB:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HB_TEAM)
            elif action_type == TYPE_ASSIGN_BOTH:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HM_TEAM)
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HB_TEAM)

        





            
        





            