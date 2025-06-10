import logging

from django.contrib.auth.models import User
from django.db import transaction

from arches_orm.models import Group, Set, LogicalSet
from arches.app.models.system_settings import settings

from .processors import ArchesGroupProcessor, DjangoGroupProcessor, SetProcessor

logger = logging.getLogger(__name__)

class CasbinPolicyBuilder:
    """
    Orchestrates the complete recalculation of Casbin policies from Django groups,
    Arches groups, and set relationships.
    """
    
    def __init__(self, enforcer):
        self._enforcer = enforcer
        self.sets = []
        self.django_processor = DjangoGroupProcessor(enforcer)
        self.arches_group_processor = ArchesGroupProcessor(enforcer)
        self.set_processor = SetProcessor(enforcer)
        
    @transaction.atomic
    def rebuild_policies(self):
        """Complete rebuild of all Casbin policies"""

        self._enforcer.clear_policy()
        
        self.django_processor.process_all_groups()

        groups = settings.GROUPINGS["groups"]
        root_group = Group.find(groups["root_group"])
        
        self.arches_group_processor.process_group(root_group, [])

        self.sets = self.arches_group_processor.sets
   
        self._process_django_user_groups()
        
        self.set_processor.process_sets(self.sets)
        
        self._finalize_policies()

        self._trigger_reload_if_needed()
    
    def _process_django_user_groups(self):
        """Process Django user groups and add casbin policies"""
        for user in User.objects.all():
            user_key = self._subj_to_str(user)
            for group in user.groups.all():
                group_key = self._subj_to_str(group)
                self._enforcer.add_named_grouping_policy("g", user_key, group_key)
    
    def _finalize_policies(self):
        """Save and reload policies"""
        self._enforcer.save_policy()
        self._enforcer.load_policy()
    
    def _trigger_reload_if_needed(self):
        """Trigger reload in other processes if configured"""
        import os
        if os.getenv("CASBIN_LISTEN", False):
            from .casbin import trigger
            trigger.request_reload()
