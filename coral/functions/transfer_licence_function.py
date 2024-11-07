from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
import uuid

TRANSFER_OF_LICENCE_NODEGROUP_ID = "6397b05c-c443-11ee-94bf-0242ac180006"
FORMER_LICENSEE_NODE_ID = "43ec68d6-c445-11ee-8be7-0242ac180006"
NEW_LICENSEE_NODE_ID = "ab2db0ec-c448-11ee-94bf-0242ac180006"
APPLICANT_NODE_ID = "f870c35e-c447-11ee-8be7-0242ac180006"
FORMER_EMPLOYING_BODY_NODE_ID = "477e4950-7044-11ef-831e-0242ac120006"
NEW_EMPLOYING_BODY_NODE_ID = "29b2355e-c44a-11ee-94bf-0242ac180006"
CUR_D_PERSON_NODE_ID = "6bc892c8-c44d-11ee-94bf-0242ac180006"
CUR_D_DECISION_NODE_ID = "6bc889fe-c44d-11ee-94bf-0242ac180006"
CUR_E_PERSON_NODE_ID = "058ccf60-c44d-11ee-94bf-0242ac180006"
CUR_E_DECISION_NODE_ID = "058cd212-c44d-11ee-94bf-0242ac180006"
TRANSFER_APPLIED_NODE_ID = "1938e0ac-703d-11ef-934d-0242ac120006"

CONTACTS_NODEGROUP_ID = "6d290832-5891-11ee-a624-0242ac120004"
CONTACTS_LICENSEES_NODE_ID = "6d294784-5891-11ee-a624-0242ac120004"
CONTACTS_EMPLOYING_BODY_NODE_ID = "07d3905c-d58b-11ee-a02f-0242ac180006"
CONTACTS_APPLICANT_NODE_ID = "6d2924b6-5891-11ee-a624-0242ac120004"


details = {
    "functionid": "9b955a8d-64b0-4139-9470-1085d802475f",
    "name": "Transfer Licence Function",
    "type": "node",
    "description": "Will handle re-assigning the licensees during a transfer of licence ",
    "defaultconfig": {"triggering_nodegroups": [TRANSFER_OF_LICENCE_NODEGROUP_ID]},
    "classname": "TransferOfLicenceFunction",
    "component": "",
}


class TransferOfLicenceFunction(BaseFunction):
    def save(self, tile, request, context=None):
        if context and context.get('escape_function', False):
            return
        # Many tiles save themselves again each time a new one saves to circumvent
        # old transfer getting applied again and failed this node will be set to
        # true after it has been used
        if tile.data[TRANSFER_APPLIED_NODE_ID]:
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        transfer_of_licence_tiles = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=TRANSFER_OF_LICENCE_NODEGROUP_ID,
        )

        for tol_tile in transfer_of_licence_tiles:
            applied = tol_tile.data.get(TRANSFER_APPLIED_NODE_ID, None)
            if applied:
                continue
            if str(tol_tile.tileid) != str(tile.tileid):
                raise Exception(
                    "You cannot start a new transfer of licence while there is still a transfer waiting to be closed out."
                )

        # If there is no contacts tile we can exit early
        contacts_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=CONTACTS_NODEGROUP_ID,
        ).first()
        if not contacts_tile:
            raise Exception(
                "No Nominated Excavation Directors found on the Application Details page."
            )

        # Get licensees currently on the contacts tile
        licensees = contacts_tile.data.get(CONTACTS_LICENSEES_NODE_ID, []) or []
        original_licensee_resource_ids = [x.get("resourceId") for x in licensees]

        # Get employing bodies currently on the contacts tile
        employing_bodies = contacts_tile.data.get(CONTACTS_EMPLOYING_BODY_NODE_ID, []) or []
        original_employing_bodies_resource_ids = [x.get("resourceId") for x in employing_bodies]

        # Get licensees that should be removed from the contacts tile
        former_licensee_node_data = tile.data.get(FORMER_LICENSEE_NODE_ID, []) or []
        former_licensee_resource_ids = [
            x.get("resourceId") for x in former_licensee_node_data
        ]

        # Get new licensees currently attached to the transfer tile
        new_licensee_node_data = tile.data.get(NEW_LICENSEE_NODE_ID, []) or []
        new_licensee_resource_ids = [
            x.get("resourceId") for x in new_licensee_node_data
        ]

        # Get the employing bodies that should be removed from the contacts tile
        former_employing_body_node_data = (
            tile.data.get(FORMER_EMPLOYING_BODY_NODE_ID, []) or []
        )
        former_employing_body_resource_ids = [
            x.get("resourceId") for x in former_employing_body_node_data
        ]

        # Get the employing bodies that should be added to the contacts tile
        new_employing_body_node_data = (
            tile.data.get(NEW_EMPLOYING_BODY_NODE_ID, []) or []
        )
        new_employing_body_resource_ids = [
            x.get("resourceId") for x in new_employing_body_node_data
        ]

        # Get the applicant that will replace the applicant on the contacts tile
        new_applicant_node_data = tile.data.get(APPLICANT_NODE_ID, []) or []
        new_applicant_resource_id = (
            new_applicant_node_data[0].get("resourceId", None)
            if len(new_applicant_node_data)
            else None
        )

        # Get the Cur D Person resource id
        cur_d_person_node_data = tile.data.get(CUR_D_PERSON_NODE_ID, []) or []
        cur_d_person_resource_id = (
            cur_d_person_node_data[0].get("resourceId", None)
            if len(cur_d_person_node_data)
            else None
        )

        # Get the Cur D Decision value uuid
        cur_d_decision_value_id = tile.data.get(CUR_D_DECISION_NODE_ID, None) or None

        # Get the Cur E Person resource id
        cur_e_person_node_data = tile.data.get(CUR_E_PERSON_NODE_ID, []) or []
        cur_e_person_resource_id = (
            cur_e_person_node_data[0].get("resourceId", None)
            if len(cur_e_person_node_data)
            else None
        )

        # Get the Cur E Decision value uuid
        cur_e_decision_value_id = tile.data.get(CUR_E_DECISION_NODE_ID, None) or None

        if not new_applicant_resource_id:
            raise Exception(
                "You must provide the applicant that requested the transfer."
            )

        if not len(original_licensee_resource_ids):
            raise Exception(
                "No Nominated Excavation Directors found on the Application Details page."
            )

        if not len(former_licensee_resource_ids):
            raise Exception("You must provide a Former Licensee to transfer a licence.")

        former_new_licensee_id_intersection = list(
            set(former_licensee_resource_ids) & set(original_licensee_resource_ids)
        )
        if len(former_new_licensee_id_intersection) != len(
            former_licensee_resource_ids
        ):
            raise Exception(
                "You provided a Former Licensee who is not part of the Nominated Excavation Directors found on the Application Details page."
            )

        if not len(new_licensee_resource_ids):
            raise Exception(
                "You must provide a new Nominated Excavation Director to transfer a licence."
            )

        former_new_employing_body_id_intersection = list(
            set(former_employing_body_resource_ids)
            & set(original_employing_bodies_resource_ids)
        )
        if len(former_new_employing_body_id_intersection) != len(
            former_employing_body_resource_ids
        ):
            raise Exception(
                "You provided a Former Employing Body who is not part of the Employing Bodies found on the Application Details page."
            )

        # If we don't have any of these values we can't mark the transfer as applied
        if (
            not cur_d_person_resource_id
            or not cur_d_decision_value_id
            or not cur_e_person_resource_id
            or not cur_e_decision_value_id
        ):
            return

        # Mark the transfer as applied
        tile.data[TRANSFER_APPLIED_NODE_ID] = True

        # This process handles overwriting the applicant
        contacts_applicant = (
            contacts_tile.data.get(CONTACTS_APPLICANT_NODE_ID, []) or []
        )
        contacts_applicant = [
            {
                "resourceId": new_applicant_resource_id,
                "ontologyProperty": "",
                "resourceXresourceId": str(uuid.uuid4()),
                "inverseOntologyProperty": "",
            }
        ]
        contacts_tile.data[CONTACTS_APPLICANT_NODE_ID] = contacts_applicant

        # This process handles the licensees being removed and added
        contacts_licensees = (
            contacts_tile.data.get(CONTACTS_LICENSEES_NODE_ID, []) or []
        )
        contacts_licensees_resource_ids = [
            x.get("resourceId") for x in contacts_licensees
        ]
        # Remove licensees
        for frid in former_licensee_resource_ids:
            contacts_licensees = list(
                filter(
                    lambda x: x.get("resourceId", None) != frid,
                    contacts_licensees,
                )
            )
        # Add the new licensees to the contacts tile
        for nlrid in new_licensee_resource_ids:
            if nlrid in contacts_licensees_resource_ids:
                continue
            contacts_licensees.append(
                {
                    "resourceId": nlrid,
                    "ontologyProperty": "",
                    "resourceXresourceId": str(uuid.uuid4()),
                    "inverseOntologyProperty": "",
                }
            )
        # Set new value onto contacts tile
        contacts_tile.data[CONTACTS_LICENSEES_NODE_ID] = contacts_licensees

        # This process handles removing the former employing bodies from the contacts tile
        contacts_employing_bodies = (
            contacts_tile.data.get(CONTACTS_EMPLOYING_BODY_NODE_ID, []) or []
        )
        contacts_employing_bodies_resource_ids = [
            x.get("resourceId") for x in contacts_employing_bodies
        ]
        # Remove employing bodies
        for frid in former_employing_body_resource_ids:
            contacts_employing_bodies = list(
                filter(
                    lambda x: x.get("resourceId", None) != frid,
                    contacts_employing_bodies,
                )
            )
        # Add the new licensees to the contacts tile
        for nebrid in new_employing_body_resource_ids:
            if nebrid in contacts_employing_bodies_resource_ids:
                continue
            contacts_employing_bodies.append(
                {
                    "resourceId": nebrid,
                    "ontologyProperty": "",
                    "resourceXresourceId": str(uuid.uuid4()),
                    "inverseOntologyProperty": "",
                }
            )
        # Set new value onto contacts tile
        contacts_tile.data[CONTACTS_EMPLOYING_BODY_NODE_ID] = contacts_employing_bodies

        # Save the changes to the contacts tile
        contacts_tile.save()
