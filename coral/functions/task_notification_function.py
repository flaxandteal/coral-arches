from arches.app.functions.base import BaseFunction
from arches.app.models import models

details = {
    'name': 'Task Notification',
    'type': 'node',
    'description': 'Will send a notification on creation or edit of certain nodes to a specified user or group',
    'defaultconfig': {
        'triggering_nodegroups': [],
        'nodeGroupId': '',
        'nodeId' : '',
        'valuesToCheck': [],
        'usersToNotify': [],
        'groupsToNotify': [],
    },
    'classname': 'TaskNotification',
    'component': 'views/components/functions/task_notification_function',
}

class TaskNotification(BaseFunction):
        
    def after_function_save(self, tile, request):
        NODE_GROUP_ID = tile.config['nodeGroupId']
        NODE_ID = tile.config['nodeId']
        

    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        reason_description = "this is a description"


        notification = models.Notification(
            message=reason_description,
            context={
                "resource_instance_id": resource_instance_id,
            },
        )
        notification.save()

        user_x_notification = models.UserXNotification(
            notif=notification, recipient=request.user
        )
        user_x_notification.save()
