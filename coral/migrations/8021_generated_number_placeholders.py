from django.db import migrations

GENERATED_NODES = """(
    '8009174e-67df-51b7-83ee-17db75100a08',
    '039aaf6d-59d4-57a9-bf87-245ec8913130',
    '91fc174d-d278-5be0-b8ff-f547877b1e4e',
    '5937558a-48ea-5cee-bb41-7ac52e7e27f2'
)"""


def set_placeholder(old, new):
    return f"""
    UPDATE cards_x_nodes_x_widgets
    SET config = jsonb_set(config, '{{placeholder}}', '{{"en": "{new}"}}')
    WHERE nodeid IN {GENERATED_NODES} AND config->'placeholder'->>'en' = '{old}';
    """


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8020_ihr_number_index"),
    ]

    operations = [
        migrations.RunSQL(
            set_placeholder("Enter text", "Auto-generated field"),
            set_placeholder("Auto-generated field", "Enter text"),
        ),
    ]
