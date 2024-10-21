define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'uuid',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-state-care-condition-survey-workflow.htm'
  ], function ($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
      
      this.searchString = "/search/resources?advanced-search=[{\"op\"%3A\"and\"%2C\"158e1ed2-3aae-11ef-a2d0-0242ac120003\"%3A{\"op\"%3A\"not_null\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"1de9abf0-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"250002fe-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"2c2d02fc-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}}]"

      this.incidentTiles = ko.observableArray();
      this.selectedHeritageAsset = ko.observable();
  
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
        const searchResponse = await window.fetch(
            arches.urls.search_results + `?advanced-search=%5B%7B%22op%22%3A%22and%22%2C%2207428674-5020-11ef-b77e-0242ac120006%22%3A%7B%22op%22%3A%22%22%2C%22val%22%3A%22${resourceId}%22%7D%7D%5D&format=json`
        )
        const data = await searchResponse.json()
        return data.results.hits.hits;
      };
  
      this.getParentTileOptions = async (resourceId) => {
        const tiles = await this.searchSurveys(resourceId);
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
        const associatedHeritageAsset = {
            data: {"07428674-5020-11ef-b77e-0242ac120006":this.addtionalConfigData().heritageAssetId},
            nodegroup_id: '07428674-5020-11ef-b77e-0242ac120006',
            parenttile_id: null,
            resourceinstance_id: "",
            tileid: null,
            sortorder: 0
          };
    
          const associatedHeritageAssetTile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(associatedHeritageAsset),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await associatedHeritageAssetTile.json()
          this.selectedResource(response.resourceinstance_id)
      }
  
      this.selectedHeritageAsset.subscribe((resourceId) => {
        if (!resourceId) {
          this.parentTileOptions([]);
          this.selectedResource(null);
          return;
        }
        this.getParentTileOptions(resourceId);
        this.addtionalConfigData()['heritageAssetId'] = [{"resourceId":resourceId}]
        this.setAdditionalOpenConfigData()

      });
  
      this.selectedResource.subscribe(async (resourceId) => {
        if (!resourceId){
            return
        }
        this.addtionalConfigData()['resourceInstanceId'] = resourceId;
        const tileData = await this.fetchTileData(resourceId)
        this.incidentTiles(tileData)
        this.setAdditionalOpenConfigData();
      });
    };
  
    return ko.components.register('open-state-care-condition-survey-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  