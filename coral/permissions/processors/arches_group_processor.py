from typing import List, Dict
import logging

from .group_permissions_processor import GroupPermissionProcessor
from .arches_plugin_processor import ArchesPluginProcessor

from django.contrib.auth.models import User

from arches_orm.models import Group
from arches_orm.arches_django.datatypes.django_group import MissingDjangoGroupViewModel

logger = logging.getLogger(__name__)

class ArchesGroupProcessor:
    def __init__(self, enforcer):
       self.groups_seen: Dict[str, List] = dict()
       self.sets: List[str] = []
       self.users = []
       self._enforcer = enforcer
       self.permission_processor = GroupPermissionProcessor(enforcer)
       self.plugin_processor = ArchesPluginProcessor(enforcer)

    def process_group(self, group: Group, ancestors: List[Group]) -> None:
        """
        Recursively process each group in the hierarchy adding membership relationships,
        user assignments and permissions to Cabsin
        """
        from ..casbin import CasbinPermissionFramework

        group_key = CasbinPermissionFramework._subj_to_str(group)
        self.users = []
        self._check_for_circular_reference(group, group_key, ancestors)
        self._process_group_members(group, group_key)
        self.plugin_processor.process_group_plugins(group, group_key)
        self.sets.extend(self.permission_processor.process_group_permissions(group, group_key))
        self._sync_django_groups(group, group_key, self.users)
        return self.users

    def _check_for_circular_reference(self, group: Group, group_key: str, ancestors: List[Group]) -> List[Group] | List:
        """Check for circular references in the group hierarchy"""
        if group_key in ancestors:
            try:
                group_name = str(group)
            except Exception as e:
                group_name = "(name error)"
                logger.exception("Name to string casting for a group: %s", str(e))
            logger.warning("There is a circular reference - %s for %s", group_key, group_name)
            return []
        if group_key in self.groups_seen:
            return self.groups_seen[group_key]
        
    def _process_group_members(self, group: Group, group_key: str) -> None:
        """Traverse the tree structure and add grouping policy or user roles based on the type"""
        from .casbin import CasbinPermissionFramework
 
        for n, member in enumerate(group.members):
            member_key = CasbinPermissionFramework._subj_to_str(member)
            if isinstance(member, Group):
                self._add_policy_for_child_group_member(member, member_key, group_key)
            elif member.user_account:
                self._add_role_for_user_member(member, member_key, group_key)
            else:
                logger.warning("A membership rule was not added as no User was attached %s", member.id)

    def _add_policy_for_child_group_member(self, member: Group, member_key: str, group_key:str) -> None:
        """Adds a policy to the enforcer for the group, updates the ancestor list and checks for any further child groups"""
        # This is the reverse of what might be expected, as the more deeply
        # nested a group is, the _fewer_ permissions it has. Conversely, the
        # top groups gather all the permissions from the groups below them,
        # which fits Casbin's transitivity when top groups are _Casbin members of_
        # the groups below them.
        self._enforcer.add_named_grouping_policy("g", group_key, member_key)
        ancestors = list(ancestors)
        ancestors.append(group_key)
        self.users += self._process_group(member, ancestors)

    def _add_role_for_user_member(self, member: User, member_key: str, group_key: str) -> None:
        """Adds a role to the enforcerfor the user"""
        self._enforcer.add_role_for_user(member_key, group_key)
        self.users.append(member.user_account)

    def _sync_django_groups(self, group: Group, group_key: str, users: List[User]) -> None:
        """Synchronize users between Arches group and associated Django groups"""
        from .casbin import CasbinPermissionFramework
        
        if len(group.django_group) == 0:
            CasbinPermissionFramework._ri_to_django_groups(group)
        
        for gp in group.django_group:
            if not gp or gp.pk is None or isinstance(gp, MissingDjangoGroupViewModel):
                logger.warning("Missing Django Group in a group: %s for %s", group_key, str(gp.pk) if gp else str(gp))
                continue
            if list(gp.user_set.all()) != users:
                gp.user_set.set(users)
                gp.save()