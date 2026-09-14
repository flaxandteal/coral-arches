from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
from querysets_shim.models import Group, Person
from querysets_shim.adapter import admin
import logging
from coral.utils.reference_values import reference_value, selected_list_item_ids, single_list_item_id

# node groups
ASSIGNMENT = "9898db6b-1a2f-5163-9df6-bf9cb92bf559"
ACTION = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"

# nodes
ACTION_ASSIGNED_TO = "528bd120-1525-543b-b046-06fd4e00b432"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ASSIGNMENT_ASSIGNED_TO = "16b43c47-0513-5c96-b817-030d200d113b"
ASSIGNMENT_TEAM = "9f71504d-6c1e-53b7-8d33-f03f8e6ccdca"
REASSIGNED_TO = "7b4b1596-5592-544b-9651-ecf800202f98"


# team
HB_TEAM = "9ef9f72d-0d61-5376-934b-844698c3316e"
HM_TEAM = "5d6363b4-8310-58df-be40-42d9b9096071"

# groups
HM_MANAGER_GROUP = "905c40e1-430b-4ced-94b8-0cbdab04bc33"
HM_USER_GROUP = "29a43158-5f50-495f-869c-f651adf3ea42"
HB_MANAGER_GROUP = "9a88b67b-cb12-4137-a100-01a977335298"
HB_USER_GROUP = "f240895c-edae-4b18-9c3b-875b0bf5b235"

# status
# Pending the coral-graphs rebuild that creates the Consultation Action Type list;
# see coral/functions/notify_planning.py for the same three constants.
TYPE_ASSIGN_HM = '72ce5d6a-f938-5eae-b650-608ca8b3b934'
TYPE_ASSIGN_HB = '8ddddee6-a5d6-5532-9896-3696d0b45754'
TYPE_ASSIGN_BOTH = '979eab2e-f1c8-532a-9de8-56604acbff2c'

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
                  
logger = logging.getLogger(__name__)

class UpdateAssignedTo(BaseFunction):
    def is_user_in_team(self, user, team=None):
        with admin():
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
                    team = single_list_item_id(tile.data.get(ASSIGNMENT_TEAM))
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
                            data={update_node: users, ASSIGNMENT_TEAM: reference_value(team)}
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
            current_assigned = tile.data.get(ASSIGNMENT_ASSIGNED_TO, None)
            reassigned_users = tile.data.get(REASSIGNED_TO, None)
            team = single_list_item_id(tile.data.get(ASSIGNMENT_TEAM))
            if reassigned_users:
                tile.data[ASSIGNMENT_ASSIGNED_TO] = reassigned_users
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

                assigned_node = action_tile.data.get(ACTION_ASSIGNED_TO, None)
                if current_assigned and assigned_node:
                    for person in current_assigned:
                        assigned_node = [user for user in assigned_node if user['resourceId'] != person['resourceId']]
                        action_tile.data[ACTION_ASSIGNED_TO] = assigned_node + reassigned_users
                else:
                    action_tile.data[ACTION_ASSIGNED_TO] = reassigned_users   
                    tile.data[ASSIGNMENT_ASSIGNED_TO] = reassigned_users           
                
                action_tile.save()            

        if str(tile.nodegroup_id) == ACTION:
            action_type = selected_list_item_ids(tile.data.get(ACTION_TYPE))

            if TYPE_ASSIGN_HM in action_type:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HM_TEAM)
            elif TYPE_ASSIGN_HB in action_type:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO, HB_TEAM)
            elif TYPE_ASSIGN_BOTH in action_type:
                self.update_matching_node(tile, ASSIGNMENT, ACTION_ASSIGNED_TO, ASSIGNMENT_ASSIGNED_TO)

        





            
        





            