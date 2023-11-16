import os
import uuid
import json
import sys


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


def generate_files(user_provided_name):
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
  'templates/views/components/plugins/{user_provided_name}.htm',
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
                  componentName: 'initial-step',
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
    create_file(htm_file_path, htm_content)
    create_file(js_file_path, js_content)

    # Update init-workflow.json file
    update_init_workflow_file(user_provided_name, plugin_id)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/generate_new_workflow.py {user-provided-name}")
        sys.exit(1)

    user_provided_name = sys.argv[1]
    generate_files(user_provided_name)
    print(
        f"Files generated and init-workflow.json updated for '{user_provided_name}' successfully."
    )
