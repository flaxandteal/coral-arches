define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-incident-report-workflow.htm'
  ], function ($, ko, koMapping, arches, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      console.log("OSCCS TEST: v13")
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
  
      this.incidentTiles = ko.observableArray();
      this.selectedIncidentReport = ko.observable();
  
      this.configKeys = ko.observable({ placeholder: 0 });
  
      this.addtionalConfigData = ko.observable({
        parentTileIds: {},
        heritageAssetId: [{}],
        resourceInstanceId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
      });
  
      this.parentTileOptions = ko.observableArray();

      this.fetchTileData = async (resourceId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
        );
        const data = await tilesResponse.json();
        return data.tiles;
      };
  
      this.searchSurveys = async (resourceId) => {
        console.log("searching", arches.urls.search_results)

        const searchResponse = await window.fetch(
            arches.urls.search_results + `?advanced-search=%5B%7B%22op%22%3A%22and%22%2C%2207428674-5020-11ef-b77e-0242ac120006%22%3A%7B%22op%22%3A%22%22%2C%22val%22%3A%22${resourceId}%22%7D%7D%5D&format=json`
        )
        console.log("response", searchResponse)
        const data = await searchResponse.json()
        console.log("hits", data.results.hits.hits)
        return data.results.hits.hits;
      };
  
      this.getParentTileOptions = async (resourceId) => {
        const tiles = await this.searchSurveys(resourceId);
        console.log("tiles ", tiles)
        this.parentTileOptions(
          tiles.map((tile, idx) => {
            return {
              text: tile?._source.displayname,
              tile: tile,
              id: tile._id
            };
          })
        );
        console.log("options", this.parentTileOptions)
      };
  
      this.setAdditionalOpenConfigData = () => {
        console.log("setAdditional", JSON.stringify(this.addtionalConfigData()))
        localStorage.setItem(this.OPEN_WORKFLOW_CONFIG, JSON.stringify(this.addtionalConfigData()));
      };
  
      this.selectedResource.subscribe((resourceId) => {
        if (!resourceId) {
          this.parentTileOptions([]);
          this.selectedIncidentReport(null);
          return;
        }
        this.getParentTileOptions(resourceId);
        this.addtionalConfigData()['heritageAssetId'] = [{"resourceId":resourceId}]
        this.setAdditionalOpenConfigData()

      });
  
      this.selectedIncidentReport.subscribe(async (resourceId) => {
        if (!resourceId){
            return
        }
        console.log("selected survey", resourceId)
        this.addtionalConfigData()['resourceInstanceId'] = resourceId;
        const tileData = await this.fetchTileData(resourceId)
        this.incidentTiles(tileData)
        console.log("Tile data ", tileData)
        
        this.setAdditionalOpenConfigData();
        console.log("The additional Data ", this.addtionalConfigData())
      });
    };
  
    return ko.components.register('open-state-care-condition-survey-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  