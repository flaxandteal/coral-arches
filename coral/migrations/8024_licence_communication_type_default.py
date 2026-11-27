from django.db import migrations

COMMUNICATION_TYPE_NODE = "68411f12-48ce-11ee-8e4e-0242ac140007"
EMAIL_ITEM = "084c4ed7-e6c5-4af4-be0f-7fe5d20375a0"
# The v7 concept id for Email.
V7_EMAIL = "0f466b8b-a347-439f-9b61-bee9811ccbf0"


def forward(apps, schema_editor):
    """Communication Type is hidden on the licensing Communications step but required, so it needs a working default.

    Arches 8 reads a new tile's defaults from the node config; the v7 default sat on the widget config.
    """
    from coral.utils.reference_values import reference_value

    Node = apps.get_model("models", "Node")
    CardXNodeXWidget = apps.get_model("models", "CardXNodeXWidget")
    ListItem = apps.get_model("arches_controlled_lists", "ListItem")
    node = Node.objects.filter(nodeid=COMMUNICATION_TYPE_NODE).first()
    if node is None or not ListItem.objects.filter(id=EMAIL_ITEM).exists():
        return
    email = reference_value(EMAIL_ITEM)
    node.config["defaultValue"] = email
    node.save()
    for widget in CardXNodeXWidget.objects.filter(node_id=COMMUNICATION_TYPE_NODE):
        if widget.config.get("defaultValue") == V7_EMAIL:
            widget.config["defaultValue"] = email
            widget.save()


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8023_letter_template_lists"),
        ("arches_controlled_lists", "__latest__"),
    ]

    operations = [
        migrations.RunPython(forward, migrations.RunPython.noop),
    ]
