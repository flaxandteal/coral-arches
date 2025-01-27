import os, fnmatch, glob
import uuid
from arches.management.commands import utils
from arches.app.models.graph import Graph
from arches.app.models.concept import Concept
from django.urls import reverse
from django.core import management
from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
import subprocess
import json
import arches_orm
import requests

class Command(BaseCommand):
    """Safely Migrate a model that may have conflicting changes.

    """

    print_statistics = False

    def add_arguments(self, parser):
        parser.add_argument(
            "-m",
            "--model_name",
        )


    def handle(self, *args, **options):
        print("DEBUGGER, HANLDLING COMMAND")
        ScanForDataRisks().handle_model_update(options["model_name"])
        pass

class ScanForDataRisks():
  """ This class should contain all of the functions needed to determine data migration risks """

  incoming_json = {}
  graphid = ""
  datatype_changes = {}

  def compare_nodes(self, model_name: str) -> tuple[list,list,dict]:
    """
    This determines changes to the model's nodes including new nodes, deleted nodes and datatype changes
    """
    new_nodes = []
    deleted_nodes = []
    incoming_datatypes = {}
    current_datatypes = {}
    datatype_changes = {}
    incoming_option_ids = {}

    incoming_json = self.incoming_json

    graphid = self.graphid
    incoming_nodes = incoming_json['graph'][0]['nodes']
    current_nodes = Graph.objects.get(pk=graphid).nodes.values()

    for node in incoming_nodes:
      if node['nodeid'] not in list(map(lambda n : str(n.nodeid), current_nodes)):
        new_nodes.append(node['nodeid'])
      else:
        incoming_datatypes[node['nodeid']] = node['datatype']
        if node['datatype'] == 'domain-value' or node['datatype'] == 'domain-value-list':
          incoming_option_ids[node['nodeid']] = list(map(lambda o: o['id'], node['config']['options']))

    for node_json in current_nodes:
      if str(node_json.nodeid) not in incoming_datatypes.keys():
        deleted_nodes.append(str(node_json.nodeid))
      else:
        current_datatypes[str(node_json.nodeid)] = node_json.datatype

    # if performance is an issue we can incorprate this into the previous for loop. The extra loop is just a way to ensure we don't get key errors from new or deleted nodes.
    for nodeid in incoming_datatypes.keys():
      if incoming_datatypes[nodeid] != current_datatypes[nodeid]:
        datatype_changes[nodeid] = {
          "from_datatype": current_datatypes[nodeid],
          "to_datatype": incoming_datatypes[nodeid]
        }
        if current_datatypes[nodeid] == 'domain-value' or current_datatypes[nodeid] == 'domain-value-list':
          datatype_changes[nodeid]['domain_options'] = current_nodes[nodeid]['config']['options']
        if incoming_datatypes[nodeid] == 'domain-value' or incoming_datatypes[nodeid] == 'domain-value-list':
          datatype_changes[nodeid]['domain_options'] = node['config']['options']
        if current_datatypes[nodeid] == 'concept' or current_datatypes[nodeid] == 'concept-list':
          concept_keys = ("conceptid", "text", "id")
          collection_id = current_nodes[nodeid]['config']['rdmCollection']
          datatype_changes[nodeid]['concept_options'] = list(map(lambda concept: {concept_keys[i] : concept[i] for i, _ in enumerate(concept)}, Concept().get_child_collections(collection_id)))

        if incoming_datatypes[nodeid] == 'concept' or incoming_datatypes[nodeid] == 'concept-list':
          concept_keys = ("conceptid", "text", "id")
          collection_id = incoming_nodes[nodeid]['config']['rdmCollection']
          datatype_changes[nodeid]['concept_options'] = list(map(lambda concept: {concept_keys[i] : concept[i] for i, _ in enumerate(concept)}, Concept().get_child_collections(collection_id)))

    return new_nodes, deleted_nodes, datatype_changes

  def handle_datatype_changes(self, tile_json, datatype_changes: dict):
    for node in tile_json['data']:
      if node['nodeid'] in datatype_changes.keys():
        change = datatype_changes[node['nodeid']]
        if change['from_datatype'] == 'string':
          if change['to_datatype'] == 'date':
            tile_json = TransformData().string_to_date(tile_json, node['nodeid'])
          if change['to_datatype'] == 'domain-value':
            tile_json = TransformData().string_to_domain_value(tile_json, node['nodeid'])

        if change['from_datatype'] == 'domain-value':
          if change['to_datatype'] == 'concept':
            tile_json = TransformData().domain_to_concept(tile_json, change, node['nodeid'])
          if change['to_datatype'] == 'domain-value-list':
            tile_json = TransformData().allow_many(tile_json, node['nodeid'])

        if change['from_datatype'] == 'concept':
          if change['to_datatype'] == 'concept-list':
            tile_json = TransformData().allow_many(tile_json, node['nodeid'])

  def handle_model_update(self, model_name):
    print("DEBUGGER, HANDLE MODEL CHANGE", model_name)
    model_path = f'coral/pkg/graphs/resource_models/{model_name}.json'
    with open(model_path) as incoming_json:
      file_contents = incoming_json.read()


    self.incoming_json = json.loads(file_contents)
    self.graphid = self.incoming_json['graph'][0]['graphid']

    management.call_command("packages",
        operation="export_graphs",
        graphs=self.graphid,
        format="json",
        dest_dir="."
    )
    os.rename(f"{model_name}.json", f"backup_{model_name}.json")
    
    management.call_command("packages",
        operation="export_business_data",
        graphs=self.graphid,
        format="json",
        dest_dir="."
    )

    os.rename(glob.glob(f'{model_name}*.json')[0], f'stale_data_{model_name}.json')

    new_nodes, deleted_nodes, self.datatype_changes = self.compare_nodes(model_name)

    print("DATATYPE CHANGES", self.datatype_changes)
    if self.datatype_changes == {}:
      print("NO SIGNIFICANT DATA CHANGES")
      graph = Graph.objects.get(pk=self.graphid)
      print("deleting", graph)
      graph.delete()
      management.call_command("packages",
        operation="import_graphs",
        source=f"coral/pkg/graphs/resource_models/{model_name}.json"
        )
      
      management.call_command("packages",
            operation="import_business_data",
            source=f"stale_data_{model_name}.json",
            overwrite="overwrite"
        )
    else:
      with open(f"stale_data_{model_name}.json") as incoming_business_data:
        file_contents = incoming_business_data.read()
      stale_business_data = json.loads(file_contents)



    





class TransformData():
  """
  This class should contain all of the transformation functions
  """
  def string_to_date(tile_json, nodeid):
    # i believe stuart has made this already
    return tile_json

  def string_to_domain_value(tile_json, nodeid):
    # not urgent
    return tile_json

  def domain_to_concept(tile_json, change, nodeid):
    mapping = {}
    for option in change['domain_options']:
      matching_option = [opt for opt in change['concept_options'].items() if opt['text'] == option['text']][0]
      mapping[option['id']] = matching_option['conceptid']

    tile_json['data'][nodeid] = mapping[tile_json['data'][nodeid]]
    return tile_json

  def allow_many(tile_json, nodeid):
    tile_json['data'][nodeid] = [tile_json['data'][nodeid]]
    return tile_json