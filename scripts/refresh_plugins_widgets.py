import subprocess
import re
import os
import json


def call_command(command, message=None, show_output=False):
    try:
        # Run the command and capture the output
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Access the output and error (if any)
        output = result.stdout
        error = result.stderr

        # Print the output and error
        if show_output:
            print("Output:", output)
        if error:
            print("Error:", error)
        if message:
            print(message)

        return output

    except subprocess.CalledProcessError as e:
        # If the command returns a non-zero exit code, an exception is raised
        print(f"Command failed with exit code {e.returncode}: {e.stderr}")
    except Exception as e:
        # Handle other exceptions
        print(f"An error occurred: {e}")


def get_available_plugins():
    folder_path = "coral/coral/plugins"
    available_plugins = []
    names_to_slugs = {}

    # Iterate through all files in the folder
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)

        # Check if the file is a JSON file
        if os.path.isfile(file_path) and filename.endswith(".json"):
            # Open and load the JSON file
            with open(file_path, "r") as json_file:
                json_data = json.load(json_file)

                # Check if the 'name' field exists in the JSON data
                if "name" in json_data:
                    available_plugins.append(json_data["name"])
                    names_to_slugs[json_data["name"]] = json_data["slug"]

    # print(available_plugins)
    return available_plugins, names_to_slugs


def get_registered_plugins():
    listed_plugins = call_command(
        command="docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py plugin list'",
    )

    # Use regex to find the items after the specified message
    matches = re.search(
        r"(?<=URL namespace \'oauth2\' isn\'t unique\.)\s*([\s\S]*$)", listed_plugins
    )

    # Remove leading and trailing whitespace from each match
    registered_plugins = [
        item.strip() for item in matches.group(1).split("\n") if item.strip()
    ]

    registered_plugins = registered_plugins[1:-1]

    # print(registered_plugins)
    return registered_plugins


def register_type(plugin, type):
    call_command(
        command=f"docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py {type} register -s coral/plugins/{plugin}.json'",
        message=f"Registered plugin: {plugin}",
    )


def unregister_type(plugin, type):
    call_command(
        command=f"docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py {type} unregister -n \"{plugin}\"'",
        message=f"Unregistered plugin: {plugin}",
    )


def get_registered_widgets():
    listed_plugins = call_command(
        command="docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py widget list'",
    )

    # Use regex to find the items after the specified message
    matches = re.search(
        r"(?<=URL namespace \'oauth2\' isn\'t unique\.)\s*([\s\S]*$)", listed_plugins
    )

    # Remove leading and trailing whitespace from each match
    registered_widgets = [
        item.strip() for item in matches.group(1).split("\n") if item.strip()
    ]

    registered_widgets = registered_widgets[1:-1]

    # print(registered_widgets)
    return registered_widgets


def get_available_widgets():
    folder_path = "coral/coral/widgets"
    available_widgets = []
    names_to_slugs = {}

    # Iterate through all files in the folder
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)

        # Check if the file is a JSON file
        if os.path.isfile(file_path) and filename.endswith(".json"):
            # Open and load the JSON file
            with open(file_path, "r") as json_file:
                json_data = json.load(json_file)

                # Check if the 'name' field exists in the JSON data
                if "name" in json_data:
                    available_widgets.append(json_data["name"])

    # print(available_widgets)
    return available_widgets


if __name__ == "__main__":
    registered_plugins = get_registered_plugins()
    available_plugins, names_to_slugs = get_available_plugins()

    all_plugins = list(set(registered_plugins + available_plugins))

    has_change = False
    special_cases = ["Bulk Data Manager", "Image Service Manager"]
    for idx, plugin in enumerate(all_plugins):
        if plugin in special_cases:
            continue
        if plugin not in registered_plugins:
            register_type(names_to_slugs[plugin], "plugin")
            has_change = True
            continue
        if plugin not in available_plugins:
            unregister_type(plugin, "plugin")
            has_change = True
            continue

    registered_widgets = get_registered_widgets()
    available_widgets = get_available_widgets()

    all_widgets = list(set(registered_widgets + available_widgets))

    special_cases = [
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
        if widget not in registered_widgets:
            register_type(widget, "widget")
            has_change = True
            continue
        if widget not in available_widgets:
            unregister_type(widget, "widget")
            has_change = True
            continue

    if has_change:
        print("Rebuilding webpack...")
        call_command(
            command=f"docker exec -ti coral-arches_arches_1 /bin/sh -c '. ../ENV/bin/activate; cd coral; DJANGO_MODE=DEV NODE_PATH=./media/node_modules NODE_OPTIONS=--max_old_space_size=8192 node --inspect ./media/node_modules/.bin/webpack --config webpack/webpack.config.dev.js'",
            message="Webpack finished rebuilding",
        )

    print("Finished refresh!")
