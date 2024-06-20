import logging
from coral.permissions.casbin import CasbinPermissionFramework
from celery import shared_task
from coral.utils.merge_resources import MergeResources
from arches.app.models import models

logging.basicConfig()

@shared_task
def recalculate_permissions_table():
    framework = CasbinPermissionFramework()
    enforcer = framework._enforcer
    framework.recalculate_table()
    enforcer.model.print_policy()

@shared_task
def merge_resources_task(user_id, base_resource_id, merge_resource_id, merge_tracker_resource_id):
        user = models.User.objects.get(pk=user_id)
        
        mr = MergeResources()
        mr.merge_resources(
            base_resource_id, merge_resource_id, merge_tracker_resource_id
        )
        mr.merge_resource.delete(user=user)