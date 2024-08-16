from arches.app.functions.base import BaseFunction
from coral.utils.ha_number import HaNumber
from arches.app.models.tile import Tile

HA_NAMES_NODEGROUP_ID = "676d47f9-9c1c-11ea-9aa0-f875a44e0e11"
HA_NAMES_NAME_NODE_ID = "676d47ff-9c1c-11ea-b07f-f875a44e0e11"

HA_SYSTEM_REFERENCE_NODEGROUP_ID = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba"
HA_SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = "325a430a-efe4-11eb-810b-a87eeabdefba"

HA_DISPLAY_NAME_NODEGROUP_ID = "ce85b994-3f5f-11ef-b9b0-0242ac140006"
HA_DISPLAY_NAME_NODE_ID = HA_DISPLAY_NAME_NODEGROUP_ID
HA_DISPLAY_NAME_SHOW_SMR_NUMBER_NODE_ID = "09d9c45e-3f60-11ef-b90f-0242ac140006"
HA_DISPLAY_NAME_SHOW_IHR_NODE_ID = "461dbbe6-3f60-11ef-b90f-0242ac140006"
HA_DISPLAY_NAME_SHOW_HB_NUMBER_NODE_ID = "c5680816-3f60-11ef-b90f-0242ac140006"
HA_DISPLAY_NAME_SHOW_HPG_NODE_ID = "eebe09ea-3f60-11ef-b9b0-0242ac140006"

HA_REFERENCES_NODEGROUP_ID = "e71df5cc-3aad-11ef-a2d0-0242ac120003"
HA_REFERENCE_SMR_NUMBER_NODE_ID = "158e1ed2-3aae-11ef-a2d0-0242ac120003"
HA_REFERENCE_IHR_NUMBER_NODE_ID = "1de9abf0-3aae-11ef-91fd-0242ac120003"
HA_REFERENCE_HB_NUMBER_NODE_ID = "250002fe-3aae-11ef-91fd-0242ac120003"
HA_REFERENCE_HPG_NUMBER_NODE_ID = "2c2d02fc-3aae-11ef-91fd-0242ac120003"

details = {
    "functionid": "e7362891-3b9a-46a9-a39d-2f03222771c4",
    "name": "Generate Heritage Asset Name",
    "type": "node",
    "description": "Will monitor changes to heritage asset name, heritage asset references and display name toggles. Re-generating the heritage asset name based on these conditions.",
    "defaultconfig": {
        "triggering_nodegroups": [
            HA_NAMES_NODEGROUP_ID,
            HA_REFERENCES_NODEGROUP_ID,
            HA_DISPLAY_NAME_NODEGROUP_ID,
            HA_SYSTEM_REFERENCE_NODEGROUP_ID,
        ]
    },
    "classname": "GenerateHertiageAssetNameFunction",
    "component": "",
}


class GenerateHertiageAssetNameFunction(BaseFunction):
    def get_ha_references_tile(self, resource_instance_id):
        ha_ref_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=HA_REFERENCES_NODEGROUP_ID,
        ).first()
        return ha_ref_tile

    def get_ha_name_tiles(self, resource_instance_id):
        ha_name_tiles = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=HA_NAMES_NODEGROUP_ID,
        )
        return list(ha_name_tiles)

    def get_ha_display_name_tile(self, resource_instance_id):
        ha_display_name_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=HA_DISPLAY_NAME_NODEGROUP_ID,
        ).first()
        if not ha_display_name_tile:
            ha_display_name_tile = Tile.get_blank_tile_from_nodegroup_id(
                HA_DISPLAY_NAME_NODEGROUP_ID, resourceid=resource_instance_id
            )
            ha_display_name_tile.save()
        return ha_display_name_tile

    def get_ha_system_reference_tile(self, resource_instance_id):
        ha_system_ref_tile = Tile.objects.filter(
            resourceinstance_id=resource_instance_id,
            nodegroup_id=HA_SYSTEM_REFERENCE_NODEGROUP_ID,
        ).first()
        return ha_system_ref_tile

    def get_localised_string_value(self, tile, node_id):
        if not tile:
            return None
        node_value = tile.data.get(node_id, None)
        if node_value:
            return node_value.get("en", {}).get("value", None)
        return node_value

    def value_as_localised_string(self, value):
        return {"en": {"value": value, "direction": "ltr"}}

    def update_display_name_tile(self, tile, name):
        # FIXME: Prevent infinite save loop by only updating and saving when the new name
        # is different than what is currently stored on the tile. This does
        # mean the logic will be ran twice every time.
        if self.get_localised_string_value(tile, HA_DISPLAY_NAME_NODE_ID) == name:
            return
        tile.data[HA_DISPLAY_NAME_NODE_ID] = self.value_as_localised_string(name)
        tile.save()

    def post_save(self, tile, request, context):
        if context.get('escape_function', False):
            return

        resource_instance_id = str(tile.resourceinstance.resourceinstanceid)

        ha_ref_tile = self.get_ha_references_tile(resource_instance_id)
        ha_name_tiles = self.get_ha_name_tiles(resource_instance_id)
        ha_display_name_tile = self.get_ha_display_name_tile(resource_instance_id)
        ha_system_ref_tile = self.get_ha_system_reference_tile(resource_instance_id)

        show_smr_number = False
        show_ihr_number = False
        show_hb_number = False
        show_hpg_number = False
        if ha_display_name_tile:
            show_smr_number = (
                ha_display_name_tile.data.get(
                    HA_DISPLAY_NAME_SHOW_SMR_NUMBER_NODE_ID, None
                )
                or False
            )
            show_ihr_number = (
                ha_display_name_tile.data.get(HA_DISPLAY_NAME_SHOW_IHR_NODE_ID, None)
                or False
            )
            show_hb_number = (
                ha_display_name_tile.data.get(
                    HA_DISPLAY_NAME_SHOW_HB_NUMBER_NODE_ID, None
                )
                or False
            )
            show_hpg_number = (
                ha_display_name_tile.data.get(HA_DISPLAY_NAME_SHOW_HPG_NODE_ID, None)
                or False
            )

        smr_number = self.get_localised_string_value(
            ha_ref_tile, HA_REFERENCE_SMR_NUMBER_NODE_ID
        )
        ihr_number = self.get_localised_string_value(
            ha_ref_tile, HA_REFERENCE_IHR_NUMBER_NODE_ID
        )
        hb_number = self.get_localised_string_value(
            ha_ref_tile, HA_REFERENCE_HB_NUMBER_NODE_ID
        )
        hpg_number = self.get_localised_string_value(
            ha_ref_tile, HA_REFERENCE_HPG_NUMBER_NODE_ID
        )
        ha_number = self.get_localised_string_value(
            ha_system_ref_tile, HA_SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID
        )

        # This is a many tile, currently just assuming the first and possibly only tile in there
        # has the correct name. In the future we might need to use currency to identify the correct name.
        ha_name = None
        if len(ha_name_tiles):
            ha_name = self.get_localised_string_value(
                ha_name_tiles[0], HA_NAMES_NAME_NODE_ID
            )

        # No other identifing references
        if (
            not smr_number
            and not ihr_number
            and not hb_number
            and not hpg_number
            and not ha_name
        ):
            self.update_display_name_tile(ha_display_name_tile, ha_number)
            return

        # No other identifing references but name is provided
        if not smr_number and not ihr_number and not hb_number and not hpg_number:
            self.update_display_name_tile(
                ha_display_name_tile, f"{ha_number} {ha_name}"
            )
            return

        # First time creating the display name group will have all these false. The first refernce value
        # that is discovered will be toggled as shown and put into the display name
        if (
            not show_smr_number
            and not show_ihr_number
            and not show_hb_number
            and not show_hpg_number
        ):
            if smr_number:
                ha_display_name_tile.data[HA_DISPLAY_NAME_SHOW_SMR_NUMBER_NODE_ID] = (
                    True
                )
                self.update_display_name_tile(
                    ha_display_name_tile, f"{smr_number} {ha_name}"
                )
                return
            if ihr_number:
                ha_display_name_tile.data[HA_DISPLAY_NAME_SHOW_IHR_NODE_ID] = True
                self.update_display_name_tile(
                    ha_display_name_tile, f"{ihr_number} {ha_name}"
                )
                return
            if hb_number:
                ha_display_name_tile.data[HA_DISPLAY_NAME_SHOW_HB_NUMBER_NODE_ID] = True
                self.update_display_name_tile(
                    ha_display_name_tile, f"{hb_number} {ha_name}"
                )
                return
            if hpg_number:
                ha_display_name_tile.data[HA_DISPLAY_NAME_SHOW_HPG_NODE_ID] = True
                self.update_display_name_tile(
                    ha_display_name_tile, f"{hpg_number} {ha_name}"
                )
                return

        # Last path is to check the toggled reference IDs and display them accoridingly
        display_name = []
        if show_smr_number:
            display_name.append(smr_number)
        if show_ihr_number:
            display_name.append(ihr_number)
        if show_hb_number:
            display_name.append(hb_number)
        if show_hpg_number:
            display_name.append(hpg_number)
        display_name.append(ha_name)

        self.update_display_name_tile(ha_display_name_tile, " ".join(display_name))
        return
