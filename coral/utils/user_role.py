PLANNING_GROUP_UUID = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP_UUID = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP_UUID = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER_UUID = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER_UUID = '9a88b67b-cb12-4137-a100-01a977335298'

class UserRole:
    def __init__(self, group_id: str = None):
        self.current_group_id = group_id

        self.planning_group = {
            'group_id': PLANNING_GROUP_UUID,
            'role_name': 'admin',
            'is_role': PLANNING_GROUP_UUID == self.current_group_id
        }

        self.hm_user = {
            'group_id': HM_GROUP_UUID,
            'role_name': 'hm_user',
            'is_role': HM_GROUP_UUID == self.current_group_id
        }

        self.hb_user = {
            'group_id': HB_GROUP_UUID,
            'role_name': 'hb_user',
            'is_role': HB_GROUP_UUID == self.current_group_id
        }

        self.hm_manager = {
            'group_id': HM_MANAGER_UUID,
            'role_name': 'hm_manager',
            'is_role': HM_MANAGER_UUID == self.current_group_id
        }

        self.hb_manager = {
            'group_id': HB_MANAGER_UUID,
            'role_name': 'hb_manager',
            'is_role': HB_MANAGER_UUID == self.current_group_id
        }
