from arches_orm.models import Group, ArchesPlugin
from arches.app.models.models import Plugin
from casbin import Enforcer
import uuid
from typing import List

import logging
logger = logging.getLogger(__name__)

class GroupPermissionProcessor:
    """
    A class to extract the arches group permissions and update the permission policies.
    """

    def __init__(self, enforcer: Enforcer):
        self._enforcer = enforcer
        self.sets: List[str] = []

    def process_group_permissions(self, group: Group, group_key: str) -> List[str]:
        from ..casbin import CasbinPermissionFramework
        """Process the group permissions node and add a policy to the enforcer for each permission"""
        for permission in group.permissions:
            if not permission.action:
                logging.warning("Permission action is missing: %s: %s on %s", group_key, str(permission.action), str(permission.object))
                continue
            for act in permission.action:
                if not permission.object:
                    logging.warning("Permission object is missing: %s %s", group_key, str(permission.object))
                    continue
                for obj in permission.object:
                    obj_key = CasbinPermissionFramework._obj_to_str(obj)
                    if obj_key.startswith("g2"):
                        self.sets.append(obj_key)
                    self._enforcer.add_policy(group_key, obj_key, str(act.conceptid))
        return self.sets