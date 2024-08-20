from arches.app.functions.base import BaseFunction
from arches.app.models import models
from arches.app.models.resource import Resource
from arches_orm.adapter import admin
import logging

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
GRADE_E_DECISION = 'a68fa38c-c430-11ee-bc4b-0242ac180006'
GRADE_D_DECISION = '2a5151f0-c42e-11ee-94bf-0242ac180006'

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

        nodegroup_id = str(tile.nodegroup_id)

        user = request.user
        user_resource = Person.where(user_account=user.id)[0] if user and Person.where(user_account=user.id) else None

        notification_manager = NotificationManager(nodegroup_id, user_resource, tile)

        notification_manager.notify()

class NotificationStrategy:
    def send_notification(self, user, tile):
        raise NotImplementedError("Subclasses should implement this method")
    
    def notify(self, user, groups_to_notify, message, resource_instance_id):
        utils = Utilities()
        utils.notify_groups(user, groups_to_notify, message, resource_instance_id)

class SystemReferenceStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name = tile.data[RESOURCE_ID].get("en").get("value")
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        message = f"A new excavation licence {name} has been started and requires attention"
        groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP, CUR_D_GROUP]

        self.notify(user, groups_to_notify, message, resource_instance_id)

class CurEDecisionStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        name = Resource.objects.get(pk=resource_instance_id).displayname()

        decision_id = tile.data[GRADE_E_DECISION]
        decision_node = models.Node.objects.filter(
            pk = GRADE_E_DECISION,   
        ).first()
        options = decision_node.config.get("options")
        decision_string = next((option.get("text").get("en") for option in options if option.get("id") == decision_id), None)

        message = f"The Cur Grade E Decision has been set to {decision_string} for {name}. This requires further attention"
        groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP]

        self.notify(user, groups_to_notify, message, resource_instance_id)

class CurDDecisionStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        name = Resource.objects.get(pk=resource_instance_id).displayname()

        decision_id = tile.data[GRADE_D_DECISION]
        decision_node = models.Node.objects.filter(
            pk = GRADE_D_DECISION,   
        ).first()
        options = decision_node.config.get("options")
        decision_string = next((option.get("text").get("en") for option in options if option.get("id") == decision_id), None)

        message = f"The Cur Grade D Decision has been set to {decision_string} for {name}. This requires further attention"
        groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP]

        self.notify(user, groups_to_notify, message, resource_instance_id)

class ReportStrategy:
    def send_notification(self, user, tile):
        pass

class ApplicationDetailsStrategy:
    def send_notification(self, user, tile):
        pass

class NotificationManager:
    strategy_registry = {
        SYSTEM_REFERENCE : SystemReferenceStrategy, 
        REPORT : ReportStrategy, 
        CUR_D_DECISION : CurDDecisionStrategy, 
        CUR_E_DECISON : CurEDecisionStrategy, 
        APPLICATION_DETAILS : ApplicationDetailsStrategy 
    }

    def __init__(self, node_group_id, user, tile):
        self.user = user
        self.node_group_id = node_group_id
        self.tile = tile
        self.strategy = self._select_strategy(node_group_id)
        Utilities().delete_existing_notification(tile)

    def _select_strategy(self, node_group_id):
        strategy_class = self.strategy_registry.get(node_group_id)
        if strategy_class:
            return strategy_class()
        else:
            raise ValueError(f"No strategy found for node group id: {node_group_id}")
        
    def notify(self):
        self.strategy.send_notification(self.user, self.tile)


class Utilities:
    def notify_groups(self, user, group_list, message, resource_instance_id):
        from arches_orm.models import Group, Person
        
        with admin():
            for group_id in group_list:
                group = Group.find(group_id)
                person_list = [Person.find(member.id) for member in group.members if isinstance(member, Person)]
                
                for person in person_list:
                    if user is None or person != user:
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

    def delete_existing_notification(self, tile):
        resourceinstanceid = str(tile.resourceinstance.resourceinstanceid)
        existing_notification = models.Notification.objects.filter(
            context__resource_instance_id=resourceinstanceid
        ).first()

        if existing_notification:
            existing_notification.delete()
            logging.info("Deleted Existing Notification")
