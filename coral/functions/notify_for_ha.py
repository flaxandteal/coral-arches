from arches.app.functions.base import BaseFunction
from querysets_shim.adapter import admin
from coral.functions.notifications.notification_manager import NotificationManager
from coral.functions.notifications.notification_base_strategy import NotificationStrategy


# node groups
SIGN_OFF = "a62658ef-bb95-5dc5-a43f-77118dc1806c"
HA_REF = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"

#nodes
INPUT_BY = "1200e850-1905-11ef-aa9f-0242ac150006"
APPROVED_BY = "9382b7b4-1905-11ef-aa9f-0242ac150006"

# groups
RANDDUSERS = "7e044ca4-96cd-4550-8f0c-a2c860f99f6b"
RANDDMANAGERS = "e778f4a1-97c6-446f-b1c4-418a81c3212e"
SSUSERS = "1ce90bd5-4063-4984-931a-cc971414d7db"
SSMANAGERS = "7679f42b-56ad-4b18-8b2c-cc6de1b16537"

#ref ids
GARDEN = "1edc61a9-b64b-51ae-9077-536908761903"
IHR = "0b14fb28-961e-5817-9cac-c61073b58981"
HB = "4b9883ef-9aad-559a-bd84-e4bb7b94a358"
SMR = "d146451b-9140-5f81-b3de-9005acc01e28"



details = {
    "functionid": "dc23eb7a-a291-410c-9a3c-b867bf55ff30",
    'name': 'Notify for Heritage Asset',
    'type': 'node',
    'description': 'Will send notifications when a Heritage Asset is updated',
    'defaultconfig': {
        'triggering_nodegroups': [ 
            HA_REF
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
            HA_REF: {
                'strategy': HeritageAssetStrategy,
                'config': {
                    'message': "A new Heritage Asset {name} has been input and is awaiting approval",
                    'response_slug': "",
                    'notiftype_id': "f49995b9-59ea-4f85-adbb-0e3a60587bd6",
                    'groups_to_notify': [],
                    'email': True,
                }
            },
        }
        
        notification_manager = NotificationManager(tile, strategy_registry, request)

        notification_manager.notify()

class HeritageAssetStrategy(NotificationStrategy):
    def send_notification(self):
            ha_type = None

            for key, value in self.tile.data.items():
                if value is not None:
                    ha_type = key

            if ha_type == GARDEN:
                self.config['groups_to_notify'] = [RANDDMANAGERS, RANDDUSERS]
                self.notification.context['response_slug'] = "add-garden-workflow"
                self.notification.save()
            elif ha_type == IHR:
                self.config['groups_to_notify'] = [RANDDMANAGERS, RANDDUSERS]
                self.notification.context['response_slug'] = "add-ihr-workflow"
                self.notification.save()
            elif ha_type == HB:
                self.config['groups_to_notify'] = [SSMANAGERS, SSUSERS]
                self.notification.context['response_slug'] = "add-building-workflow"
                self.notification.save()
            elif ha_type == SMR:
                self.config['groups_to_notify'] = [RANDDMANAGERS, RANDDUSERS]
                self.notification.context['response_slug'] = "add-monument-workflow"
                self.notification.save()

            super().send_notification()
    

    
            