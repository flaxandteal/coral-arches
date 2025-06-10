import logging
from typing import List, Set as PythonSet

from arches_orm.models import Set, LogicalSet

logger = logging.getLogger(__name__)

class SetProcessor:
    """
    Processes sets and logical sets, handling their nesting relationships
    and adding appropriate grouping policies to Casbin.
    """
    
    def __init__(self, enforcer):
        self._enforcer = enforcer
        self.processed_sets: PythonSet[str] = set()
    
    def process_sets(self, sets_to_process: List[str]) -> None:
        """Process all collected sets and their nesting relationships"""
        remaining_sets = list(sets_to_process)
        
        while remaining_sets:
            obj_key = remaining_sets[0]
            if obj_key in self.processed_sets:
                remaining_sets.remove(obj_key)
                continue
                
            root_set = self._get_set_from_key(obj_key)
            if root_set:
                self._fill_set(root_set, [])
            else:
                remaining_sets.remove(obj_key)
    
    def _get_set_from_key(self, obj_key: str):
        """Retrieve set or logical set from object key"""
        try:
            if obj_key.startswith("g2l:"):
                return LogicalSet.find(obj_key.split(":")[1])
            else:
                return Set.find(obj_key.split(":")[1])
        except Exception as e:
            logger.warning("Could not find set for key %s: %s", obj_key, str(e))
            return None
    
    def _fill_set(self, st, ancestors: List[str]) -> None:
        """Process a set and its nested relationships"""
        from ..casbin import CasbinPermissionFramework
        
        set_key = CasbinPermissionFramework._obj_to_str(st)
        
        if set_key in ancestors:
            self._log_circular_set_reference(st, set_key)
            return
        
        self.processed_sets.add(set_key)
        
        # Handle nested sets (only for Set, not LogicalSet)
        if isinstance(st, Set) and st.nested_sets:
            for nested_set in st.nested_sets:
                nested_set_key = CasbinPermissionFramework._obj_to_str(nested_set)
                self._enforcer.add_named_grouping_policy("g2", nested_set_key, set_key)
                ancestors = list(ancestors)
                ancestors.append(set_key)
                self._fill_set(nested_set, ancestors)
        
        # Handle set members
        if isinstance(st, Set) and st.members:
            for member in st.members:
                member_key = CasbinPermissionFramework._obj_to_str(member)
                self._enforcer.add_named_grouping_policy("g2", member_key, set_key)
    
    def _log_circular_set_reference(self, st, set_key: str) -> None:
        """Log circular reference in sets"""
        try:
            set_name = str(st)
        except Exception as e:
            set_name = "(name error)"
            logger.exception("Name to string casting for a set: %s", str(e))
        logger.warning("There is a circular nested set reference - %s for %s", set_key, set_name)