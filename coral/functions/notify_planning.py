from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
from django.utils import timezone

ACTION_NODEGROUP = "a5e15f5c-51a3-11eb-b240-f875a44e0e11"
ACTION_STATUS = "19eef70c-69b8-11ee-8431-0242ac120002"
ACTION_TYPE = "e2585f8a-51a3-11eb-a7be-f875a44e0e11"
ACTION_BY = "8322f9f6-69b5-11ee-93a1-0242ac120002"

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
        'triggering_nodegroups': [ACTION_NODEGROUP],
    },
    'classname': 'NotifyPlanning',
    'component': '',
}
class NotifyPlanning(BaseFunction):       

    def post_save(self, tile, request, context):
        from arches_orm.models import Person

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

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

        if ACTION_STATUS in data and ACTION_TYPE in data:
            if data[ACTION_TYPE] in [ASSIGN_HM, ASSIGN_BOTH] and data[ACTION_STATUS] == STATUS_OPEN and data[ACTION_BY] == None:
                if existing_notification and existing_notification.context["last_notified"] == HM_MANAGERS:
                    return
                
                self.notify_group(HM_MANAGERS, notification)

            elif data[ACTION_TYPE] in [ASSIGN_HB, ASSIGN_BOTH] and data[ACTION_STATUS] == STATUS_OPEN and data[ACTION_BY] == None:
                if existing_notification and existing_notification.context["last_notified"] == HB_MANAGERS:
                    return
                
                self.notify_group(HB_MANAGERS, notification)

            elif data[ACTION_STATUS] == STATUS_OPEN and data[ACTION_BY] != None:
                with admin():
                    selected_user = Person.find(data[ACTION_BY][0]['resourceId'])

                    if existing_notification and existing_notification.context["last_notified"] == str(selected_user.id):
                        return
                    
                    notification.context["last_notified"] = selected_user.id
                    notification.save()
                    
                    user_x_notification = models.UserXNotification(
                        notif=notification, recipient=selected_user.user_account
                    )
                    user_x_notification.save()

            elif data[ACTION_STATUS] in [HB_DONE, HM_DONE]:
                notification.message = f"{name} has been completed"
                self.notify_group(PLANNING_ADMIN, notification)

    def notify_group(self, group_id, notification):
        from arches_orm.models import Group, Person
        
        with admin():
            group = Group.find(group_id)
            persons = [Person.find(member.id) for member in group.members]

            notification.context["last_notified"] = group_id
            notification.save()
            for person in persons:
                user = person.user_account

                user_x_notification = models.UserXNotification(
                    notif=notification, recipient=user
                )
                user_x_notification.save()
