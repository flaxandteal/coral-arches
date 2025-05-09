from coral.views.dashboards.planning_strategy import PlanningTaskStrategy
from coral.views.dashboards.excavation_strategy import ExcavationTaskStrategy
from coral.views.dashboards.designation_strategy import DesignationTaskStrategy
from coral.views.dashboards.state_care_strategy import StateCareTaskStrategy


PLANNING_GROUP = '74afc49c-3c68-4f6c-839a-9bc5af76596b'
HM_GROUP = '29a43158-5f50-495f-869c-f651adf3ea42'
HB_GROUP = 'f240895c-edae-4b18-9c3b-875b0bf5b235'
HM_MANAGER = '905c40e1-430b-4ced-94b8-0cbdab04bc33'
HB_MANAGER = '9a88b67b-cb12-4137-a100-01a977335298'

EXCAVATION_ADMIN_GROUP = "4fbe3955-ccd3-4c5b-927e-71672c61f298"
EXCAVATION_USER_GROUP = "801c124e-acb8-484d-890b-212545e44293"
EXCAVATION_CUR_D = "751d8543-8e5e-4317-bcb8-700f1b421a90"
EXCAVATION_CUR_E = "214900b1-1359-404d-bba0-7dbd5f8486ef"

SECOND_SURVEY_GROUP_USER = '1ce90bd5-4063-4984-931a-cc971414d7db'
DESIGNATIONS_GROUP_USER = '7e044ca4-96cd-4550-8f0c-a2c860f99f6b'
SECOND_SURVEY_GROUP_MANAGER = '7679f42b-56ad-4b18-8b2c-cc6de1b16537'
DESIGNATIONS_GROUP_MANAGER = 'e778f4a1-97c6-446f-b1c4-418a81c3212e'

STATECARE_USERS = '2a8353fc-5dd3-4838-ae58-b1d7a4eeb36b'
STATECARE_CUR_E = '5b8d8413-ee01-465f-9774-e5b247cd205a'
STATECARE_CUR_D = '6ba1b471-6faf-4f96-9179-94b2a1662512'

STRATEGY_MAP = {
    # Planning Groups
    PLANNING_GROUP: ('planning_dashboard', PlanningTaskStrategy),
    HM_GROUP: ('planning_dashboard', PlanningTaskStrategy),
    HB_GROUP: ('planning_dashboard', PlanningTaskStrategy),
    HM_MANAGER: ('planning_dashboard', PlanningTaskStrategy),
    HB_MANAGER: ('planning_dashboard', PlanningTaskStrategy),
    # Excavation Groups
    EXCAVATION_ADMIN_GROUP: ('excavation_dashboard', ExcavationTaskStrategy),
    EXCAVATION_USER_GROUP: ('excavation_dashboard', ExcavationTaskStrategy),
    EXCAVATION_CUR_E: ('excavation_dashboard', ExcavationTaskStrategy),
    # Records and Designation Groups
    SECOND_SURVEY_GROUP_USER: ('designation_dashboard', DesignationTaskStrategy),
    DESIGNATIONS_GROUP_USER: ('designation_dashboard', DesignationTaskStrategy),
    SECOND_SURVEY_GROUP_MANAGER: ('designation_dashboard', DesignationTaskStrategy),
    DESIGNATIONS_GROUP_MANAGER: ('designation_dashboard', DesignationTaskStrategy),
    # State Care Groups
    STATECARE_USERS: ('state_care_dashboard', StateCareTaskStrategy),
    STATECARE_CUR_E: ('state_care_dashboard', StateCareTaskStrategy),
    STATECARE_CUR_D: ('state_care_dashboard', StateCareTaskStrategy),
}

def get_strategy(groupId):
    config = STRATEGY_MAP.get(groupId)

    if config:
        name, strategy_class = config
    return {
        'name': name,
        'strategy': strategy_class()
    }
