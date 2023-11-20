import uuid
import json
import sys
import subprocess


def create_file(file_path, content):
    with open(file_path, "w") as file:
        file.write(content)


def generate_uuid():
    return str(uuid.uuid4())


def update_init_workflow_file(user_provided_name, plugin_id):
    init_workflow_file_path = "coral/coral/plugins/init-workflow.json"

    # Read existing init-workflow.json file
    with open(init_workflow_file_path, "r") as file:
        data = json.load(file)

    # Append a new object to the config.workflows array
    new_workflow = {
        "workflowid": plugin_id,
        "slug": user_provided_name,
        "name": user_provided_name,
        "icon": "fa fa-check",
        "bgColor": "#8096ba",
        "circleColor": "#a3b5d4",
        "desc": "Please provide a description for this workflow",
    }

    data["config"]["workflows"].append(new_workflow)

    # Write the updated JSON back to the init-workflow.json file
    with open(init_workflow_file_path, "w") as file:
        json.dump(data, file, indent=2)


def call_command(command, description, show_output=False):
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
        if description:
            print(description)

    except subprocess.CalledProcessError as e:
        # If the command returns a non-zero exit code, an exception is raised
        print(f"Command failed with exit code {e.returncode}: {e.stderr}")
    except Exception as e:
        # Handle other exceptions
        print(f"An error occurred: {e}")


def generate_files(user_provided_name, use_default_htm=True):
    if "workflow" not in user_provided_name:
        user_provided_name += "-workflow"

    # File paths
    json_file_path = f"coral/coral/plugins/{user_provided_name}.json"
    htm_file_path = (
        f"coral/coral/templates/views/components/plugins/{user_provided_name}.htm"
    )
    js_file_path = (
        f"coral/coral/media/js/views/components/plugins/{user_provided_name}.js"
    )

    # Generate new UUID for plugin_id
    plugin_id = generate_uuid()

    # Content for files
    json_content = f"""
{{
  "pluginid": "{plugin_id}",
  "name": "{user_provided_name}",
  "icon": "fa fa-check",
  "component": "views/components/plugins/{user_provided_name}",
  "componentname": "{user_provided_name}",
  "config": {{
    "show": false
  }},
  "slug": "{user_provided_name}",
  "sortorder": 0
}}
"""

    htm_content = """
{% extends "views/components/plugins/workflow.htm" %}
{% load i18n %}
"""

    js_content = f"""
define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/{'default-workflow' if use_default_htm else user_provided_name}.htm',
], function (ko, arches, EditableWorkflow, workflowTemplate) {{
  return ko.components.register('{user_provided_name}', {{
    viewModel: function (params) {{
      this.componentName = '{user_provided_name}';
      this.stepConfig = [
        {{
          title: 'Initialise Workflow',
          name: 'init-step',
          required: true,
          layoutSections: [
            {{
              componentConfigs: [
                {{
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {{
                    graphid: '',
                    nodegroupid: ''
                  }}
                }}
              ]
            }}
          ]
        }},
      ];

      EditableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    }},
    template: workflowTemplate
  }});
}});
"""

    # Create files
    create_file(json_file_path, json_content)
    if not use_default_htm:
        create_file(htm_file_path, htm_content)
    create_file(js_file_path, js_content)
    print("New files have been created")

    # Update init-workflow.json file
    update_init_workflow_file(user_provided_name, plugin_id)

    # Register new workflow
    call_command(
        command=f"docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py plugin register -s coral/plugins/{user_provided_name}.json'",
        description="New workflow has been registered",
    )

    # Update init workflow
    call_command(
        command=f"docker exec -ti coral-arches_arches_1 bash -c 'source ../ENV/bin/activate && python manage.py plugin update -s coral/plugins/init-workflow.json'",
        description="Init workflow has been updated with new workflow",
    )

    # Rebuild webpack
    print("Rebuilding webpack...")
    call_command(
        command=f"docker exec -ti coral-arches_arches_1 /bin/sh -c '. ../ENV/bin/activate; cd coral; DJANGO_MODE=DEV NODE_PATH=./media/node_modules NODE_OPTIONS=--max_old_space_size=8192 node --inspect ./media/node_modules/.bin/webpack --config webpack/webpack.config.dev.js'",
        description="Webpack finished rebuilding",
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/generate_new_workflow.py {workflow-slug}")
        sys.exit(1)

    user_provided_name = sys.argv[1]
    generate_files(user_provided_name)
    print(
        f"Files generated and init-workflow.json updated for '{user_provided_name}' successfully."
    )
