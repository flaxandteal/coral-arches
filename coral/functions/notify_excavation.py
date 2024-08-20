from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource
from arches_orm.adapter import admin

# tiles
SYSTEM_REFERENCE = '991c3c74-48b6-11ee-85af-0242ac140007'
REPORT = 'f060583a-6120-11ee-9fd1-0242ac120003'
CUR_E_DECISON = '69f2eb3c-c430-11ee-94bf-0242ac180006'
CUR_D_DECISION = 'c9f504b4-c42d-11ee-94bf-0242ac180006'
APPLICATION_DETAILS = '4f0f655c-48cf-11ee-8e4e-0242ac140007'

# groups
ADMIN_GROUP = '4fbe3955-ccd3-4c5b-927e-71672c61f298'
CUR_D_GROUP = '751d8543-8e5e-4317-bcb8-700f1b421a90'
CUR_E_GROUP = '214900b1-1359-404d-bba0-7dbd5f8486ef'

#nodes
RESOURCE_ID = '991c49b2-48b6-11ee-85af-0242ac140007'

details = {
    "functionid": "e3ec9aa7-dad3-444a-bb44-9d71a8eaf017",
    'name': 'Notify Excavation',
    'type': 'node',
    'description': 'Will send notifications to the Excavation team when certain nodes are changed',
    'defaultconfig': {
        'triggering_nodegroups': [SYSTEM_REFERENCE, REPORT, CUR_E_DECISON, CUR_D_DECISION, APPLICATION_DETAILS ],
    },
    'classname': 'NotifyExcavation',
    'component': '',
}
class NotifyExcavation(BaseFunction):
    def post_save(self, tile, request, context):
        from arches_orm.models import Person

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        nodegroup_id = str(tile.nodegroup_id)

        user = request.user
        user_resource = Person.where(user_account=user.id)[0] if user and Person.where(user_account=user.id) else None

        notification_manager = NotificationManager(nodegroup_id, user_resource, tile, resource_instance_id)

        notification_manager.notify()

class SystemReferenceStrategy:
    def send_notification(self, user, tile, resource_instance_id):
        name = tile.data[RESOURCE_ID].get("en").get("value")
        message = f"A new excavation licence {name} has been started and requires attention"
        groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP, CUR_D_GROUP]

        utils = Utilities()

        for group_id in groups_to_notify:
            utils.notify_group(group_id, message, resource_instance_id)

class ReportStrategy:
    def send_notification(self, user, resource_instance_id):
        pass

class CurDDecisionStrategy:
    def send_notification(self, user, resource_instance_id):
        pass

class CurEDecisionStrategy:
    def send_notification(self, user, resource_instance_id):
        pass

class ApplicationDetailsStrategy:
    def send_notification(self, user, resource_instance_id):
        pass

class NotificationManager:
    strategy_registry = {
        SYSTEM_REFERENCE : SystemReferenceStrategy, 
        REPORT : ReportStrategy, 
        CUR_D_DECISION : CurDDecisionStrategy, 
        CUR_E_DECISON : CurEDecisionStrategy, 
        APPLICATION_DETAILS : ApplicationDetailsStrategy 
    }

    def __init__(self, node_group_id, user, tile, resource_instance_id):
        self.user = user
        self.node_group_id = node_group_id
        self.tile = tile
        self.resource_instance_id = resource_instance_id
        self.strategy = self._select_strategy(node_group_id)

    def _select_strategy(self, node_group_id):
        strategy_class = self.strategy_registry.get(node_group_id)
        if strategy_class:
            return strategy_class()
        else:
            raise ValueError(f"No strategy found for node group id: {node_group_id}")
        
    def notify(self):
        self.strategy.send_notification(self.user, self.tile, self.resource_instance_id)


class Utilities:
    def notify_group(self, group_id, message, resource_instance_id):
        from arches_orm.models import Group, Person
        
        with admin():
            group = Group.find(group_id)
            person_list = [Person.find(member.id) for member in group.members if isinstance(member, Person)]

            for person in person_list:
                self.notify_user(person, message, resource_instance_id)
        
    def notify_user(self, user, message, resource_instance_id):
        user = user.user_account

        notification = models.Notification(
                message = message,
                context = {
                    "resource_instance_id": resource_instance_id,
                },
            )
        
        notification.save()

        user_x_notification = models.UserXNotification(
            notif = notification,
            recipient = user
        )
        user_x_notification.save()
