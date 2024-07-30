from arches.app.functions.base import BaseFunction
from arches.app.models.resource import Resource
from arches.app.models.tile import Tile
from arches.app.models import models
from arches_orm.models import Person, Group
import uuid

TRANSFER_OF_LICENSE_NODEGROUP_ID = "6397b05c-c443-11ee-94bf-0242ac180006"
FORMER_LICENSEE_FIELD_ID = "43ec68d6-c445-11ee-8be7-0242ac180006"
NEW_LICENSEE_FIELD_ID = "ab2db0ec-c448-11ee-94bf-0242ac180006"

CONTACTS_NODEGROUP_ID = "6d290832-5891-11ee-a624-0242ac120004"
LICENSEES_NODE_ID = "6d294784-5891-11ee-a624-0242ac120004"

details = {
    "functionid": "9b955a8d-64b0-4139-9470-1085d802475f",
    "name": "Transfer License",
    "type": "node",
    "description": "Will handle re-assigning the licensees during a transfer of license ",
    "defaultconfig": {"triggering_nodegroups": [TRANSFER_OF_LICENSE_NODEGROUP_ID]},
    "classname": "TransferOfLicense",
    "component": "",
}


class TransferOfLicense(BaseFunction):
    def post_save(self, tile, request, context):
        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        contacts_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=CONTACTS_NODEGROUP_ID,
        ).first()

        if not contacts_tile:
            raise Exception("No original licensees provided to transfer a license from.")

        original_licensee_resource_ids = [
            x.get("resourceId") for x in contacts_tile.data.get(LICENSEES_NODE_ID, [])
        ]

        new_licensee_node_data = tile.data.get(NEW_LICENSEE_FIELD_ID, [])
        new_licensee_resource_id = (
            new_licensee_node_data[0].get("resourceId", None)
            if len(new_licensee_node_data)
            else None
        )

        former_licensee_node_data = tile.data.get(FORMER_LICENSEE_FIELD_ID, [])
        former_licensee_resource_id = (
            former_licensee_node_data[0].get("resourceId", None)
            if len(former_licensee_node_data)
            else None
        )

        if not len(original_licensee_resource_ids):
            raise Exception("No original licensees found")

        if not new_licensee_resource_id:
            raise Exception("No new licensee provided.")

        if not former_licensee_resource_id:
            raise Exception("No former licensee provided.")

        if former_licensee_resource_id not in original_licensee_resource_ids:
            raise Exception("Former licensee is not part of the orignal licensees.")

        related_persons = contacts_tile.data.get(LICENSEES_NODE_ID, [])
        # remove former
        related_persons = list(
            filter(
                lambda x: x.get("resourceId", None) != former_licensee_resource_id,
                related_persons,
            )
        )
        # add new licensee
        related_persons.append(
            {
                "resourceId": new_licensee_resource_id,
                "ontologyProperty": "",
                "resourceXresourceId": str(uuid.uuid4()),
                "inverseOntologyProperty": "",
            }
        )

        contacts_tile.data[LICENSEES_NODE_ID] = related_persons
        contacts_tile.save()
