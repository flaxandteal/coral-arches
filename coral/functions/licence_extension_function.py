from arches.app.functions.base import BaseFunction
from arches.app.models.tile import Tile
import uuid


details = {
    "functionid": "af21207f-4296-4519-912a-80153a98e5db",
    "name": "Licence Extension Function",
    "type": "node",
    "description": "Will handle altering valid until date for a licence after an extension is granted ",
    "defaultconfig": {
        "triggering_nodegroups": ["69b2738e-c4d2-11ee-b171-0242ac180006"], 
        "extension_applied_node": "1938e0ac-703d-11ef-b171-f246ab1c4029", 
        "decision_nodegroup": "1887f678-c42d-11ee-bc4b-0242ac180006",
        "decision_valid_until_node": "1887fc86-c42d-11ee-bc4b-0242ac180006",
        "valid_until_node": "412902cc-c4d5-11ee-90c5-0242ac180006",
        "cur_d_node": "2e7a876e-c4d4-11ee-b171-0242ac180006",
        "cur_d_decision_node": "2e7a81b0-c4d4-11ee-b171-0242ac180006",
        "cur_e_node": "50970864-c4d3-11ee-90c5-0242ac180006",
        "cur_e_decision_node": "50970b20-c4d3-11ee-90c5-0242ac180006"
        },
    "classname": "LicenceExtensionFunction",
    "component": "",
}

class LicenceExtensionFunction(BaseFunction):
    def grantExtension(self, tile, request, context=None):
        """Validates Licence Extensions and, when successful, updates the "Valid Until" node in the Decision Nodegroup
        Args:
            self : LicenceExtensionFunction object.

                self.config: a list of relevant nodes in the Extension and Decision nodegroups

            tile : Licence Extension Tile

            request : Request used to verify call is result of user action. N.B. Function Returns if empty.

            context : represents the context in which this function has been called.
        """
        if context and context.get('escape_function', False):
            return

        # Many tiles save themselves again each time a new one saves to circumvent
        # old transfer getting applied again and failed this node will be set to
        # true after it has been used
        if tile.data[self.config["extension_applied_node"]]:
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)
        extension_tile_data = tile.data        
        
        extension_of_licence_tiles = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=self.config["extension_of_licence_nodegroup"],
        )

        for tol_tile in extension_of_licence_tiles:
            applied = tol_tile.data.get(self.config["extension_applied_node"], None)
            if applied:
                continue
            if str(tol_tile.tileid) != str(tile.tileid):
                raise Exception(
                    "You cannot start a new extension request for this licence while another is waiting to be closed."
                )

        # If there is no decision tile we can exit early
        decision_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id= self.config["decision_nodegroup"]
        ).first()
        if not decision_tile:
            raise Exception(
                "No decision has been made to grant this licence."
            )

        decision_tile_data = decision_tile.data

        if self.config["decision_valid_until_node"] not in decision_tile_data.keys():
            raise Exception(
                "Original date could not be found"
            )

        cur_d_person_node_data = extension_tile_data[self.config["cur_d_node"]] or []
        cur_d_person_resource_id = (
            cur_d_person_node_data[0].get("resourceId", None)
            if len(cur_d_person_node_data)
            else None
        )

        cur_d_decision_value_id = extension_tile_data[self.config["cur_d_decision_node"]] or None

        cur_e_person_node_data = extension_tile_data[self.config["cur_e_node"]] or []
        cur_e_person_resource_id = (
            cur_e_person_node_data[0].get("resourceId", None)
            if len(cur_e_person_node_data)
            else None
        )

        cur_e_decision_value_id = extension_tile_data[self.config["cur_e_decision_node"]] or None


        # If we don't have any of these values we can't mark the extension as applied
        if (
            not cur_d_person_resource_id
            or not cur_d_decision_value_id
            or not cur_e_person_resource_id
            or not cur_e_decision_value_id
        ):
            return

        # Mark the transfer as applied and save if both staff approve
        tile.data[self.config["extension_applied_node"]] = True
        if tile.data[self.config["cur_e_decision_node"]] == "5e82bfd8-a455-4a2b-90d2-abe5854b537a" and tile.data[self.config["cur_d_decision_node"]] == "0c888ace-b068-470a-91cb-9e5f57c660b4":
            decision_tile.data[self.config["decision_valid_until_node"]] = extension_tile_data[self.config["valid_until_node"]]
            decision_tile.save()

    def get(self):
        raise NotImplementedError

    def save(self, tile, request, context=None):
        return self.grantExtension(tile, request, context)

    def post_save(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self, tile, request):
        raise NotImplementedError

    def on_import(self, tile):
        raise NotImplementedError

    def after_function_save(self, tile, request):
        raise NotImplementedError