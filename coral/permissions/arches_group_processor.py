from typing import List, Dict
import logging

from arches_orm.models import Group

logger = logging.getLogger(__name__)

class ArchesGroupProcessor:
    def __init__(self):
       self.groups_seen: Dict[str, List] = dict()
       self.sets: List[str] = []
       self.users = []

    def process_root_group(self, root_group: Group):
        """
        Recursively processes root group hierarchies, adding membership relationships, 
        user assignments, and permissions to Casbin for each group and its children.
        """
        self._process_group(root_group, list())
        return self.users, self.sets

    def _process_group(self, group: Group, ancestors: List[Group]) -> None:
        """
        Recursively process each group in the hierarchy adding membership relationships,
        user assignments and permissions to Cabsin
        """
        from .casbin import CasbinPermissionFramework

        group_key = CasbinPermissionFramework._subj_to_str(group)

        self._check_for_circular_reference(group, group_key, ancestors)
        self._process_group_members(group, group_key)

    def _check_for_circular_reference(self, group: Group, group_key: str, ancestors: List[Group]) -> List[Group] | List:
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
        
    def _process_group_members(self, group, group_key):
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

    def _add_policy_for_child_group_member(self, member, member_key, group_key):
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

    def _add_role_for_user_member(self, member, member_key, group_key):
        """Adds a role to the enforcerfor the user"""
        self._enforcer.add_role_for_user(member_key, group_key)
        self.users.append(member.user_account)