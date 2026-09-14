from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from querysets_shim.adapter import admin
from django.utils import timezone
from coral.utils.reference_values import selected_list_item_ids

ACTION_NODEGROUP = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"
ACTION_STATUS = "b07b2cf2-bccf-5823-a93a-dab9e132c9b6"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ASSIGNED_TO = "528bd120-1525-543b-b046-06fd4e00b432"

EXTENSION_REQUESTED = '79c76cce-8753-53bb-a932-9dfc08452350'

ASSIGNMENT_NODEGROUP = "9898db6b-1a2f-5163-9df6-bf9cb92bf559"
REASSIGNED_TO = "7b4b1596-5592-544b-9651-ecf800202f98"

RESPONSE_NODEGROUP = "d6d47325-6fe7-5850-a3e3-389b11b00ea8"
RESPONSE_TEAM = "cf6c76ac-3f89-5d22-a74b-2cdf80608b6e"
RESPONSE_HM = "03ea2b65-1def-5fc4-ae4e-70b5869d9696"
RESPONSE_HB = "8b7091c9-dcd2-578c-9775-814240a4ea01"

ASSIGN_HM = "72ce5d6a-f938-5eae-b650-608ca8b3b934"
ASSIGN_HB = "8ddddee6-a5d6-5532-9896-3696d0b45754"
ASSIGN_BOTH = "979eab2e-f1c8-532a-9de8-56604acbff2c"

STATUS_OPEN = "d28ce1a4-6a46-54ac-a03c-1e528c1bdd76"
HB_DONE = "8d4677a2-dc59-58ea-b969-bad7b55673c7"
HM_DONE = "0ccb1234-0b83-5ce4-9d59-ff8cd08b2a7d"

DESC_NODEGROUP = "82f8a163-951a-11ea-b58e-f875a44e0e11"
DESC_NODE = "82f8a166-951a-11ea-bdad-f875a44e0e11"

HM_MANAGERS = "905c40e1-430b-4ced-94b8-0cbdab04bc33"
HB_MANAGERS = "9a88b67b-cb12-4137-a100-01a977335298"
HM_USER = "29a43158-5f50-495f-869c-f651adf3ea42"
HB_USER = "f240895c-edae-4b18-9c3b-875b0bf5b235"
PLANNING_ADMIN = "74afc49c-3c68-4f6c-839a-9bc5af76596b"

details = {
    "functionid": "e5de46d7-dd01-418b-a71d-f5b27c143de4",
    'name': 'Notify Planning',
    'type': 'node',
    'description': 'Will send a notification on creation or edit of certain nodes to a specified user or group',
    'defaultconfig': {
        'triggering_nodegroups': [ACTION_NODEGROUP, ASSIGNMENT_NODEGROUP, RESPONSE_NODEGROUP],
    },
    'classname': 'NotifyPlanning',
    'component': '',
}
class NotifyPlanning(BaseFunction):       

    def post_save(self, tile, request, context):
        from querysets_shim.models import Person

        if context and context.get('escape_function', False):
            return
        
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        nodegroup_id = str(tile.nodegroup_id)
        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id,
            context__group=None
        ).first()

        both_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id,
            context__group='both'
        ).first()

        admin_notification = models.Notification.objects.filter(
            context__group='admin'
        ).first()

        resource = Resource.objects.get(pk=resource_instance_id)
        name = resource.displayname()
        
        # The existing notification stops groups from being sent multiple of the same notification
        # Use this notification as the primary notification
        # The other 2 notifications are used to allow multiple groups with different slugs to be notified
        
        if not existing_notification:
            notification = models.Notification(
                message=f"{name} has been assigned to you",
                context={
                    "resource_instance_id": resource_instance_id,
                    "consultation_id": name,
                    "last_notified": None,
                    "group": None,
                    "response_slug": 'assign-consultation-workflow'
                },
            )
        
        else:
            notification = existing_notification
            notification.message = f"{name} has been assigned to you"
        
        if not admin_notification:
            admin_notification = models.Notification(
                message=f"{name} has been updated",
                context={
                    "resource_instance_id": resource_instance_id,
                    "consultation_id": name,
                    "last_notified": None,
                    "group": 'admin',
                    "response_slug": 'assign-consultation-workflow'
                },
            )
        else:
            admin_notification.message = f"{name} has been updated"

        if not both_notification:
            both_notification = models.Notification(
                message=f"{name} has been assigned to you",
                context={
                    "resource_instance_id": resource_instance_id,
                    "consultation_id": name,
                    "last_notified": None,
                    "group": 'both',
                    "response_slug": 'assign-consultation-workflow'
                },
            )
        else:
            both_notification.message = f"{name} has been assigned to you"

        notification.created = timezone.now()
        admin_notification.created = timezone.now()
        both_notification.created = timezone.now()

        data = tile.data

        if nodegroup_id == RESPONSE_NODEGROUP:
            response_team = selected_list_item_ids(tile.data.get(RESPONSE_TEAM))
            response_group = ""
            if RESPONSE_HM in response_team:
                response_group = "HM"
            elif RESPONSE_HB in response_team:
                response_group = "HB"
            notification.message = f"{name} response has been completed by {response_group}"
            response_slug = 'assign-consultation-workflow'
            self.notify_group(PLANNING_ADMIN, PLANNING_ADMIN, notification, response_slug)
            return
        
        is_assigned_to_a_user = data.get(ASSIGNED_TO, None) != None

        action_type_conditions = {STATUS_OPEN, EXTENSION_REQUESTED}

        # Action Status and Action Type are controlled-list references, so each holds a
        # list of entries: test the selected list item ids rather than comparing scalars.
        action_status = selected_list_item_ids(data.get(ACTION_STATUS))
        action_type = selected_list_item_ids(data.get(ACTION_TYPE))
        status_qualifies = bool(action_status & action_type_conditions)

        # Need to create a new notification per group to keep the slugs unique for each user
        if ACTION_STATUS in data and ACTION_TYPE in data:
            if not action_type and status_qualifies and not is_assigned_to_a_user:
                if existing_notification and PLANNING_ADMIN == existing_notification.context["last_notified"]:
                    return
                self.notify_group(PLANNING_ADMIN, PLANNING_ADMIN, notification, 'assign-consultation-workflow')

            if ASSIGN_HM in action_type and status_qualifies and not is_assigned_to_a_user:
                if existing_notification and HM_MANAGERS == existing_notification.context["last_notified"]:
                    return
                self.notify_group(HM_MANAGERS, HM_MANAGERS, notification, 'hm-planning-consultation-response-workflow')              

            if ASSIGN_HB in action_type and status_qualifies and not is_assigned_to_a_user:
                if existing_notification and HB_MANAGERS == existing_notification.context["last_notified"]:
                    return
                
                self.notify_group(HB_MANAGERS, HB_MANAGERS, notification, 'hb-planning-consultation-response-workflow')
           
            if ASSIGN_BOTH in action_type and status_qualifies and not is_assigned_to_a_user:
                if existing_notification and 'all' == existing_notification.context["last_notified"]:
                    return
                
                self.notify_group(HB_MANAGERS, 'all', notification, 'hb-planning-consultation-response-workflow')
                self.notify_group(HM_MANAGERS, 'all', both_notification, 'hm-planning-consultation-response-workflow')
                self.notify_group(PLANNING_ADMIN, 'all', admin_notification, 'assign-consultation-workflow')

            if status_qualifies and is_assigned_to_a_user:
                with admin():
                    assigned_users_list = []
                    
                    for user in tile.data[ASSIGNED_TO]:
                        team = self.find_user_team(user)
                        assigned_users_list.append({
                            'user': user,
                            'team': team
                        })

                    self.notify_users(assigned_users_list, notification)

    def notify_group(self, group_id, last_notified, notification, response_slug):
        from querysets_shim.models import Group, Person
        with admin():
            group = Group.find(group_id)
            persons = [Person.find(member.id) for member in group.members if isinstance(member, Person)]

            notification.context["last_notified"] = last_notified
            notification.context["response_slug"] = response_slug
            notification.save()

            for person in persons:
                user = person.user_account

                user_x_notification = models.UserXNotification(
                    notif=notification, recipient=user
                )
                user_x_notification.save()

    def notify_users(self, assigned_users_list, notification):
        from querysets_shim.models import Person

        notified_users_list = notification.context.get("last_notified", []) if isinstance(notification.context.get("last_notified"), list) else []

        for user in assigned_users_list:
            selected_user = Person.find(user['user']['resourceId'])

            if not selected_user.user_account:
                return
            
            if str(selected_user.id) in notified_users_list:
                continue  # Skip already notified users

            notified_users_list.append(selected_user.id)
            notification.context["last_notified"] = 'users'
            notification.context["response_slug"] = f"{user['team']}-planning-consultation-response-workflow"
            notification.save()
            
            user_x_notification = models.UserXNotification(
                notif=notification, recipient=selected_user.user_account
            )
            user_x_notification.save()

    def find_user_team(self, user):
        from querysets_shim.models import Group, Person
        hm_teams = [HM_MANAGERS, HM_USER]
        hb_teams = [HB_MANAGERS, HB_USER]

        hb_groups = [Group.find(id) for id in hb_teams]
        hm_groups = [Group.find(id) for id in hm_teams]

        person = Person.find(user['resourceId'])

        def find_users_in_teams(groups):
            for group in groups:
                for member in group.members:
                    if member.id == person.id:
                        return True
            return False
        user_team = None
        if find_users_in_teams(hm_groups):
            user_team = 'hm'
        elif find_users_in_teams(hb_groups):
            user_team = 'hb'

        return user_team
