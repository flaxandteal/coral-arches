from typing import Dict, Set, Tuple, Any
from guardian.core import ObjectPermissionChecker

from django.contrib.auth.models import Group as DjangoGroup
from arches.app.permissions.arches_standard import get_nodegroups_by_perm_for_user_or_group

from arches.app.models.models import Node, MapLayer
from arches.app.models.graph import Graph
from arches.app.models.system_settings import SystemSettings

GraphPermData = Tuple[Dict[str, Set[str]], Dict[str, Graph]]

class DjangoGroupProcessor:
    def __init__(self, enforcer):
        self._enforcer = enforcer

    def process_all_groups(self):
        """Process all Django groups for nodegroup and map layer permissions"""
        for django_group in DjangoGroup.objects.all():
            self._process_single_group(django_group)
    
    def _process_single_group(self, django_group: DjangoGroup) -> None:
        """Process a single django group to build the permissions"""
        from ..casbin import CasbinPermissionFramework
        group_key = CasbinPermissionFramework._subj_to_str(django_group)

        self._add_group_naming_policy(django_group, group_key)
        self._process_nodegroup_permissions(django_group, group_key)
        self._process_map_layer_permissions(django_group, group_key)
        
    def _add_group_naming_policy(self, django_group: DjangoGroup, group_key: str) -> None:
        """Add the group naming policy to the enforcer"""
        self._enforcer.add_named_grouping_policy("g", group_key, f"dgn:{django_group.name}")

    def _process_nodegroup_permissions(self, django_group: DjangoGroup, group_key: str) -> None:
        """Process the arches nodegroup permissions and convert them into graph permissions"""
        from ..casbin import CasbinPermissionFramework
        nodegroups = {
                str(nodegroup.pk): set(perms) if perms else set(CasbinPermissionFramework.GRAPH_REMAPPINGS.values())
                for nodegroup, perms in
                get_nodegroups_by_perm_for_user_or_group(django_group, ignore_perms=True).items()
            }
        graph_perms = self._build_graph_permissions(nodegroups)
        self._add_graph_policies(graph_perms, group_key)
        
    def _build_graph_permissions(self, nodegroups: Dict[str, Set[str]]) -> GraphPermData:
        """Build graph permissions from the nodegroup permissions"""
        nodes = Node.objects.filter(
                nodegroup__in=nodegroups
            ).select_related("graph").only("graph__graphid", "nodegroup_id")
        
        graphs = {}
        graph_perms = {}
        
        for node in nodes:
            key = f"gp:{node.graph.graphid}"
            graph_perms.setdefault(key, set())
            graph_perms[key] |= set(nodegroups[str(node.nodegroup_id)])
            graphs[key] = node.graph

        return graph_perms, graphs

    def _add_graph_policies(self, graph_data: GraphPermData, group_key: str) -> None:
        """Add the graph policy to the enforcer"""
        graph_perms, graphs = graph_data

        for graph, perms in graph_perms.items():
            if graphs[graph].isresource and str(graph[3:]) != SystemSettings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID:
                for perm in perms:
                    self._enforcer.add_policy(group_key, graph, str(perm))

    def _process_map_layer_permissions(self, django_group: DjangoGroup, group_key: str) -> None:
        from ..casbin import CasbinPermissionFramework
        """Process the map layers and add each layer to the enforcer"""
        map_layer_perms = ObjectPermissionChecker(django_group)

        for map_layer in MapLayer.objects.all():
            perms = set(map_layer_perms.get_perms(map_layer))
            map_layer_key = CasbinPermissionFramework._obj_to_str(map_layer)
            for perm in perms:
                self._enforcer.add_policy(group_key, map_layer_key, str(perm))
