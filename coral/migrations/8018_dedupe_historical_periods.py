from django.db import migrations

PERIOD_LIST = "ce5a1ebb-f1ce-42ed-9c43-14cb8637241f"
REMAPS = (  # (doomed, surviving)
    ("2ad5f1c9-07bc-eeff-0a39-e613f29fdf95", "eedfc939-272d-42b4-b96e-cb681efb6a3e"),  # Late Iron Age
    ("377d31f8-0a79-33e4-e9dc-28d7e6909c2f", "66203678-3d6b-41cf-857e-b7faf0607c95"),  # Late 20th Century
    ("64e1e933-e66a-be10-55a6-978e54e88c2d", "05813b48-b4c3-4b81-a7b4-b27e9cb73d0f"),  # Early 20th Century
    ("6917de1d-3cac-d116-9dcc-4c24f3a7b3c0", "245a684b-2198-48d3-a620-f843f757af4a"),  # Early Medieval
    ("9054d9b7-85f7-c8d3-fec2-36a75551274e", "0ce71a4c-73ea-49d6-ada4-18083b2b086c"),  # Edwardian
    ("97c8fad0-d998-4ce8-af07-a0462070c5ad", "8e45cd2d-8f4f-0d77-7821-bfa6d3d82e0b"),  # Second World War
    ("986309dc-1a61-4177-9cdf-e21dfbaeffe8", "d827f879-726e-415d-8a27-3d9a64e60961"),  # Elizabethan
    ("9a8892da-981a-3043-3ee6-6e74681d7762", "990ce1c2-fadb-48d3-a534-256f3b6194bf"),  # Georgian
    ("a692e145-1339-88c3-7fd0-8b1ada328be5", "1ae36cab-b58b-4244-a21d-426dfafefe10"),  # 20th Century
    ("ae081732-c2cd-402e-89cb-85415aef8299", "268a081b-5fd4-48ae-bc1e-00db4929324e"),  # Cold War
    ("b478b899-b7ff-df9c-b3a2-68e8e2eed4a4", "268a081b-5fd4-48ae-bc1e-00db4929324e"),  # Cold War
    ("b8601798-3880-65e0-21e7-730f70b317c0", "91392ce6-9f10-432c-8947-957829ec9b2b"),  # Uncertain
    ("bf1fa015-1ef0-0499-7cea-7e55d5cca2d2", "b8da8b77-71d3-4f62-bafb-e8e14b5290d5"),  # Mid 20th Century
    ("f343254b-37bc-b6d9-8f97-e3f8ed343d9b", "9032ba54-5b96-4dde-9f60-f6dd967e8e4b"),  # Victorian
    ("f3875b5c-c32c-491e-be64-d071e01b8062", "6bae40ea-bfa7-414f-8a42-90e8c18f613c"),  # Tudor
    ("f9f4adc2-48bb-4e9e-89ac-b1712d443a91", "a02c3ef1-8c67-cb8c-a9b0-275ef2b1281a"),  # First World War
    ("fde52573-63e6-457a-90ea-42d8e61d4a7b", "67fdd550-6922-46a0-38f8-b7ba4d700973"),  # Medieval
)
UNUSED = (
    "c0368ffb-9af8-5ba9-5134-43b73803d0e5",  # 21st century
)
DOOMED = [doomed for doomed, _ in REMAPS] + list(UNUSED)
DOOMED_ARRAY = ", ".join(f"'{item}'" for item in DOOMED)
REMAP_ARRAY = ", ".join(f"ARRAY['{doomed}', '{surviving}']" for doomed, surviving in REMAPS)

# A fresh build runs migrations before load_package, so the list may not exist yet.
dedupe_historical_periods = f"""
    DO $$
    DECLARE
        item uuid;
        pair text[];
        period_nodegroups uuid[];
    BEGIN
        IF to_regclass('arches_controlled_lists_listitem') IS NULL THEN
            RETURN;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM arches_controlled_lists_listitem WHERE list_id = '{PERIOD_LIST}'
        ) THEN
            RETURN;
        END IF;
        SELECT array_agg(DISTINCT nodegroupid) INTO period_nodegroups
        FROM nodes WHERE config->>'controlledList' = '{PERIOD_LIST}';
        FOREACH pair SLICE 1 IN ARRAY ARRAY[{REMAP_ARRAY}] LOOP
            IF EXISTS (
                SELECT 1 FROM arches_controlled_lists_listitem
                WHERE id = pair[1]::uuid AND list_id = '{PERIOD_LIST}'
            ) AND EXISTS (
                SELECT 1 FROM arches_controlled_lists_listitem
                WHERE id = pair[2]::uuid AND list_id = '{PERIOD_LIST}'
            ) THEN
                UPDATE tiles
                SET tiledata = replace(tiledata::text, pair[1], pair[2])::jsonb
                WHERE nodegroupid = ANY(period_nodegroups)
                AND tiledata::text LIKE '%' || pair[1] || '%';
            END IF;
        END LOOP;
        FOREACH item IN ARRAY ARRAY[{DOOMED_ARRAY}]::uuid[] LOOP
            IF NOT EXISTS (
                SELECT 1 FROM arches_controlled_lists_listitem
                WHERE id = item AND list_id = '{PERIOD_LIST}'
            ) THEN
                CONTINUE;
            END IF;
            IF EXISTS (
                SELECT 1 FROM tiles
                WHERE nodegroupid = ANY(period_nodegroups)
                AND tiledata::text LIKE '%' || item || '%'
            ) THEN
                RAISE NOTICE 'Historical period item % is still used by a tile, skipping', item;
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
        ("coral", "8017_area_name_headings"),
    ]

    operations = [
        migrations.RunSQL(dedupe_historical_periods, migrations.RunSQL.noop),
    ]
