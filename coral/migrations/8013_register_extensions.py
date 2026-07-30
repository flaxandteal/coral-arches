"""Register coral's extensions from the files in this repo.

These were previously registered by hand (`manage.py widget register -s ...` etc)
on each environment, so a fresh DB came up missing whatever nobody remembered to
run. The arches register commands do an upsert when the json/py carries a fixed
uuid, so this is safe to re-run.
"""

from pathlib import Path

from django.core.management import call_command
from django.db import migrations

CORAL = Path(__file__).resolve().parent.parent

# (management command, glob relative to the coral app dir)
# widgets first: the datatype modules do Widget.objects.get(...) at import time
EXTENSIONS = [
    ("widget", "widgets/*.json"),
    ("datatype", "datatypes/*.py"),
    ("card_component", "pkg/card_components/*.json"),
    ("fn", "functions/*.py"),
    ("report", "reports/*.json"),
    ("plugin", "plugins/*.json"),
]


def register(apps, schema_editor):
    for command, pattern in EXTENSIONS:
        for source in sorted(CORAL.glob(pattern)):
            if source.name == "__init__.py":
                continue
            call_command(command, "register", "--source", str(source))


class Migration(migrations.Migration):

    dependencies = [
        ("coral", "8012_smm_notif_type"),
    ]

    operations = [
        migrations.RunPython(register, migrations.RunPython.noop),
    ]
