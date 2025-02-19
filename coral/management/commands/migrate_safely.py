import os, glob
import uuid
from arches.app.models.graph import Graph
from arches.app.models.models import FunctionXGraph
from arches.app.models.concept import Concept
from arches.app.models.concept import ConceptValue
from arches.app.models.models import Value
from django.core import management
from django.core.management.base import BaseCommand
import json
import datetime

class Command(BaseCommand):
    """Safely Migrate a model that may have conflicting changes.

    """
    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--operation",
            action="store",
            dest="operation",
            choices=[
                "migrate",
                "rehydrate_members",
                "remove_members"
            ],
            help="Operation Type; "
        )
        parser.add_argument(
            "-m",
            "--model_name",
        )
        parser.add_argument(
          "-r",
          "--reverse",
          action="store_true",
        )
        parser.add_argument(
          "-s",
          "--source",
          help="The path to the input file",
        )
        parser.add_argument(
          "-e",
          "--export",
          help="The path for the output file",
        )
        parser.add_argument(
          "-M",
          "--mapping",
          help="The path for the mapping file to convert node data",
        )

    def handle(self, *args, **options):
        if options["operation"] == "rehydrate_members":
          GroupTransform().rehydrate_members(options['source'])
        if options["operation"] == "remove_members":
          GroupTransform().remove_members()

        if options["operation"] == "migrate":
          if options["reverse"]:
            ScanForDataRisks().reverse_migration(options["model_name"])
          else:
            ScanForDataRisks().handle_model_update(options["model_name"], options["mapping"])
            pass

class ScanForDataRisks():
  """ This class should contain all of the functions needed to determine data migration risks """

  incoming_json = {}
  graphid = ""
  graph = None
  datatype_changes = {}
  mapping = {}

  def compare_nodes(self) -> tuple[list,list,dict]:
    """
    This determines changes to the model's nodes including new nodes, deleted nodes and datatype changes
    """
    new_nodes = []
    new_functions = []
    deleted_nodes = {}
    deleted_nodegroups = []
    updated_names = []
    updated_concepts = []
    new_concepts = []
    incoming_datatypes = {}
    current_datatypes = {}
    datatype_changes = {}
    incoming_option_ids = {}

    incoming_json = self.incoming_json

    graphid = self.graphid
    incoming_nodes = incoming_json['graph'][0]['nodes']
    incoming_nodegroups = incoming_json['graph'][0]['nodegroups']
    incoming_functions = incoming_json['graph'][0]['functions_x_graphs']
    current_nodes = self.graph.nodes.values()
    current_nodegroups = self.graph.get_nodegroups()
    current_functions = FunctionXGraph.objects.filter(graph_id = self.graphid)
    
    # map the node ids into a dict
    current_node_map = {str(n.nodeid): n for n in current_nodes} 

    for node in incoming_nodes:
      node_id = node["nodeid"]
      node_name = node["name"]
      node_datatype = node["datatype"]
      nodegroup_id = node["nodegroup_id"]
      
      if node_id not in current_node_map: 
          new_nodes.append(node_id)
      else:  
          old_node = current_node_map[node_id]

          # Track datatype changes
          incoming_datatypes[node_id] = node_datatype
          if node_datatype in ("domain-value", "domain-value-list"):
              incoming_option_ids[node_id] = [o["id"] for o in node["config"]["options"]]

          # Track name changes
          if old_node.name != node_name:
              updated_names.append({
                  "nodeid": node_id,
                  "old_name": old_node.name,
                  "new_name": node_name
              })

          # Track change in concept
          if node_datatype in ("concept", "concept-list") and current_node_map[node_id].datatype in ("concept", "concept-list"):
             concept = node["config"]["rdmCollection"]
             old_concept = current_node_map[node_id].config['rdmCollection']
             if concept != old_concept:
              def get_concept_value(concept_id):
                try:
                  return Concept().get(concept_id).get_preflabel().value
                except Exception as e:
                   print(f"{e}")
                   new_concepts.append(concept)
                   return "This concept needs to be registered"

              updated_concepts.append({
                  "concept_id": concept,
                  "value": get_concept_value(concept),
                  "old_concept_id": old_concept,
                  "old_value": get_concept_value(old_concept),
                  "node_id": node_id,
                  "node_name": node_name,
                  "nodegroup": nodegroup_id
              })

    for node_json in current_nodes:
      if str(node_json.nodeid) not in incoming_datatypes.keys():
        deleted_nodes[node_json.alias] = str(node_json.nodeid)
      else:
        current_datatypes[str(node_json.nodeid)] = node_json.datatype   

    for nodegroup in current_nodegroups:
      if str(nodegroup.nodegroupid) not in list(map(lambda ng: str(ng['nodegroupid']), incoming_nodegroups)):
        deleted_nodegroups.append(str(nodegroup.nodegroupid))
    
    for function in incoming_functions:
      if function['function_id'] not in list(map(lambda f : str(f.function_id), current_functions)):
        new_functions.append(function['function_id'])

    # if performance is an issue we can incorprate this into the previous for loop. The extra loop is just a way to ensure we don't get key errors from new or deleted nodes.
    for nodeid in incoming_datatypes.keys():
      if incoming_datatypes[nodeid] != current_datatypes[nodeid]:
        incoming_node = [node for node in incoming_nodes if node['nodeid'] == nodeid][0]
        current_node = self.graph.nodes[uuid.UUID(nodeid)]
        datatype_changes[nodeid] = {
          "from_datatype": current_datatypes[nodeid],
          "to_datatype": incoming_datatypes[nodeid],
        }

        if current_datatypes[nodeid] == 'domain-value' or current_datatypes[nodeid] == 'domain-value-list':
          datatype_changes[nodeid]['domain_options'] = current_node.config['options']

        if incoming_datatypes[nodeid] == 'domain-value' or incoming_datatypes[nodeid] == 'domain-value-list':
          datatype_changes[nodeid]['domain_options'] = incoming_node['config']['options']

        if current_datatypes[nodeid] == 'concept' or current_datatypes[nodeid] == 'concept-list':
          concept_keys = ("conceptid", "text", "id")
          collection_id = current_node.config['rdmCollection']
          datatype_changes[nodeid]['concept_options'] = list(map(lambda concept: {concept_keys[i] : concept[i] for i, _ in enumerate(concept)}, Concept().get_child_collections(collection_id)))

        if incoming_datatypes[nodeid] == 'concept' or incoming_datatypes[nodeid] == 'concept-list':
          concept_keys = ("conceptid", "text", "id")
          collection_id = incoming_node['config']['rdmCollection']
          datatype_changes[nodeid]['concept_id'] = collection_id
          concept_list = list(map(lambda concept: {concept_keys[i] : concept[i] for i, _ in enumerate(concept)}, Concept().get_child_collections(collection_id)))
          if len(concept_list) == 0:
            new_concepts.append(incoming_node['config']['rdmCollection']) 
          datatype_changes[nodeid]['concept_options'] = concept_list

    return new_nodes, deleted_nodes, deleted_nodegroups, datatype_changes, new_functions, updated_names, new_concepts, updated_concepts

  def handle_datatype_changes(self, tile_json, datatype_changes: dict):
    for node in tile_json['data']:
      if node in datatype_changes.keys():
        change = datatype_changes[node]
        if change['from_datatype'] == 'string':
          if change['to_datatype'] == 'date':
            tile_json = TransformData().string_to_date(tile_json, node)
          if change['to_datatype'] == 'domain-value':
            tile_json = TransformData().string_to_domain_value(tile_json, node)

        if change['from_datatype'] == 'domain-value':
          if change['to_datatype'] == 'domain-value-list':
            tile_json = TransformData().allow_many(tile_json, node)
          if change['to_datatype'] == 'concept':
            tile_json = TransformData().domain_to_concept(tile_json, change, node)
          if change['to_datatype'] == 'concept-list':
            tile_json = TransformData().domain_to_concept(tile_json, change, node)
            tile_json = TransformData().allow_many(tile_json, node)

        if change['from_datatype'] == 'concept':
          if change['to_datatype'] == 'concept-list':
            tile_json = TransformData().allow_many(tile_json, node)
          if change['to_datatype'] == 'domain-value':
            tile_json = TransformData().concept_to_domain(tile_json, change, node)
          if change['to_datatype'] == 'domain-value-list':
            tile_json = TransformData().concept_to_domain(tile_json, change, node)
            tile_json = TransformData().allow_many(tile_json, node)

        if change['from_datatype'] == 'resource-instance':
          if change['to_datatype'] == 'resource-instance-list':
            tile_json = TransformData().allow_many(tile_json, node)
    return tile_json

  def handle_deleted_nodes(self, tile_json, deleted_nodes):
    for node in list(tile_json['data'].keys()):
      if node in deleted_nodes.values():
        tile_json = TransformData().remove_nodes(tile_json, deleted_nodes)
    return tile_json

  def handle_deleted_nodegroups(self, tile_json, deleted_nodegroups):
    for value in list(tile_json.values()):
      if value in deleted_nodegroups:
        return True
    return False
  
  def handle_concept_change(self, tile_json, updated_concepts):
    for node in list(tile_json['data'].keys()):
      if node in [concept["node_id"] for concept in updated_concepts]:
          mapping = next(value for key, value in self.mapping.items() if key == node)
          print("tile", tile_json)
          print("node", node)
          TransformData().concept_to_concept(tile_json, node, mapping)
     

  def handle_data_change_messages(self, new_nodes, deleted_nodes, deleted_nodegroups, new_functions, updated_names, new_concepts, updated_concepts):
    nodes = self.graph.nodes.values()

    # Print the current state with headings
    print("\n\nDATA CHANGES")
    
    print("\nNew Nodes:")
    if new_nodes:
        for node in new_nodes:
            print(node)
    else:
        print("No new nodes added")

    print("\nNew Functions:")
    if new_functions:
        for node in new_functions:
            print(node)
    else:
        print("No new functions added")

    print("\nNew Concepts:")
    if new_concepts:
        for concept in new_concepts:
            print(f"{concept}")
    else:
        print("No new concepts")

    print("\nUpdated Node Names:")
    if updated_names:
        for node in updated_names:
            print(f"{node['nodeid']}: {node['old_name']} -> {node['new_name']}")
    else:
        print("No names changed")

    print("\nUpdated Concepts:")
    if updated_concepts:
        for concept in updated_concepts:
            print(f"\nNode: {concept['node_id']} ({concept['node_name']}):")
            print(f"Concept: {concept['old_concept_id']} ({concept['old_value']}) -> {concept['concept_id']} ({concept['value']})")
    else:
        print("No updated concepts")
    
    print("\nDeleted Nodes:")
    if deleted_nodes:
        for alias, node in deleted_nodes.items():
            print(f"{alias}: {node}")
    else:
        print("No nodes deleted")

    print("\nDeleted Nodegroups:")
    if deleted_nodegroups:
        for nodegroup in deleted_nodegroups:
            alias = next((n.alias for n in nodes if str(n.nodegroup_id) == nodegroup), None)
            print(f"{alias}: {nodegroup}")
    else:
        print("No nodes deleted")

    print("\nDatatype Changes:")
    if self.datatype_changes:
        for key, value in self.datatype_changes.items():
            alias = next((n.alias for n in nodes if str(n.nodeid) == key), None)
            print(f"{key} ({alias}): {value['from_datatype']} -> {value['to_datatype']}")
    else:
        print("No data changes")

  def handle_model_update(self, model_name, mapping=None):
    model_path = f'coral/pkg/graphs/resource_models/{model_name}.json'
    with open(model_path) as incoming_json:
      file_contents = incoming_json.read()

    self.incoming_json = json.loads(file_contents)
    self.graphid = self.incoming_json['graph'][0]['graphid']
    self.graph = Graph.objects.get(pk=self.graphid)
    if mapping:
       with open(mapping, 'r') as file:
            self.mapping = json.load(file)

    try:
      management.call_command("packages",
          operation="export_graphs",
          graphs=self.graphid,
          format="json",
          dest_dir="."
      )
      os.rename(f"{model_name}.json", f"backup_{model_name}.json")
    except Exception as e:
      print(f"Error during export {e}")
      input("\nError occurred when exporting. You will not have a backup model. \n\nDo you want to continue?")
    
    sanitised_model_name = model_name.replace(' ', '_')
    management.call_command("packages",
        operation="export_business_data",
        graphs=self.graphid,
        format="json",
        dest_dir="."
    )

    os.rename(glob.glob(f'{sanitised_model_name}*.json')[0], f'stale_data_{sanitised_model_name}.json')

    new_nodes, deleted_nodes, deleted_nodegroups, self.datatype_changes, new_functions, updated_names, new_concepts, updated_concepts = self.compare_nodes()

    self.handle_data_change_messages(new_nodes, deleted_nodes, deleted_nodegroups, new_functions, updated_names, new_concepts, updated_concepts)

    if self.datatype_changes == {} and len(deleted_nodes) == 0 and len(deleted_nodegroups) == 0 and len(updated_concepts) == 0:
      input("\nContinue with deleting and updating the graphs and data?")

      
      self.graph.delete_instances()
      self.graph.delete()
      management.call_command("packages",
        operation="import_graphs",
        source=f"coral/pkg/graphs/resource_models/{model_name}.json"
        )
      
      management.call_command("packages",
            operation="import_business_data",
            source=f"stale_data_{sanitised_model_name}.json",
            overwrite="overwrite",
            prevent_indexing=False,
            escape_function=True
        )
    else:
      # Pause and ask for user input to continue
      input("\nPress Enter to continue with the data conversion...")

      with open(f"stale_data_{sanitised_model_name}.json") as incoming_business_data:
        file_contents = incoming_business_data.read()
      stale_business_data = json.loads(file_contents)
      stale_resources = stale_business_data['business_data']['resources']
      for resource in stale_resources:
        stale_tiles = resource['tiles']
        for tile in stale_tiles:
          if self.datatype_changes != {}:
            tile = self.handle_datatype_changes(tile, self.datatype_changes)
          if len(deleted_nodes) > 0:
            tile = self.handle_deleted_nodes(tile, deleted_nodes)
          if len(updated_concepts) > 0:
             tile = self.handle_concept_change(tile, updated_concepts)
        
        # filter the tiles to remove the deleted node group tiles
        if len(deleted_nodegroups) > 0:
          resource['tiles'] = [tile for tile in stale_tiles if tile['nodegroup_id'] not in deleted_nodegroups]

      with open(f'transformed_{sanitised_model_name}.json', 'w') as f:
        json.dump(stale_business_data, f)

      input("\nConversion Complete \n\nContinue with deleting and updating the graphs and data?")

      self.graph.delete_instances()
      self.graph.delete()
      management.call_command("packages",
        operation="import_graphs",
        source=f"coral/pkg/graphs/resource_models/{model_name}.json"
        )
      
      management.call_command("packages",
            operation="import_business_data",
            source=f"transformed_{sanitised_model_name}.json",
            overwrite="overwrite",
            prevent_indexing=False,
            escape_function=True
        ) 
      
  def reverse_migration(self, model_name):
    sanitised_model_name = model_name.replace(' ', '_')
    with open(f"backup_{model_name}.json") as backup_json:
      file_contents = backup_json.read()
    backup_json = json.loads(file_contents)
    self.graphid = backup_json['graph'][0]['graphid']
    try:
      self.graph = Graph.objects.get(pk=self.graphid)
    except:
      print(f"Graph with id {self.graphid} not found.")

    if self.graph:
      self.graph.delete_instances()
      self.graph.delete()
      
    management.call_command("packages",
      operation="import_graphs",
      source=f"backup_{model_name}.json"
      )
    management.call_command("packages",
          operation="import_business_data",
          source=f"stale_data_{sanitised_model_name}.json",
          overwrite="overwrite",
          prevent_indexing=False,
          escape_function=True
      )

class TransformData():
  """
  This class should contain all of the transformation functions
  """
  def string_to_date(self, tile_json, nodeid):
    # i believe stuart has made this already
    return tile_json

  def string_to_domain_value(self, tile_json, nodeid):
    # not urgent
    return tile_json

  def domain_to_concept(self, tile_json, change, nodeid):
    mapping = {}
    if tile_json['data'][nodeid] == None or tile_json['data'][nodeid] == "":
      return tile_json
    for option in change['domain_options']:
      matching_option = [opt for opt in change['concept_options'] if opt['text'] == option['text']][0]
      mapping[option['id']] = matching_option['id']
    tile_json['data'][nodeid] = mapping[tile_json['data'][nodeid]]
    return tile_json
  
  def concept_to_domain(self, tile_json, change, nodeid):
    mapping = {}
    if tile_json['data'][nodeid] == None or tile_json['data'][nodeid] == "":
      return tile_json
    for option in change['concept_options']:
        matching_option = [opt for opt in change['domain_options'] if opt['text']['en'] == option['text']][0]
        mapping[option['id']] = matching_option['id']
    tile_json['data'][nodeid] = mapping[tile_json['data'][nodeid]]
    return tile_json

  def remove_nodes(self, tile_json: dict, deleted_nodes: dict):
    try:
      for node_id in deleted_nodes.values():
          if node_id in tile_json.get("data", {}):
              del tile_json["data"][node_id]
      return tile_json
    except Exception as e:
        print(f"An error occurred: {e}")

  def allow_many(self, tile_json, nodeid):
    tile_json['data'][nodeid] = [tile_json['data'][nodeid]]
    return tile_json
  
  def concept_to_concept(self, tile_json, node, mapping):
      if mapping:
        current_value = ConceptValue().get(tile_json['data'][node]).conceptid
        new_value = Value.objects.filter(concept_id = mapping[current_value], valuetype = 'prefLabel').first().valueid
        # Need to add some error checking when nothing in mapping and for when the new concept hasn't been uploaded
        if new_value:
          tile_json['data'][node] = str(new_value)
        else:
          tile_json['data'][node] = None
      else:
         print("No mapping file provided")
         return
    
  
class GroupTransform():
  """
  This class contains functions to transform the Groups
  """

  MEMBER_NODE = "bb2f7e1c-7029-11ee-885f-0242ac140008"
  GROUP_ID = "07883c9e-b25c-11e9-975a-a4d18cec433a"
  
  def rehydrate_members(self, input_file_path):
    """ 
    Add the members in the current environment into the updated groups

    This requires importing the updated groups without any members into the current environment.

    Parameters:
      input_file_path (str): The path to the updated groups without members
    """
    try:
        # Read the JSON file
        with open(input_file_path, 'r') as file:
            data = json.load(file)

        group_ids = []
        new_members = []

        resource_instances = data.get("business_data", {}).get("resources", [])

        # Get id's for the groups
        for resource in resource_instances:
            group_ids.append(resource['resourceinstance']['resourceinstanceid'])

        # Export the current group data with the members
        management.call_command("packages",
            operation="export_business_data",
            graphs=self.GROUP_ID,
            format="json",
            dest_dir="coral/pkg/business_data/files"
        )
        
        files = glob.glob('coral/pkg/business_data/files/Group_*.json')
        if files:
            latest_file = max(files, key=os.path.getmtime)
            today = datetime.datetime.today().strftime('%Y-%m-%d_%H-%M-%S')
            group_with_members = os.path.join(os.path.dirname(latest_file), f"backup_Previous_Group_with_members_{today}.json")
            os.rename(latest_file, group_with_members)
        
            with open(group_with_members, 'r') as new_file:
                new_data = json.load(new_file)

            # gets the members from the groups that aren't the groups - will be person models  
            new_resource_instances = new_data.get("business_data", {}).get("resources", [])
            for resource in new_resource_instances:    
                for tile in resource["tiles"]:
                    if self.MEMBER_NODE in tile["data"]:
                        members = [{'value': member, 'groupId': resource['resourceinstance']["resourceinstanceid"]} for member in (tile["data"].get(self.MEMBER_NODE)or []) if member['resourceId'] not in group_ids]
                        new_members.extend(members)
        
        for resource in resource_instances:    
            for tile in resource["tiles"]:
                if self.MEMBER_NODE in tile["data"]:
                    if tile["data"][self.MEMBER_NODE]: 
                        if len(new_members) > 0:
                            match = next((item for item in new_members if item['groupId'] == resource['resourceinstance']["resourceinstanceid"]), None)
                            if match:
                                tile["data"][self.MEMBER_NODE].append(match['value'])
                                


        data['business_data']['resources'] = resource_instances

        output_file_path = f"coral/pkg/business_data/files/Updated_Groups_{today}.json"

        # Write the updated JSON to a new file
        with open(output_file_path, 'w') as file:
            json.dump(data, file, indent=4)
        
        graph = Graph.objects.get(pk=self.GROUP_ID)

        graph.delete_instances()
        
        management.call_command("packages",
            operation="import_business_data",
            source=output_file_path,
            overwrite="overwrite",
            prevent_indexing=False,
            escape_function=True
        )

    except Exception as e:
        print(f"An error occurred: {e}")

  def remove_members(self):
    """ 
    Remove the Person instances from the current groups
    
    This will remove all Person instances set in the groups members without removing any link between groups.
    """
    try:
        management.call_command("packages",
            operation="export_business_data",
            graphs=self.GROUP_ID,
            format="json",
            dest_dir="coral/pkg/business_data/files"
        )

        files = glob.glob('coral/pkg/business_data/files/Group_*.json')
        if files:
            latest_file = max(files, key=os.path.getmtime)
            today = datetime.datetime.today().strftime('%Y-%m-%d_%H-%M-%S')
            group_with_members = os.path.join(os.path.dirname(latest_file), f"backup_Group_with_members_{today}.json")
            os.rename(latest_file, group_with_members)

            # Read the JSON file
            with open(group_with_members, 'r') as file:
                data = json.load(file)

            group_ids = []

            resource_instances = data.get("business_data", {}).get("resources", [])
            resource_instances = [resource for resource in resource_instances if resource['resourceinstance']["name"] != "Undefined"]

            for resource in resource_instances:
                group_ids.append(resource['resourceinstance']['resourceinstanceid'])
            for resource in resource_instances:    
                for tile in resource["tiles"]:
                    if self.MEMBER_NODE in tile["data"]:
                        if tile["data"][self.MEMBER_NODE]:
                            tile["data"][self.MEMBER_NODE] = [member for member in tile["data"][self.MEMBER_NODE] if member['resourceId'] in group_ids] 

            data['business_data']['resources'] = resource_instances

            output_file_path = f"coral/pkg/business_data/files/Empty_Groups_{today}.json"

            # Write the updated JSON to a new file
            with open(output_file_path, 'w') as file:
                json.dump(data, file, indent=4)

    except Exception as e:
        print(f"An error occurred: {e}")