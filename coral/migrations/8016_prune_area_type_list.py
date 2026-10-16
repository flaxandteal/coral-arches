from django.db import migrations

AREA_TYPE_LIST = "59a0a035-bbd0-4e5e-9528-862790edc610"
UNUSED_ITEMS = (
    "134002f4-c7ef-4d87-a251-2db395f91159",  # Non Parish Area
    "331d7a64-9c68-04ce-c5f3-a9ca5a2f004c",  # County
    "3428b28c-0538-839e-f158-03d5de2046ff",  # Council
    "44a30cb3-e168-46f4-8398-331344daff2b",  # Locality
    "7adf9ae8-e391-411a-9438-3c1f18b7fb92",  # Borough
    "8a85128b-4cf5-0013-f837-14581bd6bced",  # Townland
    "94f5c1a1-dab2-81c9-024a-2090c12526b2",  # Town
    "efaf6911-f907-434e-8964-be372953e32d",  # Ecclesiastical
    "ff2aaa01-13c6-4a85-9f4f-b0e2aec6f64c",  # Unitary Authority
)
ITEM_ARRAY = ", ".join(f"'{item}'" for item in UNUSED_ITEMS)

# A fresh build runs migrations before load_package, so the list may not exist yet.
prune_area_type_list = f"""
    DO $$
    DECLARE
        item uuid;
        type_nodes text[];
        type_nodegroups uuid[];
    BEGIN
        IF to_regclass('arches_controlled_lists_listitem') IS NULL THEN
            RETURN;
        END IF;
        SELECT array_agg(nodeid::text), array_agg(DISTINCT nodegroupid)
        INTO type_nodes, type_nodegroups
        FROM nodes WHERE config->>'controlledList' = '{AREA_TYPE_LIST}';
        FOREACH item IN ARRAY ARRAY[{ITEM_ARRAY}]::uuid[] LOOP
            IF NOT EXISTS (
                SELECT 1 FROM arches_controlled_lists_listitem
                WHERE id = item AND list_id = '{AREA_TYPE_LIST}'
            ) THEN
                CONTINUE;
            END IF;
            IF EXISTS (
                SELECT 1 FROM tiles t, unnest(type_nodes) AS n
                WHERE t.nodegroupid = ANY(type_nodegroups)
                AND (t.tiledata -> n)::text LIKE '%' || item || '%'
            ) THEN
                RAISE NOTICE 'Area Type item % is still used by a tile, skipping', item;
                CONTINUE;
            END IF;
            DELETE FROM arches_controlled_lists_listitemimagemetadata
            WHERE list_item_image_id IN (
                SELECT id FROM arches_controlled_lists_listitemvalue WHERE list_item_id = item
            );
            DELETE FROM arches_controlled_lists_listitemvalue WHERE list_item_id = item;
            DELETE FROM arches_controlled_lists_listitem WHERE id = item;
        END LOOP;
    END $$;
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8015_repoint_ha_revision_relationship_concepts"),
    ]

    operations = [
        migrations.RunSQL(prune_area_type_list, migrations.RunSQL.noop),
    ]
