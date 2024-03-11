import os
import uuid
from arches.management.commands import utils
from arches.app.models import models
from django.core.management.base import BaseCommand, CommandError
from django.db.utils import IntegrityError
import json
import subprocess

dirname = os.path.dirname(__file__)


def call_command(command, message=None, show_output=False):
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        output = result.stdout
        error = result.stderr

        if show_output:
            print("Output:", output)
        if error:
            print("Error:", error)
        if message:
            print(message)

        return output

    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}: {e.stderr}")
    except Exception as e:
        print(f"An error occurred: {e}")


def get_available_plugins():
    folder_path = os.path.join(dirname, "..", "..", "plugins")
    available_plugins = []
    names_to_slugs = {}

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.endswith(".json"):
            with open(file_path, "r") as json_file:
                json_data = json.load(json_file)
                if "name" in json_data:
                    available_plugins.append(json_data["name"])
                    names_to_slugs[json_data["name"]] = json_data["slug"]

    return available_plugins, names_to_slugs


def get_available_widgets():
    folder_path = os.path.join(dirname, "..", "..", "widgets")
    available_widgets = []

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path) and filename.endswith(".json"):
            with open(file_path, "r") as json_file:
                json_data = json.load(json_file)
                if "name" in json_data:
                    available_widgets.append(json_data["name"])

    return available_widgets


def register_plugin(slug):
    print("Registering plugin: ", slug)
    source = os.path.join(dirname, "..", "..", "plugins", f"{slug}.json")
    details = {}

    with open(source) as f:
        details = json.load(f)

    try:
        uuid.UUID(details["pluginid"])
    except:
        details["pluginid"] = str(uuid.uuid4())
        print("Registering plugin with pluginid: {}".format(details["pluginid"]))

    instance = models.Plugin(
        pluginid=details["pluginid"],
        name=details["name"],
        icon=details["icon"],
        component=details["component"],
        componentname=details["componentname"],
        config=details["config"],
        slug=details["slug"],
        sortorder=details["sortorder"],
    )

    instance.save()
    print("Registered plugin: ", slug)


def unregister_plugin(name):
    print("Unregistering plugin: ", name)
    try:
        instance = models.Plugin.objects.get(name=name)
        instance.delete()
    except Exception as e:
        print(e)
    print("Unregistered plugin: ", name)


def update_plugin(slug):
    source = os.path.join(dirname, "..", "..", "plugins", f"{slug}.json")
    import json

    details = {}

    with open(source) as f:
        details = json.load(f)

    instance = models.Plugin.objects.get(name=details["name"])
    instance.icon = details["icon"]
    instance.component = details["component"]
    instance.componentname = details["componentname"]
    instance.config = details["config"]
    instance.save()


def register_widget(slug):
    print("Registering widget: ", slug)
    source = os.path.join(dirname, "..", "..", "widgets", f"{slug}.json")
    details = {}

    with open(source) as f:
        details = json.load(f)

    try:
        uuid.UUID(details["widgetid"])
    except:
        details["widgetid"] = str(uuid.uuid4())
        print("Registering widget with widgetid: {}".format(details["widgetid"]))

    instance = models.Widget(
        widgetid=details["widgetid"],
        name=details["name"],
        datatype=details["datatype"],
        helptext=details["helptext"],
        defaultconfig=details["defaultconfig"],
        component=details["component"],
    )

    instance.save()
    print("Registered widget: ", slug)


def unregister_widget(name):
    print("Unregistering widget: ", name)
    try:
        instances = models.Widget.objects.filter(name=name)
        instances[0].delete()
    except Exception as e:
        print(e)
    print("Unregistered widget: ", name)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("operation", nargs="?")

    def handle(self, *args, **options):
        if options["operation"] == "reload":
            self.reload_plugins_widgets()

    def reload_plugins_widgets(self, *args, **options):
        # TODO: Needs to validate the difference beween arches plugins/widgets
        # to avoid using an array of arches plugins/widgets in special cases

        registered_plugins = []
        registered_widgets = []
        try:
            registered_plugins = [
                instance.name for instance in models.Plugin.objects.all()
            ]
            registered_widgets = [
                instance.name for instance in models.Widget.objects.all()
            ]
        except Exception as e:
            raise e

        available_plugins, names_to_slugs = get_available_plugins()
        all_plugins = list(set(registered_plugins + available_plugins))

        available_widgets = get_available_widgets()
        all_widgets = list(set(registered_widgets + available_widgets))

        special_plugin_cases = ["Bulk Data Manager", "Image Service Manager"]
        for idx, plugin in enumerate(all_plugins):
            if plugin in special_plugin_cases:
                continue
            if plugin not in registered_plugins:
                register_plugin(names_to_slugs[plugin])
                has_plugin_change = True
                continue
            if plugin not in available_plugins:
                unregister_plugin(plugin)
                has_plugin_change = True
                continue

        special_widget_cases = [
            "file-widget",
            "resource-instance-select-widget",
            "concept-multiselect-widget",
            "rich-text-widget",
            "resource-instance-multiselect-widget",
            "domain-multiselect-widget",
            "concept-radio-widget",
            "domain-select-widget",
            "concept-checkbox-widget",
            "radio-boolean-widget",
            "datepicker-widget",
            "domain-checkbox-widget",
            "iiif-widget",
            "concept-select-widget",
            "text-widget",
            "node-value-select",
            "domain-radio-widget",
            "number-widget",
            "urldatatype",
            "edtf-widget",
            "map-widget",
            "switch-widget",
        ]
        for widget in all_widgets:
            if widget in special_widget_cases:
                continue
            if widget not in registered_widgets:
                register_widget(widget)
                has_widget_change = True
                continue
            if widget not in available_widgets:
                unregister_widget(widget)
                has_widget_change = True
                continue

        print("Updating: init-workflow")
        update_plugin("init-workflow")
        print("Updated: init-workflow")

        print("Updating: open-workflow")
        update_plugin("open-workflow")
        print("Updated: open-workflow")

        print("Plugins and widgets have been reloaded.")