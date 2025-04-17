import yaml
import logging
import datetime
from pathlib import Path
from celery import shared_task
from coral.utils.merge_resources import MergeResources
from arches.app.models import models
from coral.utils.remap_resources import RemapResources
from arches.app.models.tile import Tile
from arches.app.models.resource import Resource
from arches.app.models.graph import Graph
from django.db import transaction
from coral.utils.casbin import SetApplicator
from tempfile import NamedTemporaryFile

from arches.app.models.system_settings import settings
from arches.app.utils.arches_crypto import AESCipher
from arches.management.commands.packages import Command as PackageCommand

from coral.permissions.casbin import CasbinPermissionFramework

logging.basicConfig()


@shared_task
def recalculate_permissions_table():
    framework = CasbinPermissionFramework()
    enforcer = framework._enforcer

    set_applicator = SetApplicator(print_statistics=False, wait_for_completion=True)
    set_applicator.apply_sets()

    framework.recalculate_table()
    enforcer.model.print_policy()


@shared_task
def merge_resources_task(
    user_id,
    base_resource_id,
    merge_resource_id,
    merge_tracker_resource_id=None,
    overwrite_multiple_tiles=False,
):
    user = models.User.objects.get(pk=user_id)

    mr = MergeResources()
    mr.merge_resources(
        base_resource_id,
        merge_resource_id,
        merge_tracker_resource_id,
        overwrite_multiple_tiles,
    )
    deleted_tile = Tile.objects.filter(
                resourceinstance_id=merge_resource_id,
                nodegroup_id="98bd23cd-0923-4d5b-8c84-4269e92887d2",
            ).first()
    if not deleted_tile:
        deleted_tile = Tile.get_blank_tile_from_nodegroup_id(
                nodegroup_id="98bd23cd-0923-4d5b-8c84-4269e92887d2", resourceid=merge_resource_id
            )

    deleted_tile.data["98bd23cd-0923-4d5b-8c84-4269e92887d2"] = True
    deleted_tile.save()

@shared_task
def remap_monument_to_revision(user_id, target_resource_id):
    with transaction.atomic():
        MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
        REVISION_PARENT_MONUMENT_NODEGROUP_ID = "6375be6e-dc64-11ee-924e-0242ac120006"
        user = models.User.objects.get(pk=user_id)

        rr = RemapResources(
            target_graph_id=MONUMENT_GRAPH_ID,
            destination_graph_id=MONUMENT_REVISION_GRAPH_ID,
            excluded_aliases=["monument", "monument_revision"],
            target_resource_id=target_resource_id,
        )
        result = rr.remap_resources(user)

        if not result['remapped']:
            return
        
        REVISION_DISPLAY_NAME_NODEGROUP_ID = "423d8a10-3f60-11ef-b9b0-0242ac140006"
        REVISION_DISPLAY_NAME_NODE_ID = REVISION_DISPLAY_NAME_NODEGROUP_ID

        display_name_tile = Tile.objects.filter(
            resourceinstance_id=result['destinationResourceId'],
            nodegroup_id=REVISION_DISPLAY_NAME_NODEGROUP_ID,
        ).first()

        parent_target_nodegroup = models.NodeGroup.objects.filter(pk=REVISION_PARENT_MONUMENT_NODEGROUP_ID).first()
        destination_resource = Resource.objects.filter(pk=result['destinationResourceId']).first()
        parent_target_tile = Tile(
            resourceinstance=destination_resource,
            data={
                REVISION_PARENT_MONUMENT_NODEGROUP_ID: [
                    {
                        "resourceId": target_resource_id,
                        "ontologyProperty": "",
                        "inverseOntologyProperty": "",
                    }
                ]
            },
            nodegroup=parent_target_nodegroup,
        )
        parent_target_tile.save()

        notification = models.Notification(
            message="The Monument remap process has completed you can now begin making isolated changes to this resource.",
            context={
                "resource_instance_id": result['destinationResourceId'],
                "resource_id": f"REV: {display_name_tile.data.get(REVISION_DISPLAY_NAME_NODE_ID).get('en').get('value')}",
                "response_slug": "heritage-asset-designation-workflow"
            },
        )
        notification.save()

        user_x_notification = models.UserXNotification(
            notif=notification, recipient=user
        )
        user_x_notification.save()

        return result
        


@shared_task
def remap_and_merge_revision_task(user_id, target_resource_id):
    with transaction.atomic():
        MONUMENT_GRAPH_ID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
        MONUMENT_REVISION_GRAPH_ID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
        PARENT_MONUMENT_NODEGROUP = "6375be6e-dc64-11ee-924e-0242ac120006"
        PARENT_MONUMENT_NODE = PARENT_MONUMENT_NODEGROUP
        user = models.User.objects.get(pk=user_id)

        rr = RemapResources(
            target_graph_id=MONUMENT_REVISION_GRAPH_ID,
            destination_graph_id=MONUMENT_GRAPH_ID,
            excluded_aliases=["monument", "monument_revision", "parent_monument", "heritage_asset_references"],
            target_resource_id=target_resource_id,
        )
        result = rr.remap_resources(user)

        DISPLAY_NAME_NODEGROUP_ID = "ce85b994-3f5f-11ef-b9b0-0242ac140006"
        DISPLAY_NAME_NODE_ID = DISPLAY_NAME_NODEGROUP_ID

        display_name_tile = Tile.objects.filter(
            resourceinstance_id=result['destinationResourceId'],
            nodegroup_id=DISPLAY_NAME_NODEGROUP_ID,
        ).first()

        if result["remapped"]:
            notification = models.Notification(
                message=f"The Revision Heritage Asset has been remapped back to a Heritage Asset. The merge process has started and will complete shortly. Heritage Asset: {display_name_tile.data.get(DISPLAY_NAME_NODE_ID).get('en').get('value')}",
            )
            notification.save()

            user_x_notification = models.UserXNotification(
                notif=notification, recipient=user
            )
            user_x_notification.save()
            
            parent_monument_tile = Tile.objects.filter(
                resourceinstance_id=target_resource_id,
                nodegroup_id=PARENT_MONUMENT_NODEGROUP,
            ).first()
            monument_node = parent_monument_tile.data[PARENT_MONUMENT_NODE]
            monument_resource_id = monument_node[0].get("resourceId")

            merge_tracker_resource_id = setup_merge_resource_tracker(user)

            mr = MergeResources()
            mr.merge_resources(
                base_resource_id=monument_resource_id,
                merge_resource_id=result["destinationResourceId"],
                merge_tracker_resource_id=merge_tracker_resource_id,
                overwrite_multiple_tiles=True,
                exclude_nodegroups_from_overwrite_multiple_tiles=['7e0533aa-37b7-11ef-9263-0242ac150006']
            )
            mr.merge_resource.delete(user=user)

            print("DEBUG, should be soft deleting", )
            deleted_revision_tile = Tile.objects.filter(
                resourceinstance_id=target_resource_id,
                nodegroup_id="9e59e355-07f0-4b13-86c8-7aa12c04a5e3",
            ).first()
            if not deleted_revision_tile:
                deleted_revision_tile = Tile.get_blank_tile_from_nodegroup_id(
                        nodegroup_id="9e59e355-07f0-4b13-86c8-7aa12c04a5e3", resourceid=target_resource_id
                    )
            deleted_revision_tile.data["9e59e355-07f0-4b13-86c8-7aa12c04a5e3"] = True
            deleted_revision_tile.save()
            notification = models.Notification(
                message=f"The revision has completed. All changes made to the Revision Heritage Asset have been merged into the original Heritage Asset. You may begin using the Heritage Asset again. Heritage Asset: {display_name_tile.data.get(DISPLAY_NAME_NODE_ID).get('en').get('value')}",
            )
            notification.save()

            user_x_notification = models.UserXNotification(
                notif=notification, recipient=user
            )
            user_x_notification.save()

def get_resource(resource_id):
    resource = None
    try:
        resource = Resource.objects.filter(pk=resource_id).first()
    except Resource.DoesNotExist:
        raise f"Resource ID ({resource_id}) does not exist"
    return resource

def setup_merge_resource_tracker(user):
    def get_graph(graph_id):
        graph = None
        try:
            graph = Graph.objects.filter(pk=graph_id).first()
        except Graph.DoesNotExist:
            raise f"Graph ID ({graph_id}) does not exist"
        return graph

    def get_nodegroup(nodegroup_id):
        nodegroup = None
        try:
            nodegroup = models.NodeGroup.objects.filter(pk=nodegroup_id).first()
        except models.NodeGroup.DoesNotExist:
            raise f"Nodegroup ID ({nodegroup_id}) does not exist"
        return nodegroup

    def generate_random_id(prefix, nodegroup_id, node_id, resource):
        import random
        import string
        from datetime import datetime

        unique = False
        while not unique:
            current_year = datetime.now().year
            random_suffix = "".join(
                random.choice(string.ascii_letters + string.digits) for _ in range(6)
            )
            id_format = f"{prefix}/{current_year}/{random_suffix}"
            node_value_query = {
                f"data__{node_id}__en__value__icontains": id_format,
            }
            query_result = Tile.objects.filter(
                nodegroup_id=nodegroup_id,
                **node_value_query,
            ).exclude(resourceinstance_id=resource)
            if len(query_result):
                continue
            unique = True
        return id_format

    TRACKER_GRAPH_ID = "d9318eb6-f28d-427c-b061-6fe3021ce8aa"
    merge_resource_tracker_graph = get_graph(TRACKER_GRAPH_ID)
    merge_tracker_resource = Resource.objects.create(
        graph=merge_resource_tracker_graph, principaluser=user
    )

    TRACKER_SYSTEM_REF_NODEGROUP = "d31655e2-ccdf-11ee-9264-0242ac180006"
    TRACKER_SYSTEM_REF_NODE_VALUE = "d3168288-ccdf-11ee-9264-0242ac180006"
    merge_tracker_sys_ref = Tile(
        resourceinstance=merge_tracker_resource,
        data={
            TRACKER_SYSTEM_REF_NODE_VALUE: {
                "en": {
                    "value": generate_random_id(
                        "MRT",
                        TRACKER_SYSTEM_REF_NODEGROUP,
                        TRACKER_SYSTEM_REF_NODE_VALUE,
                        str(merge_tracker_resource.resourceinstanceid),
                    ),
                    "direction": "ltr",
                },
            }
        },
        nodegroup=get_nodegroup(TRACKER_SYSTEM_REF_NODEGROUP),
        sortorder=None,
    )
    merge_tracker_sys_ref.sortorder = 0
    merge_tracker_sys_ref.save()

    TRACKER_DESCRIPTION_NODEGROUP = "5dff7478-ccdf-11ee-af2a-0242ac180006"
    TRACKER_DESCRIPTION_NODE = "5dff7e8c-ccdf-11ee-af2a-0242ac180006"
    TRACKER_DESCRIPTION_TYPE_NODE = "5dff80e4-ccdf-11ee-af2a-0242ac180006"
    TRACKER_DESCRIPTION_TYPE_DEFAULT = "daa4cddc-8636-4842-b836-eb2e10aabe18"
    TRACKER_DESCRIPTION_METATYPE_NODE = "5dff8332-ccdf-11ee-af2a-0242ac180006"
    TRACKER_DESCRIPTION_METATYPE_DEFAULT = "6fbe3775-e51d-4f90-af53-5695dd204c9a"
    merge_tracker_sys_ref = Tile(
        resourceinstance=merge_tracker_resource,
        data={
            TRACKER_DESCRIPTION_NODE: {
                "en": {
                    "value": "Monument Revision changes have been merged into the original Monument.",
                    "direction": "ltr",
                }
            },
            TRACKER_DESCRIPTION_TYPE_NODE: TRACKER_DESCRIPTION_TYPE_DEFAULT,
            TRACKER_DESCRIPTION_METATYPE_NODE: TRACKER_DESCRIPTION_METATYPE_DEFAULT,
        },
        nodegroup=get_nodegroup(TRACKER_DESCRIPTION_NODEGROUP),
        sortorder=0,
    )
    merge_tracker_sys_ref.save()

    return str(merge_tracker_resource.resourceinstanceid)

@shared_task
def reset_database(lock_code_enc):
    lock_code = AES.decrypt(lock_code_enc)

    if not hasattr(settings, "CORAL_UPGRADE_WINDOW_FILE"):
        logging.error(
            "No upgrade windows file set (CORAL_UPGRADE_WINDOW_FILE), so cannot programmatically reset DB"
        )
        return

    with Path(settings.CORAL_UPGRADE_WINDOW_FILE).open() as uwf:
        upgrade_windows = yaml.load(uwf)

    in_window = False
    now = datetime.datetime.now()
    AES = AESCipher(settings.SECRET_KEY)
    for fm, to, window_code_enc in upgrade_windows:
        fm = datetime.datetime.fromisoformat(fm)
        to = datetime.datetime.fromisoformat(to)
        if fm <= now <= to:
            unlock = False
            try:
                unlock = AES.decrypt(window_code_enc) == lock_code
            except Exception as exc:
                logging.error("%s: Could not decrypt window lock for %s:%s", str(exc), fm, to)
            if unlock:
                in_window = True
                break
            else:
                logging.error("Could not match window lock after %s", fm)
                return

    if in_window:
        command = PackageCommand()
        with NamedTemporaryFile() as tf:
            # This is a workaround for the fact that we cannot pass a flag to
            # prevent writing SYSTEM_SETTINGS_LOCAL_PATH
            sslp = settings.SYSTEM_SETTINGS_LOCAL_PATH
            settings.SYSTEM_SETTINGS_LOCAL_PATH = tf.name
            command.load_package(
                str(Path(__file__).parent / "pkg"),
                setup_db=True,
                defer_indexing=False,
                is_application=False,
                include_business_data=True
            )
            settings.SYSTEM_SETTINGS_LOCAL_PATH = sslp
        logging.info(
            "Completed automated reset"
        )
    else:
        logging.error(
            "Not currently in an upgrade window, check %s",
            settings.CORAL_UPGRADE_WINDOW_FILE
        )
        return
