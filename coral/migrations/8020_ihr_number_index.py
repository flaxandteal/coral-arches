from django.db import migrations

IHR_NUMBER_NODE_ID = "0b14fb28-961e-5817-9cac-c61073b58981"
REFERENCES_NODEGROUP_ID = "ebd91984-e3fd-5dcd-b8e0-42d63cda77fc"

# The expression must match what Django's data__<node>__en__value lookup generates.
create_index = f"""
    CREATE INDEX CONCURRENTLY IF NOT EXISTS tiles_ihr_number_en_value_idx
    ON tiles ((tiledata #> '{{{IHR_NUMBER_NODE_ID},en,value}}'))
    WHERE nodegroupid = '{REFERENCES_NODEGROUP_ID}';
    """
drop_index = "DROP INDEX CONCURRENTLY IF EXISTS tiles_ihr_number_en_value_idx;"


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("coral", "8019_sync_group_permissions_function"),
    ]

    operations = [
        migrations.RunSQL(create_index, drop_index),
    ]
