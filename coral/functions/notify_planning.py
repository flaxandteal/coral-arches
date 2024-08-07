from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches_orm.adapter import admin
from django.utils import timezone

ACTION_NODEGROUP = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"
ACTION_STATUS = "19eef70c-69b8-11ee-8431-0242ac120002"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ASSIGNED_TO = "8322f9f6-69b5-11ee-93a1-0242ac120002"

EXTENSION_REQUESTED = '28112b3f-ef44-40b4-a215-931c0c88bc5e'

ASSIGNMENT_NODEGROUP = "dc9bfb24-cfd9-11ee-8cc1-0242ac180006"
REASSIGNED_TO = "fbdd2304-cfda-11ee-8cc1-0242ac180006"

RESPONSE_NODEGROUP = "af7677ba-cfe2-11ee-8a4e-0242ac180006"
RESPONSE_TEAM = "cd77b29c-2ef6-11ef-b1c4-0242ac140006"
RESPONSE_HM = "2628d62f-c206-4c06-b26a-3511e38ea243"
RESPONSE_HB = "70fddadb-8172-4029-b8fd-87f9101a3a2d"

ASSIGN_HM = "94817212-3888-4b5c-90ad-a35ebd2445d5"
ASSIGN_HB = "12041c21-6f30-4772-b3dc-9a9a745a7a3f"
ASSIGN_BOTH = "7d2b266f-f76d-4d25-87f5-b67ff1e1350f"

STATUS_OPEN = "a81eb2e8-81aa-4588-b5ca-cab2118ca8bf"
HB_DONE = "71765587-0286-47de-96b4-4391aa6b99ef"
HM_DONE = "4608b315-0135-49a0-9686-9bc3c36990d8"

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
        from arches_orm.models import Person

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        nodegroup_id = str(tile.nodegroup_id)

        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resource_instance_id
        ).first()

        resource = Resource.objects.get(pk=resource_instance_id)
        name = resource.displayname()
        
        if not existing_notification:
            notification = models.Notification(
                message=f"{name} has been assigned to you",
                context={
                    "resource_instance_id": resource_instance_id,
                    "consultation_id": name,
                    "last_notified": None,
                },
            )
        
        else:
            notification = existing_notification
            notification.message = f"{name} has been assigned to you"

        notification.created = timezone.now()

        data = tile.data

        # check if re-assigned triggered the function and send a notification
        if nodegroup_id == ASSIGNMENT_NODEGROUP:
            assigned_users_list = []

            for user in tile.data[REASSIGNED_TO]:
                assigned_users_list.append(user)
            
            self.notify_users(assigned_users_list, notification)
            return
        
        elif nodegroup_id == RESPONSE_NODEGROUP:
            response_group_uuid = tile.data[RESPONSE_TEAM]
            if response_group_uuid == RESPONSE_HM:
                response_group = "HM"
            elif response_group_uuid == RESPONSE_HB:
                response_group = "HB"
            notification.message = f"{name} response has been completed by {response_group}"
            self.notify_group(PLANNING_ADMIN, notification)
            return

        # fetch re-assigned to data from a seperate nodegroup
        try:
            assignment_tile = Tile.objects.get(
                resourceinstance_id = resource_instance_id,
                nodegroup_id = ASSIGNMENT_NODEGROUP
            )
        except Tile.DoesNotExist:
            assignment_tile = None

        if assignment_tile:
            re_assignment_node = assignment_tile.data.get(REASSIGNED_TO, None) 
        else:
            re_assignment_node = None
        
        is_assigned_to_a_user = data[ASSIGNED_TO] != None or re_assignment_node != None

        action_type_conditions = [STATUS_OPEN, EXTENSION_REQUESTED]

        if ACTION_STATUS in data and ACTION_TYPE in data:
            if data[ACTION_TYPE] is None and data[ACTION_STATUS] in action_type_conditions and not is_assigned_to_a_user:
                if existing_notification and existing_notification.context["last_notified"] == PLANNING_ADMIN:
                    return
                self.notify_group(PLANNING_ADMIN, notification)

            elif data[ACTION_TYPE] in [ASSIGN_HM, ASSIGN_BOTH] and data[ACTION_STATUS] in action_type_conditions and not is_assigned_to_a_user:
                if existing_notification and existing_notification.context["last_notified"] == HM_MANAGERS:
                    return
                self.notify_group(HM_MANAGERS, notification)

            elif data[ACTION_TYPE] in [ASSIGN_HB, ASSIGN_BOTH] and data[ACTION_STATUS] in action_type_conditions and not is_assigned_to_a_user:
                if existing_notification and existing_notification.context["last_notified"] == HB_MANAGERS:
                    return
                
                self.notify_group(HB_MANAGERS, notification)

            elif data[ACTION_STATUS] in action_type_conditions and is_assigned_to_a_user:
                with admin():
                    assigned_users_list = []
                    if re_assignment_node:
                        return
                    else:
                        for user in tile.data[ASSIGNED_TO]:
                            assigned_users_list.append(user)

                    self.notify_users(assigned_users_list, notification)

    def notify_group(self, group_id, notification):
        from arches_orm.models import Group, Person
        
        with admin():
            group = Group.find(group_id)
            persons = [Person.find(member.id) for member in group.members if isinstance(member, Person)]

            notification.context["last_notified"] = group_id
            notification.save()
            for person in persons:
                user = person.user_account

                user_x_notification = models.UserXNotification(
                    notif=notification, recipient=user
                )
                user_x_notification.save()

    def notify_users(self, assigned_users_list, notification):
        from arches_orm.models import Person

        notified_users_list = notification.context.get("last_notified", []) if isinstance(notification.context.get("last_notified"), list) else []

        for user in assigned_users_list:

            selected_user = Person.find(user['resourceId'])

            if not selected_user.user_account:
                return
            
            if str(selected_user.id) in notified_users_list:
                continue  # Skip already notified users

            notified_users_list.append(selected_user.id)
            notification.context["last_notified"] = notified_users_list
            notification.save()
            
            user_x_notification = models.UserXNotification(
                notif=notification, recipient=selected_user.user_account
            )
            user_x_notification.save()
