import logging
import uuid
from django.db.models.signals import post_save
from math import perm
from django.contrib.auth.models import User, Group
from django.dispatch import receiver
from guardian.shortcuts import assign_perm, remove_perm, get_user_perms, get_group_perms
from arches.app.utils.permission_backend import get_groups_for_object
import arches.app.utils.permission_backend
from arches.app.models.resource import Resource
from arches.app.models.models import ResourceInstance, create_permissions_for_new_users
from django.contrib.contenttypes.models import ContentType
from guardian.models import GroupObjectPermission, UserObjectPermission
from afs.resource_model_wrappers import Project, DigitalResources
from arches.templatetags.template_tags import register
from arches.app.utils import index_database
from afs import settings

_relaxed_check_resource_instance_permissions = arches.app.utils.permission_backend.check_resource_instance_permissions
def _strict_check_resource_instance_permissions(user, resourceid, permission):
    result = _relaxed_check_resource_instance_permissions(user, resourceid, permission)

    if result and result.get("permitted", None) is not None:
        # This is a safety check - we don't want an unpermissioned user
        # defaulting to having access (allowing anonymous users is still
        # possible by assigning appropriate group permissions).
        if result["permitted"] == "unknown":
            result["permitted"] = False
        elif result["permitted"] == False:

            # This covers the case where one group denies permission and another
            # allows it. Ideally, the deny would override (as normal in Arches) but
            # this prevents us from having a default deny rule that another group
            # can override (as deny rules in Arches must be explicit for a resource).
            resource = ResourceInstance.objects.get(resourceinstanceid=resourceid)
            user_permissions = get_user_perms(user, resource)
            if "no_access_to_resourceinstance" not in user_permissions:
                group_permissions = get_group_perms(user, resource)
                perms = ["view_resourceinstance", "change_resourceinstance", "delete_resourceinstance"]

                # This should correspond to the exact case we wish to flip.
                if permission in group_permissions and len(group_permissions) > 1:
                    result["permitted"] = True

    return result
arches.app.utils.permission_backend.check_resource_instance_permissions = _strict_check_resource_instance_permissions
post_save.disconnect(create_permissions_for_new_users, sender=User)

@receiver(post_save, sender=User)
def topaz_create_permissions_for_new_users(sender, instance, created, **kwargs):
    if created:
        # This duplicates the user sign-up view, but we want to be user any new user
        # gets restrictions applied (unfortunately, Arches requires active red-listing,
        # rather than deny-by-default, as Elasticsearch indices hold a list of _prohibited_
        # users.
        crowdsource_editor_group = Group.objects.get(name=settings.USER_SIGNUP_GROUP)
        instance.groups.add(crowdsource_editor_group)
        index_database.index_db()

@register.filter(name="has_any_project")
def has_any_project(user):
    return len([group for group in user.groups.all() if "-Project-" in group.name]) > 0

def project_related_model(sender, instance=None, tile=None, **kwargs):
    if not tile or not instance:
        return

    perms = ["view_resourceinstance", "change_resourceinstance", "delete_resourceinstance"]
    groups = sum([get_groups_for_object(perm, instance.resource) for perm in perms],[])

    # Without additional groups, users should not reach these resource instances
    guest = Group.objects.get(name="Guest")
    crowdsource_editor = Group.objects.get(name="Crowdsource Editor")
    resource_editor = Group.objects.get(name="Resource Editor")
    for group in (guest, crowdsource_editor, resource_editor):
        assign_perm("no_access_to_resourceinstance", group, instance.resource)

    prefixes = ["readOnly","readAndWrite"]
    project_groups_existing = {
        group.name: group
        for group in groups
        for prefix in prefixes
        if group.name.startswith(prefix)
    }

    try:
        if isinstance(instance, Project):
            projects = [instance]
        else:
            projects = instance.related_project
            logging.warning([instance, instance.related_project])
    except KeyError:
        return

    if not projects:
        projects = []

    # TODO: cascade project association if necessary
    # (may not be)
    # if isinstance(instance, DigitalResources):
    #     logging.warn(instance.describe())

    project_groups_needed = {
        f"{prefix}-Project-{project.id}"
        for project in projects
        for prefix in prefixes
    }

    for group in set(project_groups_existing) - project_groups_needed:
        for perm in perms:
            remove_perm(perm, project_groups_existing[group], instance.resource)
    for group in project_groups_needed - set(project_groups_existing):
        gr, created = Group.objects.get_or_create(name=group)
        if gr.name.startswith(prefixes[0]):
            assign_perm(perms[0], gr, instance.resource)
        elif gr.name.startswith(prefixes[1]):
            for perm in perms:
                assign_perm(perm, gr, instance.resource)
        else:
            raise NotImplementedError("Unknown permissions")

def hook_all_project_related_models():
    from afs.resource_model_wrappers import (
        SpatialDescription,
        Modification,
        Observation,
        Environment,
        TextualWork,
        Person,
        DigitalResourceGroup,
        CollectionorSet,
        DigitalResources,
        Project,
        Group
    )

    for model in locals().values():
        model.post_save.connect(project_related_model)

hook_all_project_related_models()
