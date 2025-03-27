from arches.app.functions.base import BaseFunction
from arches_orm.adapter import admin
from coral.functions.notifications.notification_manager import NotificationManager
from coral.functions.notifications.notification_base_strategy import NotificationStrategy

# node groups
SIGN_OFF = "3897b87a-1902-11ef-aa9f-0242ac150006"

#nodes
INPUT_BY = "1200e850-1905-11ef-aa9f-0242ac150006"
APPROVED_BY = "9382b7b4-1905-11ef-aa9f-0242ac150006"

# groups
CUR_D = ""
CUR_E = ""
ADMIN = ""



details = {
    "functionid": "dc23eb7a-a291-410c-9a3c-b867bf55ff30",
    'name': 'Notify for Heritage Asset',
    'type': 'node',
    'description': 'Will send notifications when a Heritage Asset is updated',
    'defaultconfig': {
        'triggering_nodegroups': [ 
            SIGN_OFF
        ],
    },
    'classname': 'NotifyForHA',
    'component': '',
}

class NotifyForHA(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return

        strategy_registry = { 
            SIGN_OFF: {
                'strategy': HeritageAssetStrategy,
                'config': {
                    'message': "A new Heritage Asset {name} has been input and is awaiting approval",
                    'response_slug': "add-building-workflow",
                    'notiftype_id': "f49995b9-59ea-4f85-adbb-0e3a60587bd6",
                    'groups_to_notify': [ADMIN, CUR_D],
                    'email': True,
                }
            },
        }
        
        notification_manager = NotificationManager(tile, strategy_registry, request)

        notification_manager.notify()

class HeritageAssetStrategy(NotificationStrategy):
    if INPUT_BY and APPROVED_BY is None:
        super().send_notification()

    
            