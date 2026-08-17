import glob
import json
import os
import uuid

from arches.app.models import models
from django.core.management.base import BaseCommand
from django.db import connection

dirname = os.path.dirname(__file__)


def coral_dir(*parts):
    return os.path.join(dirname, "..", "..", *parts)


def reload_extensions(subdir, model, id_field, fields):
    """
    Upsert every JSON file in coral/<subdir>/ into the database, keyed on the id
    declared in the file itself.

    Local-development refresh only: it registers what is new and updates what has
    changed. It never deletes. A row absent from coral's manifest may belong to
    Arches core or to an installed Arches application, and nothing records which
    rows coral registered, so "absent from my manifest" cannot mean "delete it".
    Retire a coral plugin or widget by removing its row by hand.
    """
    for path in sorted(glob.glob(coral_dir(subdir, "*.json"))):
        filename = os.path.basename(path)
        with open(path) as f:
            details = json.load(f)

        try:
            extension_id = str(uuid.UUID(str(details.get(id_field))))
        except (TypeError, ValueError):
            print(f"Skipping {subdir}/{filename}: no valid {id_field}")
            continue

        _, created = model.objects.update_or_create(
            **{id_field: extension_id},
            defaults={field: details[field] for field in fields if field in details},
        )
        action = "Registered" if created else "Updated"
        print(f"{action} {subdir}/{filename}")


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("operation", nargs="?")

    def handle(self, *args, **options):
        if options["operation"] == "reload":
            self.reload_plugins_widgets()
        elif options["operation"] == "reload_reports":
            self.reload_reports()

    def reload_plugins_widgets(self, *args, **options):
        reload_extensions(
            "plugins",
            models.Plugin,
            "pluginid",
            ["name", "icon", "component", "componentname", "config", "slug", "sortorder"],
        )
        reload_extensions(
            "widgets",
            models.Widget,
            "widgetid",
            ["name", "datatype", "helptext", "defaultconfig", "component"],
        )
        print("Plugins and widgets have been reloaded.")

    def reload_reports(self):
        reload_extensions(
            "reports",
            models.ReportTemplate,
            "templateid",
            [
                "name",
                "description",
                "component",
                "componentname",
                "defaultconfig",
                "preload_resource_data",
            ],
        )

        sql_file = coral_dir("pkg", "post_sql", "load_report_templates.sql")
        if os.path.exists(sql_file):
            with open(sql_file) as f:
                sql = f.read()
            with connection.cursor() as cursor:
                cursor.execute(sql)
            print("Applied graph-to-template mappings from load_report_templates.sql")
        else:
            print(f"Warning: {sql_file} not found, skipping graph template mapping")

        print("Report templates reloaded.")
