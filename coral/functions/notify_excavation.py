from arches.app.functions.base import BaseFunction
from arches_orm.adapter import admin
from coral.functions.notifications.notification_base_strategy import NotificationStrategy
from coral.functions.notifications.notification_manager import NotificationManager

# node groups
SYSTEM_REFERENCE = '991c3c74-48b6-11ee-85af-0242ac140007'
REPORT = 'f060583a-6120-11ee-9fd1-0242ac120003'
CUR_E_DECISON = '69f2eb3c-c430-11ee-94bf-0242ac180006'
CUR_D_DECISION = 'c9f504b4-c42d-11ee-94bf-0242ac180006'
APPLICATION_DETAILS = '4f0f655c-48cf-11ee-8e4e-0242ac140007'
TRANSFER_OF_LICENCE = '6397b05c-c443-11ee-94bf-0242ac180006'
EXTENSION_OF_LICENCE = '69b2738e-c4d2-11ee-b171-0242ac180006'

# groups
ADMIN_GROUP = '4fbe3955-ccd3-4c5b-927e-71672c61f298'
CUR_D_GROUP = '751d8543-8e5e-4317-bcb8-700f1b421a90'
CUR_E_GROUP = '214900b1-1359-404d-bba0-7dbd5f8486ef'

#nodes
RESOURCE_ID = '991c49b2-48b6-11ee-85af-0242ac140007'
GRADE_E_DECISION = 'a68fa38c-c430-11ee-bc4b-0242ac180006'
GRADE_D_DECISION = '2a5151f0-c42e-11ee-94bf-0242ac180006'
CLASSIFICATION_TYPE = '8d13575c-dc70-11ee-8def-0242ac120006'
STAGE_OF_APPLICATION = 'a79fedae-bad5-11ee-900d-0242ac180006'
TRANSFER_GRADE_E_DECISION = '058cd212-c44d-11ee-94bf-0242ac180006'
TRANSFER_GRADE_D_DECISION = '6bc889fe-c44d-11ee-94bf-0242ac180006'
EXTENSION_GRADE_E_DECISION = '50970b20-c4d3-11ee-90c5-0242ac180006'
EXTENSION_GRADE_D_DECISION = '2e7a81b0-c4d4-11ee-b171-0242ac180006'

#response slugs
EXCAVATION_SLUG = 'licensing-workflow'

details = {
    "functionid": "e3ec9aa7-dad3-444a-bb44-9d71a8eaf017",
    'name': 'Notify Excavation',
    'type': 'node',
    'description': 'Will send notifications to the Excavation team when certain nodes are changed',
    'defaultconfig': {
        'triggering_nodegroups': [
            SYSTEM_REFERENCE, 
            REPORT, 
            CUR_E_DECISON, 
            CUR_D_DECISION, 
            APPLICATION_DETAILS, 
            TRANSFER_OF_LICENCE,
            EXTENSION_OF_LICENCE 
        ],
    },
    'classname': 'NotifyExcavation',
    'component': '',
}

class NotifyExcavation(BaseFunction):
    def post_save(self, tile, request, context):
        if context and context.get('escape_function', False):
            return
        
        strategy_registry = {
            SYSTEM_REFERENCE : {
                'config': {
                    'message': "A new excavation licence {name} has been started and requires attention",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP, CUR_E_GROUP, CUR_D_GROUP],
                    'email': False
                }
            },
            REPORT : {
                'strategy': ReportStrategy,
                'config': {
                    'message': "A new report has been added to {name}",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [CUR_D_GROUP, CUR_E_GROUP, ADMIN_GROUP],
                    'email': False
                }
            }, 
            CUR_D_DECISION : {
                'strategy': CurDDecisionStrategy,
                'config': {
                    'message': "The Cur Grade D Decision has been updated for {name}.",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP, CUR_E_GROUP],
                    'email': False
                }
            },  
            CUR_E_DECISON : {
                'strategy': CurEDecisionStrategy,
                'config': {
                    'message': "The Cur Grade E Decision has been updated for {name}.",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP, CUR_D_GROUP],
                    'email': False
                }
            },  
            APPLICATION_DETAILS : {
                'strategy': ApplicationDetailsStrategy,
                'config': {
                    'message': "The Stage of Application for {name} has been updated",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP],
                    'email': False
                }
            }, 
            TRANSFER_OF_LICENCE : {
                'strategy': TransferOfLicenceStrategy,
                'config': {
                    'message': "A Transfer of Licence has been created for {name}",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP],
                    'email': False
                }
            }, 
            EXTENSION_OF_LICENCE: {
                'strategy': ExtensionOfLicenceStrategy,
                'config': {
                    'message': "An Extension of Licence {name} has been created",
                    'remove_prefix': 'Excavation Licence',
                    'response_slug': 'licensing-workflow',
                    'groups_to_notify': [ADMIN_GROUP],
                    'email': False
                }
            }, 
        }

        notification_manager = NotificationManager(tile, strategy_registry, request)

        notification_manager.notify()
class CurEDecisionStrategy(NotificationStrategy):
    def send_notification(self):
        decision_id = self.tile.data[GRADE_E_DECISION]
        decision_string = self.get_domain_value_string(decision_id, GRADE_E_DECISION)

        if decision_string:
            self.config['message'] = f"The Cur Grade E Decision has been set to '{decision_string}' for {self.name}. This requires further attention"

        super().send_notification()

class CurDDecisionStrategy(NotificationStrategy):
    def send_notification(self):
        decision_id = self.tile.data[GRADE_D_DECISION]
        decision_string = self.get_domain_value_string(decision_id, GRADE_D_DECISION)

        if decision_string:
            self.config['message'] = f"The Cur Grade D Decision has been set to '{decision_string}' for {self.name}. This requires further attention"

        super().send_notification()

class ReportStrategy(NotificationStrategy):
    def send_notification(self):
        from arches_orm.models import Group
        with admin():
            if self.user:
                admin_group = Group.find(ADMIN_GROUP)
                is_admin = any(member.id == self.user.id for member in admin_group.members)

                cur_e_group = Group.find(CUR_E_GROUP)
                is_cur_e = any(member.id == self.user.id for member in cur_e_group.members)

                cur_d_group = Group.find(CUR_D_GROUP)
                is_cur_d = any(member.id == self.user.id for member in cur_d_group.members)

                classification_type = self.tile.data[CLASSIFICATION_TYPE]
                classification_string = self.get_domain_value_string(classification_type, CLASSIFICATION_TYPE)
    
                if is_admin:
                    self.config['groups_to_notify'] = [CUR_D_GROUP, CUR_E_GROUP]
                elif is_cur_e and classification_type:
                    self.config['groups_to_notify'] = [CUR_D_GROUP, ADMIN_GROUP]
                    self.config['message'] = self.config['message'] + f" with classification type {classification_string}"
                elif is_cur_d and classification_type:
                    self.config['groups_to_notify'] = [CUR_E_GROUP, ADMIN_GROUP]
                    self.config['message'] = self.config['message'] + f" with classification type {classification_string}"
                                        
        super().send_notification()

class ApplicationDetailsStrategy(NotificationStrategy):
    def send_notification(self):

        soa_id = self.tile.data[STAGE_OF_APPLICATION]

        if soa_id:
            soa_string = self.get_domain_value_string(soa_id, STAGE_OF_APPLICATION)
            self.config['message'] = f"The Stage of Application for {self.name} has been updated to {soa_string}"

            super().send_notification()

class TransferOfLicenceStrategy(NotificationStrategy):
    def send_notification(self):

        grade_e_decision = self.tile.data[TRANSFER_GRADE_E_DECISION]
        grade_d_decision = self.tile.data[TRANSFER_GRADE_D_DECISION]

        if not (grade_d_decision or grade_e_decision):
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_D_GROUP, CUR_E_GROUP]
            self.config['message'] = f"A Transfer of Licence has been created for {self.name}"
        elif grade_d_decision:
            decision_string = self.get_domain_value_string(grade_d_decision, TRANSFER_GRADE_D_DECISION)
            self.config['message'] = f"The Cur Grade D Decision for the Transfer of Licence {self.name} has been updated to {decision_string}"
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_E_GROUP]
        elif grade_e_decision and not grade_d_decision:
            decision_string = self.get_domain_value_string(grade_e_decision, TRANSFER_GRADE_E_DECISION)
            self.config['message'] = f"The Cur Grade E Decision for the Transfer of Licence  {self.name} has been updated to {decision_string}"
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_D_GROUP]
        

        super().send_notification()

class ExtensionOfLicenceStrategy(NotificationStrategy):
    def send_notification(self):

        grade_e_decision = self.tile.data[EXTENSION_GRADE_E_DECISION]
        grade_d_decision = self.tile.data[EXTENSION_GRADE_D_DECISION]

        if not (grade_d_decision or grade_e_decision):
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_D_GROUP, CUR_E_GROUP]
            self.config['message'] = f"An Extension of Licence {self.name} has been created"
        elif grade_d_decision:
            decision_string = self.get_domain_value_string(grade_d_decision, EXTENSION_GRADE_D_DECISION)
            self.config['message'] = f"The Cur Grade D Decision for the extension of licence {self.name} has been updated to {decision_string}"
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_E_GROUP]
        elif grade_e_decision and not grade_d_decision:
            decision_string = self.get_domain_value_string(grade_e_decision, EXTENSION_GRADE_E_DECISION)
            self.config['message'] = f"The Cur Grade E Decision for the extension of licence {self.name} has been updated to {decision_string}"
            self.config['groups_to_notify'] = [ADMIN_GROUP, CUR_D_GROUP]
            
        super().send_notification()

