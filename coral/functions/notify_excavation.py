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
        from arches_orm.models import Person
        with admin():
            if context and context.get('escape_function', False):
                return
            
            strategy_registry = {
                SYSTEM_REFERENCE : SystemReferenceStrategy, 
                REPORT : ReportStrategy, 
                CUR_D_DECISION : CurDDecisionStrategy, 
                CUR_E_DECISON : CurEDecisionStrategy, 
                APPLICATION_DETAILS : ApplicationDetailsStrategy, 
                TRANSFER_OF_LICENCE : TransferOfLicenceStrategy,
                EXTENSION_OF_LICENCE: ExtensionOfLicenceStrategy
            }

            nodegroup_id = str(tile.nodegroup_id)

            user = request.user
            user_resource = Person.where(user_account=user.id)[0] if user and Person.where(user_account=user.id) else None
            
            notification_manager = NotificationManager(nodegroup_id, user_resource, tile, strategy_registry, request)

            notification_manager.notify()

class SystemReferenceStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name = tile.data[RESOURCE_ID].get("en").get("value").removeprefix('Excavation Licence').strip()

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        message = f"A new excavation licence {name} has been started and requires attention"
        groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP, CUR_D_GROUP]

        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                
        self.notify_groups(user, groups_to_notify, notification)

class CurEDecisionStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')
        decision_id = tile.data[GRADE_E_DECISION]
        decision_string = self.get_domain_value_string(decision_id, GRADE_E_DECISION)

        message = f"The Cur Grade E Decision has been set to '{decision_string}' for {name}. This requires further attention"
        groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP]

        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                
        self.notify_groups(user, groups_to_notify, notification)

class CurDDecisionStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')
        decision_id = tile.data[GRADE_D_DECISION]
        decision_string = self.get_domain_value_string(decision_id, GRADE_D_DECISION)

        message = f"The Cur Grade D Decision has been set to '{decision_string}' for {name}. This requires further attention"
        groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP]

        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                
        self.notify_groups(user, groups_to_notify, notification)

class ReportStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        from arches_orm.models import Group
        with admin():
            groups_to_notify = [CUR_D_GROUP, CUR_E_GROUP, ADMIN_GROUP]
            name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')

            message = f"A new report has been added to {name}"

            if user:
                admin_group = Group.find(ADMIN_GROUP)
                is_admin = any(member.id == user.id for member in admin_group.members)

                cur_e_group = Group.find(CUR_E_GROUP)
                is_cur_e = any(member.id == user.id for member in cur_e_group.members)

                cur_d_group = Group.find(CUR_D_GROUP)
                is_cur_d = any(member.id == user.id for member in cur_d_group.members)

                classification_type = tile.data[CLASSIFICATION_TYPE]
                classification_string = self.get_domain_value_string(classification_type, CLASSIFICATION_TYPE)
    
                if is_admin:
                    groups_to_notify = [CUR_D_GROUP, CUR_E_GROUP]
                elif is_cur_e and classification_type:
                    groups_to_notify = [CUR_D_GROUP, ADMIN_GROUP]
                    message = message + f" with classification type {classification_string}"
                elif is_cur_d and classification_type:
                    groups_to_notify = [CUR_E_GROUP, ADMIN_GROUP]
                    message = message + f" with classification type {classification_string}"
                

        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                        
        self.notify_groups(user, groups_to_notify, notification)

class ApplicationDetailsStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')

        soa_id = tile.data[STAGE_OF_APPLICATION]


        if soa_id:
            soa_string = self.get_domain_value_string(soa_id, STAGE_OF_APPLICATION)
            message = f"The Stage of Application for {name} has been updated to {soa_string}"

            notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                        
            groups_to_notify = [ADMIN_GROUP]
            self.notify_groups(user, groups_to_notify, notification)

class TransferOfLicenceStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')

        grade_e_decision = tile.data[TRANSFER_GRADE_E_DECISION]
        grade_d_decision = tile.data[TRANSFER_GRADE_D_DECISION]
        groups_to_notify = [ADMIN_GROUP]

        if not (grade_d_decision or grade_e_decision):
            groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP, CUR_E_GROUP]
            message = f"A Transfer of Licence has been created for {name}"
        elif grade_d_decision:
            decision_string = self.get_domain_value_string(grade_d_decision, TRANSFER_GRADE_D_DECISION)
            message = f"The Cur Grade D Decision for the Transfer of Licence {name} has been updated to {decision_string}"
            groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP]
        elif grade_e_decision and not grade_d_decision:
            decision_string = self.get_domain_value_string(grade_e_decision, TRANSFER_GRADE_E_DECISION)
            message = f"The Cur Grade E Decision for the Transfer of Licence  {name} has been updated to {decision_string}"
            groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP]
        

        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
        
        self.notify_groups(user, groups_to_notify, notification)

class ExtensionOfLicenceStrategy(NotificationStrategy):
    def send_notification(self, user, tile):
        name, resource_instance_id = self.get_resource_details(tile, 'Excavation Licence')

        grade_e_decision = tile.data[EXTENSION_GRADE_E_DECISION]
        grade_d_decision = tile.data[EXTENSION_GRADE_D_DECISION]
        groups_to_notify = [ADMIN_GROUP]

        if not (grade_d_decision or grade_e_decision):
            groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP, CUR_E_GROUP]
            message = f"An Extension of Licence {name} has been created"
        elif grade_d_decision:
            decision_string = self.get_domain_value_string(grade_d_decision, EXTENSION_GRADE_D_DECISION)
            message = f"The Cur Grade D Decision for the extension of licence {name} has been updated to {decision_string}"
            groups_to_notify = [ADMIN_GROUP, CUR_E_GROUP]
        elif grade_e_decision and not grade_d_decision:
            decision_string = self.get_domain_value_string(grade_e_decision, EXTENSION_GRADE_E_DECISION)
            message = f"The Cur Grade E Decision for the extension of licence {name} has been updated to {decision_string}"
            groups_to_notify = [ADMIN_GROUP, CUR_D_GROUP]
            
        notification = self.create_notification(message, name, resource_instance_id, EXCAVATION_SLUG)
                                    
        self.notify_groups(user, groups_to_notify, notification)

