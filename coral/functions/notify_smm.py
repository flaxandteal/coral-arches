from arches.app.functions.base import BaseFunction
from arches_orm.adapter import admin
from coral.functions.notifications.notification_base_strategy import NotificationStrategy
from coral.functions.notifications.notification_manager import NotificationManager

# node groups
SIGN_OFF = "93199292-fb24-11ee-838d-0242ac190006" # FMW completed
CON_SYSTEM_REFERENCE = "b37552ba-9527-11ea-96b5-f875a44e0e11"
ISSUE_REFERENCE = "20017860-d711-11ee-9dd0-0242ac120006" # Issue report starting
PROPOSAL = "345ffce6-d23e-11ee-9ae7-0242ac180006" #SMC starting

# groups
SMM_CUR_D = "7aff25d4-6c71-4f6f-afc8-21be0874a9a3"
SMM_CUR_E = "51911174-8d96-4251-a158-17a5d0f668c7"
ADMIN = "b23161e0-070c-466f-a4de-6330fa8dc5a3"

#nodes
RESOURCE_ID = "b37552be-9527-11ea-9213-f875a44e0e11"
SIGN_OFF_DATE = "24d00d86-fb27-11ee-b5d2-0242ac190006"
REFERENCE_NUMBER = "2001a33a-d711-11ee-9dd0-0242ac120006"

#response slugs
FMW_SLUG = "fmw-inspection-workflow"
ISSUE_REPORT_SLUG = "issue-report-workflow"
SMC_SLUG = "scheduled-monument-consent-workflow"

#notification type
SMM_NOTIF_TYPE = "f49995b9-59ea-4f85-adbb-0e3a60587bd6"

details = {
    "functionid": "3211cb7d-2629-4eaf-94e7-1a371fabca5f",
    'name': 'Notify SMM',
    'type': 'node',
    'description': 'Will send notifications to the SMM teams when certain nodes are changed',
    'defaultconfig': {
        'triggering_nodegroups': [ 
            SIGN_OFF,
            ISSUE_REFERENCE,
            PROPOSAL,
        ],
    },
    'classname': 'NotifySMM',
    'component': '',
}

class NotifySMM(BaseFunction):
    def post_save(self, tile, request, context):
        from arches_orm.models import Person
        with admin():
            if context and context.get('escape_function', False):
                return

            strategy_registry = { 
                SIGN_OFF: FMWStrategy,
                ISSUE_REFERENCE: IssueReportStrategy,
                PROPOSAL: SMCStrategy
            }

            nodegroup_id = str(tile.nodegroup_id)

            user = request.user
            user_resource = Person.where(user_account=user.id)[0] if user and Person.where(user_account=user.id) else None
            
            notification_manager = NotificationManager(nodegroup_id, user_resource, tile, strategy_registry, request)

            notification_manager.notify()

class FMWStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        reference, resource_instance_id = self.get_resource_details(tile)

        if not reference.startswith("FMW"):
            return

        message = f"A new FMW Inspection {reference} has been started and requires attention"
        groups_to_notify = [ADMIN, SMM_CUR_D, SMM_CUR_E]

        notification = self.create_notification(message, reference, resource_instance_id, FMW_SLUG, SMM_NOTIF_TYPE)
                                
        self.notify_groups(user, groups_to_notify, notification)

class IssueReportStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile)

        message = f"A new Issue Report for {name} has been started and requires attention"
        groups_to_notify = [ADMIN, SMM_CUR_D]

        notification = self.create_notification(message, name, resource_instance_id, ISSUE_REPORT_SLUG, SMM_NOTIF_TYPE)
                                
        self.notify_groups(user, groups_to_notify, notification)

class SMCStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile)

        message = f"A new SMC for {name} has been started and requires attention"
        groups_to_notify = [ADMIN, SMM_CUR_D]

        notification = self.create_notification(message, name, resource_instance_id, SMC_SLUG, SMM_NOTIF_TYPE)
                                
        self.notify_groups(user, groups_to_notify, notification)