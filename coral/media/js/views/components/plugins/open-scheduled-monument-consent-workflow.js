define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'uuid',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-scheduled-monument-consent-workflow.htm'
  ], function ($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
      this.evmTiles = ko.observableArray();
      this.selectedEvaluationMeeting = ko.observable();
      this.selectedBuilding = ko.observable();

      this.buildingString = `/search/resources?advanced-search=[{"op":"and","b37552be-9527-11ea-9213-f875a44e0e11":{"op":"~","lang":"en","val":"SMC"},"b37552bf-9527-11ea-9c87-f875a44e0e11":{"op":"~","lang":"en","val":""},"b37552bd-9527-11ea-97f4-f875a44e0e11":{"op":"eq","val":""}}]`;

      this.configKeys = ko.observable({ placeholder: 0 });
  
      this.addtionalConfigData = ko.observable({
        parentTileIds: {},
        buildingId: [{}],
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
  
      this.searchSiteVisits = async (resourceId) => {
        const searchResponse = await window.fetch(
            arches.urls.search_results + '?advanced-search=[{"op":"and","b37552be-9527-11ea-9213-f875a44e0e11":{"op":"~","lang":"en","val":"SMC"},"b37552bf-9527-11ea-9c87-f875a44e0e11":{"op":"~","lang":"en","val":""},"b37552bd-9527-11ea-97f4-f875a44e0e11":{"op":"eq","val":""}}]'
        )
        const data = await searchResponse.json()
        return data.results.hits.hits;
      };
  
      this.getParentTileOptions = async (resourceId) => {
        const tiles = await this.searchSiteVisits(resourceId);
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
            data: {"bc64746e-cf4a-11ef-997c-0242ac120007":this.addtionalConfigData().buildingId},
            nodegroup_id: 'bc64746e-cf4a-11ef-997c-0242ac120007',
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
      this.selectedBuilding.subscribe((resourceId) => {

        if (!resourceId) {
          this.parentTileOptions([]);
          this.selectedResource(null);
          return;
        }
        this.getParentTileOptions(resourceId);
        this.addtionalConfigData()['buildingId'] = [{"resourceId":resourceId}]
        this.setAdditionalOpenConfigData()
      });
  
      this.selectedResource.subscribe(async (resourceId) => {

        if (!resourceId){
            return
        }
        this.addtionalConfigData()['resourceInstanceId'] = resourceId;
        const tileData = await this.fetchTileData(resourceId)
        this.evmTiles(tileData)
        this.setAdditionalOpenConfigData();
      });
    };
  
    return ko.components.register('open-scheduled-monument-consent-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  