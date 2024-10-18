from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
from arches_orm.models import Group, Person
import logging

# node groups
ASSIGNMENT = "dc9bfb24-cfd9-11ee-8cc1-0242ac180006"
ACTION = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"

# nodes
ACTION_ASSIGNED_TO = "8322f9f6-69b5-11ee-93a1-0242ac120002"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ASSIGNMENT_ASSIGNED_TO = "50d15bec-cfda-11ee-8cc1-0242ac180006"
ASSIGNMENT_TEAM = "6b8f5866-2f0d-11ef-b37c-0242ac140006"
REASSIGNED_TO = "fbdd2304-cfda-11ee-8cc1-0242ac180006"


# team
HB_TEAM = "18b628c9-149f-4c37-bc27-e8e0d714a037"
HM_TEAM = "e377b8a9-ced0-4186-84ff-0b5c3ece9c78"

# groups
HM_MANAGER_GROUP = "905c40e1-430b-4ced-94b8-0cbdab04bc33"
HM_USER_GROUP = "29a43158-5f50-495f-869c-f651adf3ea42"
HB_MANAGER_GROUP = "9a88b67b-cb12-4137-a100-01a977335298"
HB_USER_GROUP = "f240895c-edae-4b18-9c3b-875b0bf5b235"

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
            
        ],
    },
    'classname': 'UpdateAssignedTo',
    'component': '',
}
                  
logger = logging.getLogger(__name__)

class UpdateAssignedTo(BaseFunction):
    def is_user_in_team(self, user, team=None):
        hm_teams = [HM_MANAGER_GROUP, HM_USER_GROUP]
        hb_teams = [HB_MANAGER_GROUP, HB_USER_GROUP]

        hb_groups = [Group.find(id) for id in hb_teams]
        hm_groups = [Group.find(id) for id in hm_teams]

        person = Person.find(user)

        def find_users_in_teams(groups):
            for group in groups:
                for member in group.members:
                    if member.id == person.id:
                        return True
            return False

        user_team = []
        if team == HM_TEAM:
            if find_users_in_teams(hm_groups):
                user_team = HM_TEAM
            else:
                raise Exception(f"User '{person}' is not part of the HM team groups")
        elif team == HB_TEAM:
            if find_users_in_teams(hb_groups):
                user_team = HB_TEAM
            else:
                raise Exception(f"User '{person}' is not part of the HB team groups")
        elif team is None:
            if find_users_in_teams(hm_groups):
                user_team = HM_TEAM
            elif find_users_in_teams(hb_groups):
                user_team = HB_TEAM
            else:
                raise Exception(f"User '{person}' is not part of any Planning Team groups")

        return user_team
                    
    def update_matching_node(self, tile, nodegroup, existing_node, update_node, team=None):
        assigned_users = tile.data[existing_node]
        team_users = {}
        for user in assigned_users:
            user_team = self.is_user_in_team(user['resourceId'], team)
            if user_team:
                if user_team not in team_users:
                    team_users[user_team] = []
                team_users[user_team].append(user)

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        try:
            filter_params = {
                'resourceinstance_id': resource_instance_id,
                'nodegroup_id': nodegroup,
            }

            existing_tiles = Tile.objects.filter(**filter_params)
            if existing_tiles:
                for tile in existing_tiles:
                    team = tile.data[ASSIGNMENT_TEAM]
                    if team in team_users:
                        tile.data[ASSIGNMENT_ASSIGNED_TO] = team_users[team]
                        tile.save()  
                        del team_users[team]
                    else:
                        tile.delete()
            for team, users in team_users.items():
                if users:
                    try:
                        Tile.objects.get_or_create(
                            resourceinstance_id=resource_instance_id,
                            nodegroup_id=nodegroup,
                            data={update_node: users, ASSIGNMENT_TEAM: team}
                        )
                    except Exception as e:
                        logger.error(e)
                    
        except Exception as e:
            logger.error(f"No tiles currently exist: {e}")

    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return
        
        if tile.nodegroup_id == ASSIGNMENT:
            if not tile.data[REASSIGNED_TO]:
                return
            current_assigned = tile.data[ASSIGNMENT_ASSIGNED_TO]
            reassigned_users = tile.data[REASSIGNED_TO]
            team = tile.data[ASSIGNMENT_TEAM]
            tile.data[REASSIGNED_TO] = None
            tile.save()    
            
            for person in reassigned_users:
                self.is_user_in_team(person['resourceId'], team)

            try:
                filter_params = {
                    'resourceinstance_id': str(tile.resourceinstance.resourceinstanceid),
                    'nodegroup_id': ACTION,
                }
                action_tile = Tile.objects.filter(**filter_params).first()
            except:
                raise Exception("Users could not be re-assigned as no users are currently assigned")

            assigned_node = action_tile.data[ACTION_ASSIGNED_TO]
            for person in current_assigned:
                assigned_node = [user for user in assigned_node if user['resourceId'] != person['resourceId']]

            action_tile.data[ACTION_ASSIGNED_TO] = assigned_node + reassigned_users
            action_tile.save()            

        if str(tile.nodegroup_id) == ACTION:
            action_type = tile.data[ACTION_TYPE]

            if action_type == TYPE_ASSIGN_HM:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HM_TEAM)
            elif action_type == TYPE_ASSIGN_HB:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HB_TEAM)
            elif action_type == TYPE_ASSIGN_BOTH:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO)

        





            
        





            