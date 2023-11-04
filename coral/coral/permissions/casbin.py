import logging
from dauthz.backends.casbin_backend import CasbinBackend
# https://github.com/casbin/pycasbin/issues/323
logging.disable(logging.NOTSET)
logging.getLogger("casbin_adapter").setLevel(logging.ERROR)

from django.core.exceptions import ObjectDoesNotExist
from arches.app.models.system_settings import settings
from django.contrib.auth.models import User, Permission, Group as DjangoGroup
from django.contrib.gis.db.models import Model
from django.core.cache import caches
from guardian.backends import check_support, ObjectPermissionBackend
from guardian.core import ObjectPermissionChecker
import logging
from guardian.shortcuts import (
    get_perms,
    get_group_perms,
    get_user_perms,
    get_users_with_perms,
    get_groups_with_perms,
    get_perms_for_model,
)
from guardian.exceptions import NotUserNorGroup
from arches.app.models.resource import Resource

from guardian.models import GroupObjectPermission, UserObjectPermission
from guardian.exceptions import WrongAppError
from guardian.shortcuts import assign_perm, get_perms, remove_perm, get_group_perms, get_user_perms

import inspect
from arches.app.models.models import *
from arches.app.models.models import ResourceInstance, MapLayer
from arches.app.search.elasticsearch_dsl_builder import Bool, Query, Terms, Nested
from arches.app.search.mappings import RESOURCES_INDEX
from arches.app.utils.permission_backend import PermissionFramework, NotUserNorGroup as ArchesNotUserNorGroup

from coral.resource_model_wrappers import Person, Organization, Set, Group, ResourceModelWrapper

logger = logging.getLogger(__name__)


class NoSubjectError(RuntimeError):
    pass

class CasbinPermissionFramework(PermissionFramework):
    @property
    def _enforcer(self):
        from dauthz.core import enforcer
        return enforcer

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
        if isinstance(subj, Person):
            if subj.user_account is None:
                raise NoSubjectError(subj)
            subj = f"u:{subj.user_account.user.pk}"
        if isinstance(subj, User):
            subj = f"u:{subj.pk}"
        elif isinstance(subj, Organization):
            subj = f"u:{subj.id}"
        elif isinstance(subj, Group):
            subj = f"g:{subj.id}"
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
        elif isinstance(obj, ResourceModelWrapper):
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

    def recalculate_table(self):
        groups = settings.GROUPINGS["groups"]
        root_group = Group.find(groups["root_group"])
        self._enforcer.clear_policy()

        def _fill_group(group):
            group_key = self._subj_to_str(group)
            for member in group.members:
                if isinstance(member, Group):
                    member_key = self._subj_to_str(member)
                    self._enforcer.add_named_grouping_policy("g", member_key, group_key)
                    _fill_group(member)
                elif member.user_account:
                    member_key = self._subj_to_str(member)
                    self._enforcer.add_role_for_user(member_key, group_key)
                else:
                    logger.warn("A membership rule was not added as no User was attached %s", member.full_name)
            for permission in group.permissions:
                for act in permission["action"]:
                    for obj in permission["object"]:
                        obj_key = self._obj_to_str(obj)
                        self._enforcer.add_policy(group_key, obj_key, act)
        _fill_group(root_group)

        sets = settings.GROUPINGS["sets"]
        root_set = Set.find(sets["root_group"])

        def _fill_set(st):
            set_key = self._obj_to_str(st)
            if st.nested_sets:
                for nst in st.nested_sets:
                    nested_set_key = self._obj_to_str(nst)
                    self._enforcer.add_named_grouping_policy("g2", nested_set_key, set_key)
                    _fill_set(nst)
            if st.members:
                for member in st.members:
                    member_key = self._obj_to_str(member)
                    self._enforcer.add_named_grouping_policy("g2", member_key, set_key)
        _fill_set(root_set)
        self._enforcer.save_policy()

    def update_permissions_for_user(self, user):
        perms = {(self._obj_to_str(permission), permission.codename) for permission in user.user_permissions.all()}
        user = self._subj_to_str(user)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(user)}
        logger.error(was)
        logger.error(perms)
        for obj, act in perms - was:
            self._enforcer.add_policy(user, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(user, obj, act)
        self._enforcer.save_policy()

    def update_permissions_for_group(self, group):
        logger.error("p4g")
        perms = {(self._obj_to_str(permission), permission.codename) for permission in group.permissions.all()}
        group = self._subj_to_str(group)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(group)}
        logger.error(was)
        logger.error(perms)
        for obj, act in perms - was:
            self._enforcer.add_policy(group, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(group, obj, act)
        self._enforcer.save_policy()

    def _django_group_to_ri(self, django_group: DjangoGroup):
        # TODO: a more robust mapping
        group = Group.where(name==django_group.name)
        return group

    def update_groups_for_user(self, user):
        groups = {self._subj_to_str(self._django_group_to_ri(group)) for group in user.groups.all()}
        user = self._subj_to_str(user)
        was = set(self._enforcer.get_roles_for_user(user))
        logger.error(was)
        logger.error(groups)
        for group in groups - was:
            self._enforcer.add_role_for_user(user, group)
        for group in was - groups:
            self._enforcer.delete_role_for_user(user, group)
        self._enforcer.save_policy()

    def assign_perm(self, perm, user_or_group, obj=None):
        try:
            next(obj)
        except:
            obj = [obj]

        subj = self._subj_to_str(user_or_group)
        for o in obj:
            o = self._obj_to_str(o)

            logger.debug(f"Assigning permission: {o} {subj}")

            self._enforcer.add_policy(subj, o, perm)
        self._enforcer.save_policy()

    @staticmethod
    def get_permission_backend():
        return CasbinBackend()

    def remove_perm(self, perm, user_or_group=None, obj=None):
        obj = self._obj_to_str(obj)
        subj = self._subj_to_str(user_or_group)

        self._enforcer.remove_policy(subj, obj, perm)
        self._enforcer.save_policy()

    def get_perms(self, user_or_group, obj):
        return {
            act for sub, tobj, act in
            self._get_perms(user_or_group, obj)
        }

    def get_group_perms(self, user_or_group, obj):
        # FIXME: what should this do if a group is passed?
        return {
            act for sub, tobj, act in
            self._get_perms(user_or_group, obj)
            if sub != f"u:{user_or_group.pk}"
        }

    def get_user_perms(self, user, obj):
        return {
            act for sub, tobj, act in
            self._get_perms(user, obj)
            if sub == f"u:{user.pk}"
        }

    def _get_perms(self, user_or_group, obj):
        if obj is not None:
            obj = self._obj_to_str(obj)

        user_or_group = self._subj_to_str(user_or_group)
        permissions = self._enforcer.get_implicit_permissions_for_user(user_or_group)

        perms = {
            (sub, tobj, act)
            for sub, tobj, act in
            permissions
            if (obj is None or tobj == obj)
        }
        logger.error(str(perms))

        logger.debug(f"Fetching permissions: {obj} {perms}")

        return perms

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

    def get_map_layers_by_perm(self, user, perms, any_perm=True):
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

    def user_can_read_map_layers(self, user):
        map_layers_with_read_permission = self.get_map_layers_by_perm(user, ['models.read_maplayer'])
        map_layers_allowed = []

        for map_layer in map_layers_with_read_permission:
            if ('no_access_to_maplayer' not in self.get_user_perms(user, map_layer)) or (map_layer.addtomap is False and map_layer.isoverlay is False):
                map_layers_allowed.append(map_layer)

        return map_layers_allowed


    def user_can_write_map_layers(self, user):
        map_layers_with_write_permission = self.get_map_layers_by_perm(user, ['models.write_maplayer'])
        map_layers_allowed = []

        for map_layer in map_layers_with_write_permission:
            if ('no_access_to_maplayer' not in self.get_user_perms(user, map_layer)) or (map_layer.addtomap is False and map_layer.isoverlay is False):
                map_layers_allowed.append(map_layer)

        return map_layers_allowed

    def get_nodegroups_by_perm(self, user, perms, any_perm=True):
        """
        returns a list of node groups that a user has the given permission on

        Arguments:
        user -- the user to check
        perms -- the permssion string eg: "read_nodegroup" or list of strings
        any_perm -- True to check ANY perm in "perms" or False to check ALL perms

        """

        logger.debug(f"Fetching node group permissions: {user} {perms}")

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
        for sub, obj, act in self._enforcer.get_implicit_permissions_for_user(user):
            if obj.startswith("ng:"):
                ng = obj[3:]
                targets.setdefault(ng, set())
                targets[ng].add(act)

        for nodegroup in NodeGroup.objects.all():
            explicit_perms = targets.get(str(nodegroup.pk), set())

            if len(explicit_perms):
                if any_perm:
                    if len(set(formatted_perms) & set(explicit_perms)):
                        permitted_nodegroups.add(nodegroup)
                else:
                    if set(formatted_perms) == set(explicit_perms):
                        permitted_nodegroups.add(nodegroup)
            else:  # if no explicit permissions, object is considered accessible by all with group permissions
                permitted_nodegroups.add(nodegroup)

        return permitted_nodegroups

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
            resource = ResourceInstance.objects.get(resourceinstanceid=resourceid)
            result["resource"] = resource

            user_permissions = set()
            group_permissions = set()
            subj = self._subj_to_str(user)
            print(subj, self._enforcer.get_implicit_roles_for_user(subj))
            for sub, obj, act in self._enforcer.get_implicit_permissions_for_user(subj):
                print(sub, obj, act)
                if obj == f"ri:{resourceid}":
                    if sub == f"u:{user.pk}":
                        user_perms.add(act)
                    else:
                        group_perms.add(act)
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

                group_permissions = self.get_group_perms(user, resource)
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
                users_with_perms[user].add(perm)
        else:
            return users

    def get_groups_with_perms(self, obj, attach_perms=False):
        # FIXME: this may not work - it might need roles
        groups = self._get_with_perms("g", obj, attach_perms)
        return Group.objects.filter(pk__in=groups)

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

    def get_groups_for_object(self, perm, obj):
        raise NotImplementedError()
        """
        returns a list of group objects that have the given permission on the given object

        Arguments:
        perm -- the permssion string eg: "read_nodegroup"
        obj -- the model instance to check

        """

        def has_group_perm(group, perm, obj):
            explicitly_defined_perms = self.get_perms(group, obj)
            if len(explicitly_defined_perms) > 0:
                if "no_access_to_nodegroup" in explicitly_defined_perms:
                    return False
                else:
                    return perm in explicitly_defined_perms
            else:
                default_perms = []
                for permission in group.permissions.all():
                    if perm in permission.codename:
                        return True
                return False

        ret = []
        for group in Group.objects.all():
            if has_group_perm(group, perm, obj):
                ret.append(group)
        return ret


    def get_users_for_object(self, perm, obj):
        raise NotImplementedError()
        """
        returns a list of user objects that have the given permission on the given object

        Arguments:
        perm -- the permssion string eg: "read_nodegroup"
        obj -- the model instance to check

        """

        ret = []
        for user in User.objects.all():
            if user.has_perm(perm, obj):
                ret.append(user)
        return ret


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
