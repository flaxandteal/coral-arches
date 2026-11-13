import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import arches from 'arches';
import uuid from 'uuid';
import OpenWorkflow from 'viewmodels/open-workflow';
import pageTemplate from 'templates/views/components/plugins/open-risk-assessment-workflow.htm';

const openWorkflowViewModel = function (params) {
  OpenWorkflow.apply(this, [params]);
  this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
  this.smcTiles = ko.observableArray();
  this.selectedSMC = ko.observable();
  this.selectedHA = ko.observable();

  this.configKeys = ko.observable({ placeholder: 0 });

  // Filters the heritage-asset picker to resources whose Recommended
  // Designation (node 5aa9d22a-29c6-5de0-8119-84ee1e93081f, part of the
  // controlled-lists reference datatype migration) is "Scheduled Monument".
  this.stateMonumentString = `/search/resources?advanced-search=[{"op":"and","5aa9d22a-29c6-5de0-8119-84ee1e93081f":{"op":"eq","val":[{"uri":"https://coral-her.flaxandteal.co.uk/1e898077-9144-9ef0-b6e1-08f4e4881972"}]}}]`

  this.addtionalConfigData = ko.observable({
    parentTileIds: {},
    haId: [],
    resourceInstanceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
  });

  this.parentTileOptions = ko.observableArray();

  this.fetchTileData = async (resourceId, nodeId) => {
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
        (nodeId ? `?nodeid=${nodeId}` : '')
    );
    const data = await tilesResponse.json();
    return data.tiles;
  };

  this.searchRAs = async (resourceId) => {
    const searchResponse = await window.fetch(
        arches.urls.search_results + `?advanced-search=[{"op":"and","c3a76082-2a5e-11f0-9637-62d3208fcf53":{"op":"","val":["${resourceId}"]}}]`
    )
    const data = await searchResponse.json()
    return data.results.hits.hits;
  };

  this.getParentTileOptions = async (resourceId) => {
    const tiles = await this.searchRAs(resourceId);
    this.parentTileOptions(
      tiles.map((tile, idx) => {
        return {
          text: tile?._source.displayname,
          tile: tile,
          id: tile._id
        };
      })
    );
  };

  this.setAdditionalOpenConfigData = () => {
    localStorage.setItem(this.OPEN_WORKFLOW_CONFIG, JSON.stringify(this.addtionalConfigData()));
  };

  this.startNew = async () => {

    const associatedBuilding = {
        data: {"c3a76082-2a5e-11f0-9637-62d3208fcf53":this.addtionalConfigData().haId},
        nodegroup_id: 'c3a76082-2a5e-11f0-9637-62d3208fcf53',
        parenttile_id: null,
        resourceinstance_id: "",
        tileid: null,
        sortorder: 0
      };
      const associatedBuildingTile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(associatedBuilding),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await associatedBuildingTile.json()
      this.selectedResource(response.resourceinstance_id)
  }
  this.selectedHA.subscribe((resourceId) => {
    if (!resourceId) {
      this.parentTileOptions([]);
      this.selectedResource(null);
      return;
    }
    this.addtionalConfigData()['haId'] = [];
    for (const resource of resourceId){
      this.getParentTileOptions(resource);
      this.addtionalConfigData()['haId'].push({"resourceId":resource});
    }

    this.setAdditionalOpenConfigData()
  });

  this.selectedResource.subscribe(async (resourceId) => {

    if (!resourceId){
        return
    }
    this.addtionalConfigData()['resourceInstanceId'] = resourceId;
    const tileData = await this.fetchTileData(resourceId)
    this.smcTiles(tileData)
    this.setAdditionalOpenConfigData();
  });
};

export default ko.components.register('open-risk-assessment-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
