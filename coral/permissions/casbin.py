import logging
from arches.app.views.search import build_search
from dauthz.backends.casbin_backend import CasbinBackend
# https://github.com/casbin/pycasbin/issues/323
logging.disable(logging.NOTSET)
logging.getLogger("casbin_adapter").setLevel(logging.ERROR)

from django.core.exceptions import ObjectDoesNotExist
from arches.app.models.system_settings import settings
from django.contrib.auth.models import User, Permission, Group as DjangoGroup
import logging
from guardian.shortcuts import (
    get_users_with_perms,
)
from arches.app.models.resource import Resource
from urllib.parse import parse_qs

from guardian.models import GroupObjectPermission

from arches.app.models.models import *
from arches.app.models.models import ResourceInstance, MapLayer
from arches.app.models.resource import Resource
from arches.app.search.elasticsearch_dsl_builder import Query
from arches.app.search.mappings import RESOURCES_INDEX
from arches.app.utils.permission_backend import PermissionFramework, NotUserNorGroup as ArchesNotUserNorGroup

from arches_orm.models import Person, Organization, Set, LogicalSet, Group
from arches_orm.wrapper import ResourceWrapper

logger = logging.getLogger(__name__)
REMAPPINGS = {
    "809598ac-6dc5-498e-a7af-52b1381942a4": ["change_resourceinstance"],
    "33a0218b-b1cc-42d8-9a79-31a6b2147893": ["delete_resourceinstance"],
    "70415d03-b11b-48a6-b989-933d788ffc88": ["view_resourceinstance"],
    "45d54859-bf3c-48f2-a387-55a0050ff572": ["execute_resourceinstance"],
}


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
            if not subj.user_account:
                raise NoSubjectError(subj)
            subj = f"u:{subj.user_account.pk}"
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
        elif isinstance(obj, LogicalSet):
            obj = f"g2l:{obj.id}"
        elif isinstance(obj, ResourceWrapper):
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

        sets = []

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
                    logger.warn("A membership rule was not added as no User was attached %s", member.id)
            for permission in group.permissions:
                for act in permission.action:
                    for obj in permission.object:
                        obj_key = self._obj_to_str(obj)
                        if obj_key.startswith("g2"):
                            sets.append(obj_key)
                        self._enforcer.add_policy(group_key, obj_key, str(act.conceptid))

        _fill_group(root_group)

        def _fill_set(st):
            set_key = self._obj_to_str(st)
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

    def update_permissions_for_user(self, user):
        perms = {(self._obj_to_str(permission), permission.codename) for permission in user.user_permissions.all()}
        user = self._subj_to_str(user)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(user)}
        for obj, act in perms - was:
            self._enforcer.add_policy(user, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(user, obj, act)
        self._enforcer.save_policy()

    def update_permissions_for_group(self, group):
        perms = {(self._obj_to_str(permission), permission.codename) for permission in group.permissions.all()}
        group = self._subj_to_str(group)
        was = {(obj, act) for _, obj, act in self._enforcer.get_permissions_for_user(group)}
        for obj, act in perms - was:
            self._enforcer.add_policy(group, obj, act)
        for obj, act in was - perms:
            self._enforcer.remove_policy(group, obj, act)
        self._enforcer.save_policy()

    def _django_group_to_ri(self, django_group: DjangoGroup):
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

    def update_groups_for_user(self, user):
        groups = {self._subj_to_str(self._django_group_to_ri(group)) for group in user.groups.all()}
        user = self._subj_to_str(user)
        was = set(self._enforcer.get_roles_for_user(user))
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

        # FIXME: This is inefficient but may avoid some initial caching errors
        self.recalculate_table()

        try:
            resource = Resource(resourceinstanceid=resourceid)
            result["resource"] = resource
            index = resource.get_index()
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

    def get_sets_for_user(self, user, perm):
        # TODO: add possibility of a default anonymous set(s) from settings
        if not user:
            return set()
        if user.is_superuser is True:
            return None

        self.recalculate_table()
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
            ":".join(("l" if st[0] == "g2l" else "s", st[1])) for st in sets
        }

    def get_groups_for_object(self, perm, obj):
        raise NotImplementedError()


    def get_users_for_object(self, perm, obj):
        raise NotImplementedError()


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
