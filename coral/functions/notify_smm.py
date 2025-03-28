from arches.app.functions.base import BaseFunction
from arches_orm.adapter import admin
from coral.functions.notifications.notification_manager import NotificationManager
import logging
import os

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
ISSUE_REPORT_SLUG = "issue-report-workflow"
SMC_SLUG = "scheduled-monument-consent-workflow"


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
        if context and context.get('escape_function', False):
            return

        strategy_registry = { 
            # FMW Workflow
            SIGN_OFF: {
                'config': {
                    'message': "A new FMW Inspection {name} has been started and requires attention",
                    'response_slug': "fmw-inspection-workflow",
                    'notiftype_id': "f49995b9-59ea-4f85-adbb-0e3a60587bd6",
                    'groups_to_notify': [ADMIN, SMM_CUR_D, SMM_CUR_E],
                    'email': True,
                    'check_prefix': 'FMW'
                }
            },
            # Issue Report
            ISSUE_REFERENCE: {
                'config': {
                    'message': "A new Issue Report for {name} has been started and requires attention",
                    'response_slug': "issue-report-workflow",
                    'notiftype_id': "f49995b9-59ea-4f85-adbb-0e3a60587bd6",
                    'groups_to_notify': [ADMIN, SMM_CUR_D],
                    'email': True,
                }
            },
            # SMC Workflow
            PROPOSAL: {
                'config': {
                    'message': "A new SMC for {name} has been started and requires attention",
                    'response_slug': "scheduled-monument-consent-workflow",
                    'notiftype_id': "f49995b9-59ea-4f85-adbb-0e3a60587bd6",
                    'groups_to_notify': [ADMIN, SMM_CUR_D],
                    'email': True,
                }
            },
        }
        
        notification_manager = NotificationManager(tile, strategy_registry, request)

        notification_manager.notify()
            