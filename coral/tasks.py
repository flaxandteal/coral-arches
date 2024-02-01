import logging
from coral.permissions.casbin import CasbinPermissionFramework
from celery import shared_task

logging.basicConfig()

@shared_task
def recalculate_permissions_table():
    framework = CasbinPermissionFramework()
    enforcer = framework._enforcer
    framework.recalculate_table()
    enforcer.model.print_policy()
