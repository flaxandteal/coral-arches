from django.db import migrations

FUNCTION_ID = "76f71d97-f1bf-4b83-a355-7ab8d309d71f"
FUNCTION_X_GRAPH_ID = "8b5b5c27-7af1-4d54-acd5-a69a0b955a3d"
GROUP_GRAPHID = "07883c9e-b25c-11e9-975a-a4d18cec433a"
MEMBERS = "bb2f7e1c-7029-11ee-885f-0242ac140008"
ARCHES_PLUGINS = "160d28c8-6789-11ef-baee-0242ac120006"

add_function = f"""
    INSERT INTO functions (functionid, functiontype, name, description, defaultconfig, modulename, classname, component)
    VALUES (
        '{FUNCTION_ID}', 'node', 'Sync Group Permissions',
        'Updates Casbin memberships and plugin rules for a Group when its members or plugins change',
        '{{"triggering_nodegroups": ["{MEMBERS}", "{ARCHES_PLUGINS}"]}}',
        'sync_group_permissions.py', 'SyncGroupPermissions', ''
    )
    ON CONFLICT (functionid) DO NOTHING;
    -- Migrations run before load_package, so a fresh install has no Group graph yet; it gets this row from the package.
    INSERT INTO functions_x_graphs (id, functionid, graphid, config)
    SELECT
        '{FUNCTION_X_GRAPH_ID}', '{FUNCTION_ID}', '{GROUP_GRAPHID}',
        '{{"triggering_nodegroups": ["{MEMBERS}", "{ARCHES_PLUGINS}"]}}'
    WHERE EXISTS (SELECT 1 FROM graphs WHERE graphid = '{GROUP_GRAPHID}')
    ON CONFLICT DO NOTHING;
    """
remove_function = f"""
    DELETE FROM functions_x_graphs WHERE id = '{FUNCTION_X_GRAPH_ID}';
    DELETE FROM functions WHERE functionid = '{FUNCTION_ID}';
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8018_dedupe_historical_periods"),
    ]

    operations = [
        migrations.RunSQL(add_function, remove_function),
    ]
