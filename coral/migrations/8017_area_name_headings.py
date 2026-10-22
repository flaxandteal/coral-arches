from django.db import migrations

AREA_NAME_LIST = "48457f95-2b62-410e-9022-38a14db8b9f1"
AREA_TYPE_LIST = "59a0a035-bbd0-4e5e-9528-862790edc610"
UNUSED_HEADINGS = ("Council", "County", "Out of Area", "Town", "Townland")
HEADING_ARRAY = ", ".join(f"'{heading}'" for heading in UNUSED_HEADINGS)

# A fresh build runs migrations before load_package, so the list may not exist yet.
# The ETL resolved Area Name by label alone, so values with a same-named entry under
# their Area Type's heading are repointed there before the other headings are pruned.
# The temp tables are ANALYZEd: unanalysed, the planner rescans every tile per heading.
area_name_headings = f"""
    DO $$
    DECLARE
        area_nodegroups uuid[];
        repointed integer;
        total_items integer;
        kept_items integer;
    BEGIN
        IF to_regclass('arches_controlled_lists_listitem') IS NULL THEN
            RETURN;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM arches_controlled_lists_listitem WHERE list_id = '{AREA_NAME_LIST}'
        ) THEN
            RETURN;
        END IF;

        SELECT array_agg(DISTINCT nodegroupid) INTO area_nodegroups
        FROM nodes WHERE config->>'controlledList' = '{AREA_NAME_LIST}';

        CREATE TEMP TABLE an_items ON COMMIT DROP AS
        SELECT i.id, i.uri, i.parent_id, lower(trim(v.value)) AS label, v.id AS value_id
        FROM arches_controlled_lists_listitem i
        JOIN arches_controlled_lists_listitemvalue v
            ON v.list_item_id = i.id AND v.valuetype_id = 'prefLabel' AND v.languageid = 'en'
        WHERE i.list_id = '{AREA_NAME_LIST}';
        ANALYZE an_items;

        CREATE TEMP TABLE an_remap ON COMMIT DROP AS
        SELECT DISTINCT ON (it.id, heading.label)
            it.id::text AS from_id, heading.label AS type_label,
            target.id::text AS to_id, target.uri, target.value_id::text AS value_id
        FROM an_items it
        JOIN an_items target ON target.label = it.label AND target.parent_id <> it.parent_id
        JOIN an_items heading ON heading.id = target.parent_id AND heading.parent_id IS NULL
        WHERE it.parent_id IS NOT NULL
        ORDER BY it.id, heading.label, target.id;
        ANALYZE an_remap;

        CREATE TEMP TABLE an_pairs ON COMMIT DROP AS
        SELECT n.nodeid::text AS name_node, t.nodeid::text AS type_node, n.nodegroupid
        FROM nodes n
        JOIN nodes t ON t.nodegroupid = n.nodegroupid
            AND t.config->>'controlledList' = '{AREA_TYPE_LIST}'
        WHERE n.config->>'controlledList' = '{AREA_NAME_LIST}';
        ANALYZE an_pairs;

        UPDATE tiles t
        SET tiledata = jsonb_set(jsonb_set(jsonb_set(t.tiledata,
            ARRAY[w.name_node, '0', 'uri'], to_jsonb(w.uri)),
            ARRAY[w.name_node, '0', 'labels', '0', 'list_item_id'], to_jsonb(w.to_id)),
            ARRAY[w.name_node, '0', 'labels', '0', 'id'], to_jsonb(w.value_id))
        FROM (
            SELECT c.tileid, p.name_node, r.to_id, r.uri, r.value_id
            FROM tiles c
            JOIN an_pairs p ON p.nodegroupid = c.nodegroupid
            JOIN an_remap r
                ON r.from_id = c.tiledata -> p.name_node -> 0 -> 'labels' -> 0 ->> 'list_item_id'
                AND r.type_label = lower(trim(c.tiledata -> p.type_node -> 0 -> 'labels' -> 0 ->> 'value'))
            WHERE c.nodegroupid = ANY(area_nodegroups)
        ) w
        WHERE t.tileid = w.tileid;
        GET DIAGNOSTICS repointed = ROW_COUNT;
        RAISE NOTICE 'Area Name: repointed % tiles to the entry under their Area Type heading', repointed;

        CREATE TEMP TABLE an_keep ON COMMIT DROP AS
        WITH RECURSIVE used AS (
            SELECT DISTINCT l ->> 'list_item_id' AS id
            FROM tiles t
            JOIN an_pairs p ON p.nodegroupid = t.nodegroupid
            CROSS JOIN LATERAL jsonb_array_elements(t.tiledata -> p.name_node) AS e
            CROSS JOIN LATERAL jsonb_array_elements(e -> 'labels') AS l
            WHERE t.nodegroupid = ANY(area_nodegroups)
            AND jsonb_typeof(t.tiledata -> p.name_node) = 'array'
        ),
        keep AS (
            SELECT i.id, i.parent_id FROM an_items i JOIN used ON i.id::text = used.id
            UNION
            SELECT i.id, i.parent_id FROM an_items i JOIN keep ON i.id = keep.parent_id
        )
        SELECT id FROM keep;

        CREATE TEMP TABLE an_doomed ON COMMIT DROP AS
        WITH RECURSIVE branch AS (
            SELECT id FROM an_items
            WHERE parent_id IS NULL AND label IN (SELECT lower(h) FROM unnest(ARRAY[{HEADING_ARRAY}]) h)
            UNION
            SELECT i.id FROM an_items i JOIN branch b ON i.parent_id = b.id
        )
        SELECT id FROM branch;
        SELECT count(*) INTO total_items FROM an_doomed;
        DELETE FROM an_doomed WHERE id IN (SELECT id FROM an_keep);
        SELECT total_items - count(*) INTO kept_items FROM an_doomed;
        RAISE NOTICE 'Area Name: kept % unused-heading items because tiles still use them', kept_items;

        DELETE FROM arches_controlled_lists_listitemimagemetadata
        WHERE list_item_image_id IN (
            SELECT id FROM arches_controlled_lists_listitemvalue
            WHERE list_item_id IN (SELECT id FROM an_doomed)
        );
        DELETE FROM arches_controlled_lists_listitemvalue
        WHERE list_item_id IN (SELECT id FROM an_doomed);
        DELETE FROM arches_controlled_lists_listitem WHERE id IN (SELECT id FROM an_doomed);
    END $$;
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8016_prune_area_type_list"),
    ]

    operations = [
        migrations.RunSQL(area_name_headings, migrations.RunSQL.noop),
    ]
