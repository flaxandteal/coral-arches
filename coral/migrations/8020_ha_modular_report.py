import json
from pathlib import Path

from django.db import migrations

HA_GRAPH = "076f9381-7b00-11e9-8d6b-80000b44d1d9"
MODULAR_TEMPLATE = "b0908227-ecc2-48dd-931b-314a9031caa0"
KNOCKOUT_TEMPLATE = "523a5a7f-006b-4caf-a801-a1621967a88b"
CONFIG_FILE = Path(__file__).resolve().parent.parent / "report_configs" / "heritage_asset.json"


def ha_report_is_installable(schema_editor):
    connection = schema_editor.connection
    if "arches_modular_report_config" not in connection.introspection.table_names():
        return False
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1 FROM graphs WHERE graphid = %s", [HA_GRAPH])
        return cursor.fetchone() is not None


def set_template(schema_editor, templateid):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "UPDATE graphs SET templateid = %s WHERE graphid = %s",
            [templateid, HA_GRAPH],
        )
        # Arches 8 renders from the published graph, so it needs the template too.
        cursor.execute(
            """
            UPDATE published_graphs
            SET serialized_graph = jsonb_set(serialized_graph, '{template_id}', to_jsonb(%s::text))
            WHERE publicationid = (SELECT publicationid FROM graphs WHERE graphid = %s)
            """,
            [templateid, HA_GRAPH],
        )


def forwards(apps, schema_editor):
    # A fresh build migrates before load_package, so the graph may not exist yet.
    if not ha_report_is_installable(schema_editor):
        return
    ReportConfig = apps.get_model("arches_modular_reports", "ReportConfig")
    config = json.loads(CONFIG_FILE.read_text())["configs"]["default"]
    ReportConfig.objects.update_or_create(
        graph_id=HA_GRAPH, slug="default", defaults={"config": config}
    )
    set_template(schema_editor, MODULAR_TEMPLATE)


def backwards(apps, schema_editor):
    if not ha_report_is_installable(schema_editor):
        return
    ReportConfig = apps.get_model("arches_modular_reports", "ReportConfig")
    ReportConfig.objects.filter(graph_id=HA_GRAPH, slug="default").delete()
    set_template(schema_editor, KNOCKOUT_TEMPLATE)


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8019_sync_group_permissions_function"),
        ("arches_modular_reports", "0008_update_nodevalue_db_call"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
