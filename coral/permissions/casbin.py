import logging
import pika
import time
from guardian.core import ObjectPermissionChecker
from dauthz.backends.casbin_backend import CasbinBackend
# https://github.com/casbin/pycasbin/issues/323
logging.disable(logging.NOTSET)
logging.getLogger("casbin_adapter").setLevel(logging.ERROR)

from django.core.exceptions import ObjectDoesNotExist
from arches.app.models.system_settings import settings, SystemSettings
from django.contrib.auth.models import User, Permission, Group as DjangoGroup
import logging
from guardian.shortcuts import (
    get_users_with_perms,
)
from arches.app.models.resource import Resource
from django.db import transaction

from guardian.models import GroupObjectPermission

from arches.app.models.models import *
from arches.app.models.models import ResourceInstance, MapLayer
from arches.app.models.graph import Graph
from arches.app.models.resource import Resource
from arches.app.search.elasticsearch_dsl_builder import Query
from arches.app.search.mappings import RESOURCES_INDEX
from arches.app.utils.permission_backend import PermissionFramework, NotUserNorGroup as ArchesNotUserNorGroup
from arches.app.permissions.arches_standard import get_nodegroups_by_perm_for_user_or_group, assign_perm, ArchesStandardPermissionFramework
from arches.app.models.resource import UnindexedError
from arches_orm.models import Person, Organization, Set, LogicalSet, Group
from arches_orm.view_models import ResourceInstanceViewModel
from arches_orm.adapter import context_free
from arches.app.search.search_engine_factory import SearchEngineInstance as se

logger = logging.getLogger(__name__)
REMAPPINGS = {
    "809598ac-6dc5-498e-a7af-52b1381942a4": ["change_resourceinstance"],
    "33a0218b-b1cc-42d8-9a79-31a6b2147893": ["delete_resourceinstance"],
    "70415d03-b11b-48a6-b989-933d788ffc88": ["view_resourceinstance"],
    "45d54859-bf3c-48f2-a387-55a0050ff572": ["execute_resourceinstance"],
}
GRAPH_REMAPPINGS = {
    "809598ac-6dc5-498e-a7af-52b1381942a4": "models.write_nodegroup",
    "33a0218b-b1cc-42d8-9a79-31a6b2147893": "models.write_nodegroup",
    "70415d03-b11b-48a6-b989-933d788ffc88": "models.read_nodegroup",
    "45d54859-bf3c-48f2-a387-55a0050ff572": "models.write_nodegroup",
}
REV_GRAPH_REMAPPINGS = {v: k for k, v in GRAPH_REMAPPINGS.items()}
RESOURCE_TO_GRAPH_REMAPPINGS = {v[0]: GRAPH_REMAPPINGS[k] for k, v in REMAPPINGS.items()}


class NoSubjectError(RuntimeError):
    pass

class CasbinPermissionFramework(ArchesStandardPermissionFramework):
    @property
    def _enforcer(self):
        from dauthz.core import enforcer
        return enforcer

    @context_free
    def get_perms_for_model(self, cls):
        # Credit: django-guardian
        # https://github.com/zulip/django-guardian/blob/master/guardian/shortcuts.py
        # Even if we do not use Django's own auth for permissions, we can use it
        # for loading the names
        if isinstance(cls, str):
            app_label, model_name = cls.split('.')
            model = models.get_model(app_label, model_name)
        else:
            model = cls
        ctype = ContentType.objects.get_for_model(model)
        return Permission.objects.filter(content_type=ctype)

    @staticmethod
    def _subj_to_str(subj):
        if isinstance(subj, DjangoGroup):
            subj = f"dg:{subj.pk}"
        if isinstance(subj, Person):
            if not subj.user_account:
                raise NoSubjectError(subj)
            subj = f"u:{subj.user_account.pk}"
        if isinstance(subj, User):
            subj = f"u:{subj.pk}"
        elif isinstance(subj, Organization):
            subj = f"u:{subj.id}"
        elif isinstance(subj, Group):
            subj = f"g1:{subj.id}"
        elif isinstance(subj, str) and ":" in subj:
            return subj
        else:
            raise ArchesNotUserNorGroup(str(subj))
        return subj

    @staticmethod
    def _obj_to_str(obj):
        if obj is None:
            raise NotImplementedError()
        elif isinstance(obj, str) and ":" in obj:
            return obj
        elif isinstance(obj, Set):
            obj = f"g2:{obj.id}"
        elif isinstance(obj, LogicalSet):
            obj = f"g2l:{obj.id}"
        elif isinstance(obj, Graph) or isinstance(obj, GraphModel):
            obj = f"gp:{obj.pk}"
        elif isinstance(obj, ResourceInstanceViewModel):
            obj = f"ri:{obj.id}"
        elif isinstance(obj, ResourceInstance) or isinstance(obj, Resource):
            obj = f"ri:{obj.pk}"
        elif isinstance(obj, NodeGroup):
            obj = f"ng:{obj.pk}"
        elif isinstance(obj, MapLayer):
            obj = f"ml:{obj.pk}"
        elif isinstance(obj, Permission):
            obj = f"ct:{obj.content_type}"
        else:
            obj = f"o:{obj.pk}"
        return obj

    @context_free
    def recalculate_table(self):
        with transaction.atomic():
            self._recalculate_table_real()

    def _recalculate_table_real(self):
        groups = settings.GROUPINGS["groups"]
        root_group = Group.find(groups["root_group"])
        self._enforcer.clear_policy()

        # We bank permissions for all Django groups for nodegroups,
        # (implicitly resource models) and map layers, but nothing else.
        for django_group in DjangoGroup.objects.all():
            group_key = self._subj_to_str(django_group)
            nodegroups = {
                nodegroup: set(perms)
                for nodegroup, perms in
                get_nodegroups_by_perm_for_user_or_group(django_group, ignore_perms=True).items()
            }
            for nodegroup, perms in nodegroups.items():
                nodegroup_key = self._obj_to_str(nodegroup)
                for perm in perms:
                    self._enforcer.add_policy(group_key, nodegroup_key, str(perm))
            nodes = Node.objects.filter(nodegroup__in=nodegroups).select_related("graph")
            graph_perms = {}
            for node in nodes:
                graph_perms.setdefault(node.graph, set())
                graph_perms[node.graph] |= set(nodegroups[node.nodegroup])
            for graph, perms in graph_perms.items():
                if graph.isresource and str(graph.pk) != SystemSettings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID:
                    graph_key = self._obj_to_str(graph)
                    for perm in perms:
                        self._enforcer.add_policy(group_key, graph_key, str(perm))
            map_layer_perms = ObjectPermissionChecker(django_group)
            for map_layer in MapLayer.objects.all():
                perms = set(map_layer_perms.get_perms(map_layer))
                map_layer_key = self._obj_to_str(map_layer)
                for perm in perms:
                    self._enforcer.add_policy(group_key, map_layer_key, str(perm))

        sets = []

        def _fill_group(group):
            group_key = self._subj_to_str(group)
            users = []
            for member in group.members:
                if isinstance(member, Group):
                    member_key = self._subj_to_str(member)
                    # This is the reverse of what might be expected, as the more deeply
                    # nested a group is, the _fewer_ permissions it has. Conversely, the
                    # top groups gather all the permissions from the groups below them,
                    # which fits Casbin's transitivity when top groups are _Casbin members of_
                    # the groups below them.
                    self._enforcer.add_named_grouping_policy("g", group_key, member_key)
                    users += _fill_group(member)
                elif member.user_account:
                    member_key = self._subj_to_str(member)
                    self._enforcer.add_role_for_user(member_key, group_key)
                    users.append(member.user_account)
                else:
                    logger.warn("A membership rule was not added as no User was attached %s", member.id)
            # This is a workaround for now, to avoid losing nodegroup restriction entirely.
            # The (RI) Group names will be matched to Django groups, and those used to build the nodegroup
            # permissions.
            # for django_group in self._ri_to_django_groups(group):
            #     nodegroups = get_nodegroups_by_perm_for_user_or_group(django_group, ignore_perms=True)
            #     for nodegroup, perms in nodegroups.items():
            #         for act in perms:
            #             obj_key = self._obj_to_str(nodegroup)
            #             self._enforcer.add_policy(group_key, obj_key, str(act))
            for permission in group.permissions:
                for act in permission.action:
                    for obj in permission.object:
                        obj_key = self._obj_to_str(obj)
                        if obj_key.startswith("g2"):
                            sets.append(obj_key)
                        self._enforcer.add_policy(group_key, obj_key, str(act.conceptid))
            if len(group.django_group) == 0:
                self._ri_to_django_groups(group)
            for group in group.django_group:
                if list(group.user_set.all()) != users:
                    group.user_set.set(users)
                    group.save()
            return users

        sets = []

        _fill_group(root_group)

        for user in User.objects.all():
            user_key = self._subj_to_str(user)
            for group in user.groups.all():
                group_key = self._subj_to_str(group)
                self._enforcer.add_named_grouping_policy("g", user_key, group_key)
                self._enforcer.add_named_grouping_policy("g", user_key, f"dgn:{group.name}")

        def _fill_set(st):
            set_key = self._obj_to_str(st)
            if set_key in sets:
                sets.remove(set_key)
            # We do not currently handle nesting of logical sets
            if isinstance(st, Set):
                if st.nested_sets:
                    for nst in st.nested_sets:
                        nested_set_key = self._obj_to_str(nst)
                        self._enforcer.add_named_grouping_policy("g2", nested_set_key, set_key)
                        _fill_set(nst)
                if st.members:
                    for member in st.members:
                        member_key = self._obj_to_str(member)
                        self._enforcer.add_named_grouping_policy("g2", member_key, set_key)

        while sets:
            obj_key = sets[0]
            if obj_key.startswith("g2l:"):
                root_set = LogicalSet.find(obj_key.split(":")[1])
            else:
                root_set = Set.find(obj_key.split(":")[1])
            _fill_set(root_set)

        self._enforcer.save_policy()
        self._enforcer.load_policy()

        if os.getenv("CASBIN_LISTEN", False):
            trigger.request_reload()

    @context_free
    def update_permissions_for_user(self, user):
        perms = {(self._obj_to_str(permission), permission.codename) for permission in user.user_permissions.all()}
        user = self._subj_to_str(user)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(user)}
        for obj, act in perms - was:
            self._enforcer.add_policy(user, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(user, obj, act)
        self._enforcer.save_policy()

    @context_free
    def update_permissions_for_group(self, group):
        perms = {(self._obj_to_str(permission), permission.codename) for permission in group.permissions.all()}
        group = self._subj_to_str(group)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(group)}
        for obj, act in perms - was:
            self._enforcer.add_policy(group, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(group, obj, act)
        self._enforcer.save_policy()

    @staticmethod
    @context_free
    def _ri_to_django_groups(group: Group):
        if not group.django_group:
            group.django_group = [DjangoGroup.objects.get_or_create(name=str(group))]
            group.save()
        return group.django_group

    @staticmethod
    @context_free
    def _django_group_to_ri(django_group: DjangoGroup):
        # TODO: a more robust mapping
        group = Group.where(name={"en": {"value": django_group.name, "direction": "ltr"}})
        if not group:
            group = Group.create()
            basic_info = group.basic_info.append()
            basic_info.name = django_group.name
            group.save()
        else:
            group = group[0]
        return group

    @context_free
    def update_groups_for_user(self, user):
        groups = {self._subj_to_str(group) for group in user.groups.all()}
        user = self._subj_to_str(user)
        was = set(role for role in self._enforcer.get_roles_for_user(user) if role.startswith("dg:"))
        for group in groups - was:
            self._enforcer.add_role_for_user(user, group)
        for group in was - groups:
            self._enforcer.delete_role_for_user(user, group)
        self._enforcer.save_policy()

    @context_free
    def assign_perm(self, perm, user_or_group, obj=None):
        try:
            next(obj)
        except:
            obj = [obj]

        if not user_or_group:
            return
        if isinstance(user_or_group, DjangoGroup):
            group = user_or_group
        elif isinstance(user_or_group, Group):
            group = CasbinPermissionFramework._ri_to_django_group(user_or_group)
        elif isinstance(user_or_group, User):
            # Arches will always do this for a normal web save.
            logger.warning(f"Not currently possible to assign permissions except to groups in this framework, not {user_or_group}")
            return
        else:
            raise RuntimeError(f"Not currently possible to assign permissions except to groups in this framework, not {user_or_group}")

        if not group:
            raise RuntimeError("Must have a group to assign permissions to")

        return assign_perm(perm, user_or_group, obj=obj)

    @staticmethod
    @context_free
    def get_permission_backend():
        return CasbinBackend()

    @context_free
    def remove_perm(self, perm, user_or_group=None, obj=None):
        obj = self._obj_to_str(obj)
        subj = self._subj_to_str(user_or_group)

        self._enforcer.remove_policy(subj, obj, perm)
        self._enforcer.save_policy()

    # This is slow and should be avoided where possible.
    @context_free
    def get_perms(self, user_or_group, obj):
        perms = set()
        for sub, tobj, act in self._get_perms(user_or_group, obj):
            perms |= set(REMAPPINGS.get(act, act))
        return perms

    @context_free
    def get_group_perms(self, user_or_group, obj):
        # FIXME: what should this do if a group is passed?
        perms = set()
        for sub, tobj, act in self._get_perms(user_or_group, obj):
            if sub != f"u:{user_or_group.pk}":
                perms |= set(REMAPPINGS.get(act, act))
        return perms

    @context_free
    def get_user_perms(self, user, obj):
        perms = set()
        for sub, tobj, act in self._get_perms(user, obj):
            if sub == f"u:{user.pk}":
                perms |= set(REMAPPINGS.get(act, act))
        return perms

    def _get_perms(self, user_or_group, obj):
        if obj is not None:
            if isinstance(obj, ResourceInstance):
                if isinstance(user_or_group, User) and user_or_group.id and obj.principaluser_id and int(user_or_group.id) == int(obj.principaluser_id):
                    return {
                        resource_perm for perm, resource_perm in REV_GRAPH_REMAPPINGS.items()
                        if self.user_has_resource_model_permissions(
                            user_or_group,
                            [perm],
                            obj
                        )
                    }

            obj = self._obj_to_str(obj)

        user_or_group = self._subj_to_str(user_or_group)
        permissions = self._enforcer.get_implicit_permissions_for_user(user_or_group)

        perms = {
            (sub, tobj, act)
            for sub, tobj, act in
            permissions
            if (obj is None or tobj == obj)
        }

        return perms

    @context_free
    def process_new_user(self, instance, created):
        ct = ContentType.objects.get(app_label="models", model="resourceinstance")
        resourceInstanceIds = list(GroupObjectPermission.objects.filter(content_type=ct).values_list("object_pk", flat=True).distinct())
        for resourceInstanceId in resourceInstanceIds:
            resourceInstanceId = uuid.UUID(resourceInstanceId)
        resources = ResourceInstance.objects.filter(pk__in=resourceInstanceIds)
        # self.assign_perm("no_access_to_resourceinstance", instance, resources)
        for resource_instance in resources:
            resource = Resource(resource_instance.resourceinstanceid)
            resource.graph_id = resource_instance.graph_id
            resource.createdtime = resource_instance.createdtime
            resource.index()

    @context_free
    def get_map_layers_by_perm(self, user, perms, any_perm=True, not_perms=None):
        """
        returns a list of node groups that a user has the given permission on

        Arguments:
        user -- the user to check
        perms -- the permssion string eg: "read_map_layer" or list of strings
        any_perm -- True to check ANY perm in "perms" or False to check ALL perms

        """

        if not isinstance(perms, list):
                perms = [perms]

        formatted_perms = []
        # in some cases, `perms` can have a `model.` prefix
        for perm in perms:
            if len(perm.split(".")) > 1:
                formatted_perms.append(perm.split(".")[1])
            else:
                formatted_perms.append(perm)

        if user.is_superuser is True:
            return MapLayer.objects.all()
        else:
            permitted_map_layers = list()

            user_permissions = {}
            user = self._subj_to_str(user)
            for sub, obj, act in self._enforcer.get_implicit_permissions_for_user(user):
                if obj.startswith("ml:"):
                    ml = obj[3:]
                    user_permissions.setdefault(ml, set())
                    user_permissions[ml].add(act)

            for map_layer in MapLayer.objects.all():
                if map_layer.addtomap is True and map_layer.isoverlay is False:
                    permitted_map_layers.append(map_layer)
                else:  # if no explicit permissions, object is considered accessible by all with group permissions
                    explicit_map_layer_perms = user_permissions.get(self._obj_to_str(map_layer), set())
                    if not_perms and set(not_perms) & explicit_map_layer_perms:
                        continue
                    if len(explicit_map_layer_perms):
                        if any_perm:
                            if len(set(formatted_perms) & set(explicit_map_layer_perms)):
                                permitted_map_layers.append(map_layer)
                        else:
                            if set(formatted_perms) == set(explicit_map_layer_perms):
                                permitted_map_layers.append(map_layer)
                    elif map_layer.ispublic:
                        permitted_map_layers.append(map_layer)

            return permitted_map_layers

    @context_free
    def user_can_read_map_layers(self, user):
        map_layers_with_read_permission = self.get_map_layers_by_perm(user, ['models.read_maplayer'], not_perms={'no_access_to_maplayer'})

        return map_layers_with_read_permission


    @context_free
    def user_can_write_map_layers(self, user):
        map_layers_with_write_permission = self.get_map_layers_by_perm(user, ['models.write_maplayer'], not_perms={'no_access_to_maplayer'})

        return map_layers_with_write_permission

    @context_free
    def get_nodegroups_by_perm(self, user, perms, any_perm=True):
        """
        returns a list of node groups that a user has the given permission on

        Arguments:
        user -- the user to check
        perms -- the permssion string eg: "read_nodegroup" or list of strings
        any_perm -- True to check ANY perm in "perms" or False to check ALL perms

        """

        logger.debug(f"Fetching node group permissions: {user} {perms}")

        all_nodegroups = list(NodeGroup.objects.values_list("nodegroupid", flat=True))
        if user and user.is_superuser:
            return all_nodegroups
        if not isinstance(perms, list):
            perms = [perms]

        formatted_perms = []
        # in some cases, `perms` can have a `model.` prefix
        for perm in perms:
            if len(perm.split(".")) > 1:
                formatted_perms.append(perm.split(".")[1])
            else:
                formatted_perms.append(perm)

        permitted_nodegroups = set()
        targets = {}
        user = self._subj_to_str(user)
        for _, obj, act in self._enforcer.get_implicit_permissions_for_user(user):
            if obj.startswith("ng:"):
                ng = obj[3:]
                targets.setdefault(ng, set())
                targets[ng].add(act)

        for nodegroup, explicit_perms in targets.items():
            if len(explicit_perms):
                if any_perm:
                    if len(set(formatted_perms) & set(explicit_perms)):
                        permitted_nodegroups.add(nodegroup)
                else:
                    if set(formatted_perms) == set(explicit_perms):
                        permitted_nodegroups.add(nodegroup)
            else:  # if no explicit permissions, object is considered accessible by all with group permissions
                permitted_nodegroups.add(nodegroup)
        # If a nodegroup has no explicit permissions, not even appearing
        # in the Casbin matrix, we add it here.
        permitted_nodegroups |= set(all_nodegroups) - set(targets)

        return list(permitted_nodegroups)

    @context_free
    def check_resource_instance_permissions(self, user, resourceid, permission):
        """
        Checks if a user has permission to access a resource instance

        Arguments:
        user -- the user to check
        resourceid -- the id of the resource
        permission -- the permission codename (e.g. 'view_resourceinstance') for which to check

        """
        result = {}

        logger.debug(f"Checking resource instance permissions: {user} {resourceid}")

        try:
            resource = Resource(resourceinstanceid=resourceid)
            try:
                index = resource.get_index()
            except UnindexedError:
                se.es.indices.refresh(index="test_resources")
                index = resource.get_index()
            if (principal_users := index.get("_source", {}).get("permissions", {}).get("principal_user", [])):
                if len(principal_users) >= 1 and user and user.id in principal_users:
                    if permission == "view_resourceinstance" and self.user_has_resource_model_permissions(user, ["models.read_nodegroup"], resource):
                        result["permitted"] = True
                        return result
                    elif user.groups.filter(name__in=settings.RESOURCE_EDITOR_GROUPS).exists() or self.user_can_edit_model_nodegroups(
                        user, resource
                    ):
                        result["permitted"] = True
                        return result
            sets = [
                st.get("id") for st in index.get("_source", {}).get("sets", {})
            ]
            sets = [st.split(":") for st in sets if st and st and ":" in st]
            objs = [self._obj_to_str(resource)] + [":".join(("g2l" if st[0] == "l" else "g2", st[1])) for st in sets]

            user_permissions = set()
            group_permissions = set()
            subj = self._subj_to_str(user)
            obj_grps = list(objs)
            for obj in objs:
                obj_grps += self._enforcer.get_implicit_roles_for_user(obj)
            for sub, obj, act in self._enforcer.get_implicit_permissions_for_user(subj):
                act = REMAPPINGS.get(act, act)
                if obj in obj_grps:
                    if sub == f"u:{user.pk}":
                        permissions = user_permissions
                    else:
                        permissions = group_permissions
                    if isinstance(act, list):
                        permissions |= set(act)
                    else:
                        permissions.add(act)
            all_perms = user_permissions | group_permissions

            if len(all_perms) == 0:  # no permissions assigned. permission _not_ implied
                result["permitted"] = False
                return result
            else:
                if "no_access_to_resourceinstance" in user_permissions:  # user is restricted
                    result["permitted"] = False
                    return result
                elif permission in user_permissions:  # user is permitted
                    result["permitted"] = True
                    return result

                if "no_access_to_resourceinstance" in group_permissions:  # group is restricted - no user override
                    result["permitted"] = False
                    return result
                elif permission in group_permissions:  # group is permitted - no user override
                    result["permitted"] = True
                    return result

                if permission not in all_perms:  # neither user nor group explicitly permits or restricts.
                    result["permitted"] = False  # restriction implied
                    return result

        except ObjectDoesNotExist:
            return None

        return result

    @context_free
    def get_users_with_perms(self, obj, attach_perms=False, with_superusers=False, with_group_users=True, only_with_perms_in=None):
        if with_superusers or (not with_group_users) or only_with_perms_in:
            raise NotImplementedError()
        users = self._get_with_perms("u", obj, attach_perms)

        logger.debug(f"Users with perms: {obj}")

        return User.objects.filter(pk__in=users)

    def _get_with_perms(self, subj_prefix, obj, attach_perms=False):
        obj = self._obj_to_str(obj)

        logger.debug(f"Getting with perms: {obj}")

        # Casbin does not distinguish between users and groups
        users = [
            (subj[2:], act)
            for subj, obj, act in
            self._enforcer.get_implicit_users_for_resource(obj)
            if subj.startswith(f"{subj_prefix}:")
        ]
        if attach_perms:
            users_with_perms = {}
            for user, perm in users:
                users_with_perms.setdefault(user, set())
                perm = REMAPPINGS.get(perm, perm)
                users_with_perms[user].add(perm)
        else:
            return users

    @context_free
    def get_groups_with_perms(self, obj, attach_perms=False):
        # FIXME: this may not work - it might need roles
        groups = self._get_with_perms("g", obj, attach_perms)
        return DjangoGroup.objects.filter(pk__in=groups)

    @context_free
    def get_restricted_users(self, resource):
        """
        Takes a resource instance and identifies which users are explicitly restricted from
        reading, editing, deleting, or accessing it.

        """

        logger.debug(f"Getting restricted users: {resource}")

        user_and_group_perms = get_users_with_perms(resource, attach_perms=True, with_group_users=True)

        result = {
            "no_access": [],
            "cannot_read": [],
            "cannot_write": [],
            "cannot_delete": [],
        }

        for user, perms in user_and_group_perms.items():
            if user.is_superuser:
                pass
            else:
                if "view_resourceinstance" not in perms:
                    result["cannot_read"].append(user.id)
                if "change_resourceinstance" not in perms:
                    result["cannot_write"].append(user.id)
                if "delete_resourceinstance" not in perms:
                    result["cannot_delete"].append(user.id)
                if "no_access_to_resourceinstance" in perms:
                    result["no_access"].append(user.id)

        return result

    @context_free
    def get_sets_for_user(self, user, perm):
        # TODO: add possibility of a default anonymous set(s) from settings
        if not user:
            return set()
        if user.is_superuser is True:
            return None

        sets = set()
        subj = self._subj_to_str(user)

        # FIXME: Right now, this does not address nested sets...
        for _, obj, act in self._enforcer.get_implicit_permissions_for_user(subj):
            act = REMAPPINGS.get(act, act)
            if (isinstance(act, list) and perm in act) or act == perm:
                sets.add(obj)

        # TODO: tidy up prefixing - we may not want to harmonize as the "g" is
        # specific to Casbin, but at least make the mapping less ad-hoc.
        sets = [st.split(":") for st in sets]
        return {
            ":".join(("l" if st[0] == "g2l" else "r", st[1])) for st in sets
        }

    @context_free
    def get_groups_for_object(self, perm, obj):
        raise NotImplementedError()


    @context_free
    def get_users_for_object(self, perm, obj):
        raise NotImplementedError()


    @context_free
    def get_restricted_instances(self, user, search_engine=None, allresources=False):
        logger.debug(f"Getting restricted instances: {user}")

        if allresources is False and user.is_superuser is True:
            return []

        # We assume all instances are (or can be) restricted instances
        query = Query(search_engine, start=0, limit=settings.SEARCH_RESULT_LIMIT)
        results = query.search(index=RESOURCES_INDEX, scroll="1m")
        scroll_id = results["_scroll_id"]
        total = results["hits"]["total"]["value"]
        if total > settings.SEARCH_RESULT_LIMIT:
            pages = total // settings.SEARCH_RESULT_LIMIT
            for page in range(pages):
                results_scrolled = query.se.es.scroll(scroll_id=scroll_id, scroll="1m")
                results["hits"]["hits"] += results_scrolled["hits"]["hits"]
        restricted_ids = [res["_id"] for res in results["hits"]["hits"]]
        return restricted_ids

    @context_free
    def user_has_resource_model_permissions(self, user, perms, resource=None, graph_id=None):
        """
        Checks if a user has any explicit permissions to a model's nodegroups

        Arguments:
        user -- the user to check
        perms -- the permssion string eg: "read_nodegroup" or list of strings
        resource -- a resource instance to check if a user has permissions to that resource's type specifically
        graph_id -- a graph id to check if a user has permissions to that graph's type specifically

        """

        # Only considers groups a user is assigned to.
        if user.is_superuser:
            return True

        if resource:
            graph_id = resource.graph_id

        groups = self._enforcer.get_implicit_users_for_resource(f"gp:{graph_id}")
        group_ids = {
            group[3:] for group, _, act in groups
            if group.startswith("dg:") and
            (not perms or act in perms)
        }
        return bool(group_ids & {str(group.pk) for group in user.groups.all()})


    @context_free
    def user_can_read_resource(self, user, resourceid=None):
        """
        Requires that a user be able to read an instance and read a single nodegroup of a resource

        """
        if user.is_authenticated:
            if user.is_superuser:
                return True
            if resourceid not in [None, ""]:
                result = self.check_resource_instance_permissions(user, resourceid, "view_resourceinstance")
                if result is not None:
                    if result["permitted"] == "unknown":
                        return self.user_has_resource_model_permissions(user, ["models.read_nodegroup"], result["resource"])
                    else:
                        return result["permitted"]
                else:
                    return None

            return len(self.get_resource_types_by_perm(user, ["models.read_nodegroup"])) > 0
        return False

    @context_free
    def get_resource_types_by_perm(self, user, perms):
        all_graphs = [
            str(graph_id) for graph_id in
            Graph.objects.filter(isresource=True).exclude(pk=SystemSettings.SYSTEM_SETTINGS_RESOURCE_MODEL_ID).values_list("graphid", flat=True)
        ]
        if user.is_superuser:
            return all_graphs
        # Only considers groups a user is assigned to.
        allowed = set()
        subj = self._subj_to_str(user)
        graphs = self._enforcer.get_implicit_permissions_for_user(subj)
        permissioned_graphs = set()
        for _, graph, act in graphs:
            if not graph.startswith("gp:"):
                continue
            permissioned_graphs.add(graph[3:])
            if not perms or act in perms:
                allowed.add(graph[3:])
        allowed |= set(all_graphs) - set(permissioned_graphs)
        return list(allowed)

    @context_free
    def user_can_edit_resource(self, user, resourceid=None):
        """
        Requires that a user be able to edit an instance and delete a single nodegroup of a resource

        """
        if user.is_authenticated:
            if user.is_superuser:
                return True
            if resourceid not in [None, ""]:
                result = self.check_resource_instance_permissions(user, resourceid, "change_resourceinstance")
                if result is not None:
                    if result["permitted"] == "unknown":
                        return user.groups.filter(name__in=settings.RESOURCE_EDITOR_GROUPS).exists() or self.user_can_edit_model_nodegroups(
                            user, result["resource"]
                        )
                    else:
                        return result["permitted"]
                else:
                    return None

            return user.groups.filter(name__in=settings.RESOURCE_EDITOR_GROUPS).exists() or len(self.get_editable_resource_types(user)) > 0
        return False


    @context_free
    def user_can_delete_resource(self, user, resourceid=None):
        """
        Requires that a user be permitted to delete an instance

        """
        if user.is_authenticated:
            if user.is_superuser:
                return True
            if resourceid not in [None, ""]:
                result = self.check_resource_instance_permissions(user, resourceid, "delete_resourceinstance")
                if result is not None:
                    if result["permitted"] == "unknown":
                        nodegroups = self.get_nodegroups_by_perm(user, "models.delete_nodegroup")
                        tiles = TileModel.objects.filter(resourceinstance_id=resourceid)
                        protected_tiles = {str(tile.nodegroup_id) for tile in tiles} - {str(nodegroup.nodegroupid) for nodegroup in nodegroups}
                        if len(protected_tiles) > 0:
                            return False
                        return user.groups.filter(name__in=settings.RESOURCE_EDITOR_GROUPS).exists() or self.user_can_delete_model_nodegroups(
                            user, result["resource"]
                        )
                    else:
                        return result["permitted"]
                else:
                    return None
        return False


    @context_free
    def user_can_read_concepts(self, user):
        """
        Requires that a user is a part of the RDM Administrator group

        """

        if user.is_authenticated:
            return self.user_in_group_by_name(user, ["RDM Administrator"])
        return False


    @context_free
    def user_is_resource_editor(self, user):
        """
        Single test for whether a user is in the Resource Editor group
        """

        is_resource_editor = self.user_in_group_by_name(user, ["Resource Editor"])
        return is_resource_editor


    @context_free
    def user_is_resource_reviewer(self, user):
        """
        Single test for whether a user is in the Resource Reviewer group
        """

        return self.user_in_group_by_name(user, ["Resource Reviewer"])


    @context_free
    def user_is_resource_exporter(self, user):
        """
        Single test for whether a user is in the Resource Exporter group
        """

        return self.user_in_group_by_name(user, ["Resource Exporter"])

    @context_free
    def user_in_group_by_name(self, user, names):
        subj = self._subj_to_str(user)
        roles = self._enforcer.get_roles_for_user(subj)
        return any(f"dgn:{name}" in roles for name in names)

from contextlib import contextmanager
from uuid import uuid4

_PROCESS_KEY = str(uuid4())

import time
import threading

class CasbinTrigger:
    wait_time = int(os.getenv("CASBIN_DEBOUNCE_SECONDS", 5))
    _timer = None

    @staticmethod
    @contextmanager
    @context_free
    def connect():
        credentials = pika.PlainCredentials(
            settings.RABBITMQ_USER,
            settings.RABBITMQ_PASS
        )
        parameters = pika.ConnectionParameters(
            host=settings.RABBITMQ_HOST,
            credentials=credentials,
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        channel.exchange_declare(exchange=settings.CASBIN_RELOAD_QUEUE, exchange_type="fanout")
        channel.queue_declare(queue=_PROCESS_KEY, durable=False)
        channel.queue_bind(exchange=settings.CASBIN_RELOAD_QUEUE, queue=_PROCESS_KEY, routing_key=settings.CASBIN_RELOAD_QUEUE)
        channel.basic_qos(prefetch_count=1)
        try:
            yield channel
        finally:
            connection.close()

    @context_free
    def listen(self):
        from arches.app.utils.permission_backend import _get_permission_framework
        casbin_framework = _get_permission_framework()

        self._timer

        def _reload_real():
            self._timer = None
            print("Policy loading")
            casbin_framework._enforcer.load_policy()
            print("Policy loaded")

        def _reload(channel, method, properties, body):
            try:
                if body:
                    body = json.loads(body)

                # Helps avoid unnecessary reloading in the producer.
                if not body or body.get("processKey", True) != str(_PROCESS_KEY):
                    if self._timer is not None:
                        print("CASBIN-TRIGGER: debounce")
                        self._timer.cancel()
                    else:
                        print("CASBIN-TRIGGER: setting up")
                    self._timer = threading.Timer(
                        self.wait_time,
                        _reload_real
                    )
                    self._timer.start()
                    print("CASBIN-TRIGGER: resetting in", self.wait_time)
                else:
                    print("CASBIN-TRIGGER: ignoring reload request")

                channel.basic_ack(delivery_tag=method.delivery_tag)
            except:
                logger.exception("Casbin listener exception")

        with self.connect() as channel:
            print("Consuming")
            channel.basic_consume(
                queue=_PROCESS_KEY,
                on_message_callback=_reload,
            )
            channel.start_consuming()
            print("Exiting Casbin listener")

    @context_free
    def request_reload(self):
        timestamp = time.time()
        with self.connect() as channel:
            channel.basic_publish(
                exchange=settings.CASBIN_RELOAD_QUEUE,
                routing_key=settings.CASBIN_RELOAD_QUEUE,
                body=json.dumps({"processKey": str(_PROCESS_KEY)}),
                properties=pika.BasicProperties(
                    delivery_mode=pika.DeliveryMode.Transient,
                    timestamp=int(timestamp),
                    expiration="1000",
                )
            )

trigger = CasbinTrigger()
