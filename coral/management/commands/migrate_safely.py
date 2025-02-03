import os, glob
import uuid
from arches.app.models.graph import Graph
from arches.app.models.models import FunctionXGraph
from arches.app.models.concept import Concept
from django.core import management
from django.core.management.base import BaseCommand
import json
import pdb

class Command(BaseCommand):
    """Safely Migrate a model that may have conflicting changes.

    """
    def add_arguments(self, parser):
        parser.add_argument(
            "-m",
            "--model_name",
    )
        parser.add_argument(
          "-r",
          "--reverse",
          action="store_true",
        )

    def handle(self, *args, **options):
        if options["reverse"]:
          ScanForDataRisks().reverse_migration(options["model_name"])
        else:
          ScanForDataRisks().handle_model_update(options["model_name"])
          pass

class ScanForDataRisks():
  """ This class should contain all of the functions needed to determine data migration risks """

  incoming_json = {}
  graphid = ""
  graph = None
  datatype_changes = {}

  def compare_nodes(self) -> tuple[list,list,dict]:
    """
    This determines changes to the model's nodes including new nodes, deleted nodes and datatype changes
    """
    new_nodes = []
    new_functions = []
    deleted_nodes = {}
    deleted_nodegroups = []
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

    for node in incoming_nodes:
      if node['nodeid'] not in list(map(lambda n : str(n.nodeid), current_nodes)):
        new_nodes.append(node['nodeid'])
      else:
        incoming_datatypes[node['nodeid']] = node['datatype']
        if node['datatype'] == 'domain-value' or node['datatype'] == 'domain-value-list':
          incoming_option_ids[node['nodeid']] = list(map(lambda o: o['id'], node['config']['options']))

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
          datatype_changes[nodeid]['concept_options'] = list(map(lambda concept: {concept_keys[i] : concept[i] for i, _ in enumerate(concept)}, Concept().get_child_collections(collection_id)))

    return new_nodes, deleted_nodes, deleted_nodegroups, datatype_changes, new_functions

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

  def handle_data_change_messages(self, new_nodes, deleted_nodes, deleted_nodegroups, new_functions):
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

  def handle_model_update(self, model_name):
    model_path = f'coral/pkg/graphs/resource_models/{model_name}.json'
    with open(model_path) as incoming_json:
      file_contents = incoming_json.read()

    self.incoming_json = json.loads(file_contents)
    self.graphid = self.incoming_json['graph'][0]['graphid']
    self.graph = Graph.objects.get(pk=self.graphid)

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

    new_nodes, deleted_nodes, deleted_nodegroups, self.datatype_changes, new_functions = self.compare_nodes()

    self.handle_data_change_messages(new_nodes, deleted_nodes, deleted_nodegroups, new_functions)

    if self.datatype_changes == {} and len(deleted_nodes) == 0 and len(deleted_nodegroups) == 0:
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