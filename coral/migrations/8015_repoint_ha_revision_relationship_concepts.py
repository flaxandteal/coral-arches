from django.db import migrations

HA_REVISION_GRAPHID = "65b1be1a-dfa4-49cf-a736-a1a88c0bb289"
DEAD_CONCEPT = "0a6e25e5-ee46-44bf-9306-2d0949a5601e"
DEAD_COLLECTION = "49ca78e5-3f9f-45a5-9edf-bd8269408157"
LIVE_CONCEPT = "ac41d9be-79db-4256-b368-2f4559cfbe55"
LIVE_COLLECTION = "00000000-0000-0000-0000-000000000005"
NODE_IDS = (
    "56c385ad-24be-42bf-bbbe-42104488dcfe",  # occupier
    "d3059470-9b4c-4373-a713-b89e2db4e0e3",  # approved_by
    "d0b45457-d9a3-43fc-910b-0dc29c14315b",  # area_archaeologist
    "af8f3589-9a4f-4d22-98b0-dfdcbb80dc6b",  # documentation
    "62eed7f2-6fba-41be-a6c4-b560ec0591a8",  # entered_by_value
)

repoint_ha_revision_relationship_concepts = f"""
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,relationshipConcept}}', '"{LIVE_CONCEPT}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'relationshipConcept' = '{DEAD_CONCEPT}';
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,inverseRelationshipConcept}}', '"{LIVE_CONCEPT}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'inverseRelationshipConcept' = '{DEAD_CONCEPT}';
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,relationshipCollection}}', '"{LIVE_COLLECTION}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'relationshipCollection' = '{DEAD_COLLECTION}';
    """
revert_ha_revision_relationship_concepts = f"""
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,relationshipConcept}}', '"{DEAD_CONCEPT}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'relationshipConcept' = '{LIVE_CONCEPT}';
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,inverseRelationshipConcept}}', '"{DEAD_CONCEPT}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'inverseRelationshipConcept' = '{LIVE_CONCEPT}';
    UPDATE nodes SET config = jsonb_set(config, '{{graphs,0,relationshipCollection}}', '"{DEAD_COLLECTION}"')
    WHERE graphid = '{HA_REVISION_GRAPHID}' AND nodeid IN {NODE_IDS}
    AND config->'graphs'->0->>'relationshipCollection' = '{LIVE_COLLECTION}';
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8014_repoint_tm65_function_node"),
    ]

    operations = [
        migrations.RunSQL(
            repoint_ha_revision_relationship_concepts,
            revert_ha_revision_relationship_concepts,
        ),
    ]
