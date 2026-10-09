from django.db import migrations

HA_GRAPHID = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
DEAD_NODE = "2fdedbd0-1459-11ef-8cdd-0242ac120006"
LIVE_NODE = "1dd58086-a4ef-5ffa-8b05-a54a0be14f21"

repoint_tm65_nodes = f"""
    UPDATE functions_x_graphs SET config = jsonb_set(config, '{{tm65_node}}', '"{LIVE_NODE}"')
    WHERE graphid = '{HA_GRAPHID}' AND config->>'tm65_node' = '{DEAD_NODE}';
    UPDATE functions_x_graphs SET config = jsonb_set(config, '{{tm65_output_node}}', '"{LIVE_NODE}"')
    WHERE graphid = '{HA_GRAPHID}' AND config->>'tm65_output_node' = '{DEAD_NODE}';
    """
revert_tm65_nodes = f"""
    UPDATE functions_x_graphs SET config = jsonb_set(config, '{{tm65_node}}', '"{DEAD_NODE}"')
    WHERE graphid = '{HA_GRAPHID}' AND config->>'tm65_node' = '{LIVE_NODE}';
    UPDATE functions_x_graphs SET config = jsonb_set(config, '{{tm65_output_node}}', '"{DEAD_NODE}"')
    WHERE graphid = '{HA_GRAPHID}' AND config->>'tm65_output_node' = '{LIVE_NODE}';
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8012_smm_notif_type"),
    ]

    operations = [
        migrations.RunSQL(
            repoint_tm65_nodes,
            revert_tm65_nodes,
        ),
    ]
