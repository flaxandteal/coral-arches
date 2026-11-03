from django.db import migrations

CONSULTATION_TYPE_LIST = "ccc1ff16-fa2e-58be-9d5a-547c0d879fcf"
AGRI_TYPE_LIST = "14339cdc-46db-4ee6-b359-93e5e5bae5fb"
AGRI_TYPE_NODE = "771bb1e2-8895-11ea-8446-f875a44e0e11"
RADIO_WIDGET = "10000000-0000-0000-0000-000000000006"
SWITCH_WIDGET = "10000000-0000-0000-0000-000000000003"
PLACEHOLDER_ITEMS = (
    "1ea3c8e5-c352-5b68-8811-0a83c35c9b34",  # Abstraction
    "58dded5e-aca2-5fdd-a20b-d0ec24ef6fd2",  # Other
)
# (item id, prefLabel value id, label): the ids coral-graphs derives for domain_to_collections.csv.
TYPE_ITEMS = (
    ("2aad7a07-15b5-564d-acf8-b52c2d61178f", "de4d68b4-6bd5-5950-9086-7ec3483befd9", "Deforestation"),
    ("de22f0cb-c3ce-51de-9c41-c952d18a0fbb", "f7ca7427-9a7e-5e8f-9395-cfa70b99f102", "Afforestation"),
    ("7fb4bc35-5c98-5118-b756-2d1cbf6fe9af", "476c7c74-e79f-59fd-ba7a-515fd57eb936", "Hedge Removal"),
    ("cbc37ec2-3327-559d-a73b-1181c9d0cdd8", "a5bca2e4-dacd-5a5c-9ef4-cfad154cadba", "Thinning"),
    ("37b1dcb9-f677-51a3-bd4a-ed078e367360", "e88ac13c-1a94-5b74-b877-cc6f5e77a7aa", "Maintenance"),
)
# (nodeid, label)
SIGNOFF_NODES = (
    ("eae8dfeb-f907-50e2-9a59-7c6a2c847504", "Within Deadline"),
    ("fbf14205-4761-53d3-87a3-2b063303ce6a", "Send Papers"),
)


def insert_items():
    return "\n".join(
        f"""
        INSERT INTO arches_controlled_lists_listitem (id, uri, sortorder, guide, list_id)
        VALUES ('{item}', 'https://coral-her.flaxandteal.co.uk/{item}', {order}, false, '{CONSULTATION_TYPE_LIST}')
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO arches_controlled_lists_listitemvalue (id, value, languageid, list_item_id, valuetype_id)
        VALUES ('{value}', '{label}', 'en', '{item}', 'prefLabel')
        ON CONFLICT (id) DO NOTHING;"""
        for order, (item, value, label) in enumerate(TYPE_ITEMS)
    )


def set_widgets(widget, with_subtitle):
    statements = []
    for nodeid, label in SIGNOFF_NODES:
        subtitle = ', "subtitle": "Click to switch"' if with_subtitle else ""
        config = f'{{"label": "{label}"{subtitle}, "defaultValue": null}}'
        statements.append(f"""
        UPDATE cards_x_nodes_x_widgets SET widgetid = '{widget}', config = '{config}'::jsonb
        WHERE nodeid = '{nodeid}';
        UPDATE published_graphs SET serialized_graph = jsonb_set(
            serialized_graph, '{{cards_x_nodes_x_widgets}}',
            (SELECT jsonb_agg(CASE WHEN w->>'node_id' = '{nodeid}'
                THEN w || jsonb_build_object('widget_id', '{widget}', 'config', '{config}'::jsonb)
                ELSE w END)
             FROM jsonb_array_elements(serialized_graph->'cards_x_nodes_x_widgets') w))
        WHERE serialized_graph->'cards_x_nodes_x_widgets' @> '[{{"node_id": "{nodeid}"}}]';""")
    return "\n".join(statements)


def set_agri_list(list_id):
    return f"""
        UPDATE nodes SET config = jsonb_set(config, '{{controlledList}}', '"{list_id}"')
        WHERE nodeid = '{AGRI_TYPE_NODE}';
        UPDATE published_graphs SET serialized_graph = jsonb_set(
            serialized_graph, '{{nodes}}',
            (SELECT jsonb_agg(CASE WHEN n->>'nodeid' = '{AGRI_TYPE_NODE}'
                THEN jsonb_set(n, '{{config,controlledList}}', '"{list_id}"')
                ELSE n END)
             FROM jsonb_array_elements(serialized_graph->'nodes') n))
        WHERE serialized_graph->'nodes' @> '[{{"nodeid": "{AGRI_TYPE_NODE}"}}]';"""


def guarded(body):
    # A fresh build runs migrations before load_package, so the list may not exist yet.
    return f"""
    DO $$
    BEGIN
        IF to_regclass('arches_controlled_lists_list') IS NULL
           OR NOT EXISTS (SELECT 1 FROM arches_controlled_lists_list WHERE id = '{CONSULTATION_TYPE_LIST}') THEN
            RETURN;
        END IF;
        {body}
    END $$;
    """


placeholder_ids = ", ".join(f"'{item}'" for item in PLACEHOLDER_ITEMS)
forward = guarded(f"""
        {insert_items()}
        DELETE FROM arches_controlled_lists_listitemvalue WHERE list_item_id IN ({placeholder_ids});
        DELETE FROM arches_controlled_lists_listitem WHERE id IN ({placeholder_ids});
        {set_agri_list(CONSULTATION_TYPE_LIST)}
        {set_widgets(RADIO_WIDGET, False)}
""")
# The list items are not restored: the placeholders were never real choices.
reverse = guarded(f"""
        {set_agri_list(AGRI_TYPE_LIST)}
        {set_widgets(SWITCH_WIDGET, True)}
""")


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8021_generated_number_placeholders"),
    ]

    operations = [
        migrations.RunSQL(forward, reverse),
    ]
