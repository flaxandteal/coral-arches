# This derived from work by Flax & Teal:
# AGPL TC Hub - University of Edinburgh (Topaz project)

import logging
import uuid
from django.db.models.signals import post_save
from math import perm
from django.utils.translation import get_language, ugettext as _
from django.contrib.auth.models import User, Group
from django.dispatch import receiver
from guardian.shortcuts import assign_perm, remove_perm, get_user_perms, get_group_perms
from arches.app.utils.betterJSONSerializer import JSONDeserializer
from arches.app.utils.response import JSONResponse, JSONErrorResponse
from arches.app.utils.permission_backend import get_groups_for_object, user_can_read_resource
import arches.app.utils.permission_backend
from arches.app.models.resource import Resource
from arches.app.models.models import ResourceInstance, create_permissions_for_new_users
from django.contrib.contenttypes.models import ContentType
from guardian.models import GroupObjectPermission, UserObjectPermission
from arches.templatetags.template_tags import register
from arches.app.utils import index_database
from coral.resource_model_wrappers import Person

import arches.app.views.search
from coral import settings

logger = logging.getLogger(__name__)

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

                # This should correspond to the exact case we wish to flip.
                if permission in group_permissions and len(group_permissions) > 1:
                    result["permitted"] = True

    return result
#arches.app.utils.permission_backend.check_resource_instance_permissions = _strict_check_resource_instance_permissions

_nonchecking_search_results = arches.app.views.search.search_results
def _checking_search_results(request, returnDsl=False):
    # Currently not handling errors
    ret = _nonchecking_search_results(request, returnDsl)
    try:
        ret = JSONDeserializer().deserialize(ret.content)
        ret["results"]["hits"]["hits"] = [
            result
            for result in ret["results"]["hits"]["hits"]
            if user_can_read_resource(request.user, result["_id"])
        ]
        #result = _relaxed_check_resource_instance_permissions(user, resourceid, permission)
        return JSONResponse(ret)
    except Exception as e:
        logger.traceback(e)
        ret  = {"message": _("There was an error retrieving the search results")}
        return JSONErrorResponse(ret, status=500)
arches.app.views.search.search_results = _checking_search_results
