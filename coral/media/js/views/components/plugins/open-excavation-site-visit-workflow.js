define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'uuid',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-excavation-site-visit-workflow.htm'
  ], function ($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
  
      this.incidentTiles = ko.observableArray();
      this.selectedActivity = ko.observable();
  
      this.configKeys = ko.observable({ placeholder: 0 });

      this.licenceString = `search/resources?advanced-search=[{"op":"and","879fc326-02f6-11ef-927a-0242ac150006":{"op":"not_null","val":""}}]`
  
      this.addtionalConfigData = ko.observable({
        parentTileIds: {},
        activityId: [{}],
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
  
      this.searchSiteVisits = async (resourceId) => {
        const searchResponse = await window.fetch(
            arches.urls.search_results + `?advanced-search=[{"op"%3A"and"%2C"ea059ab7-83d7-11ea-a3c4-f875a44e0e11"%3A{"op"%3A""%2C"val"%3A["${resourceId}"]}}%2C{"op"%3A"and"%2C"e7d69603-9939-11ea-9e7f-f875a44e0e11"%3A{"op"%3A"~"%2C"lang"%3A"en"%2C"val"%3A"ESV"}%2C"e7d69604-9939-11ea-baef-f875a44e0e11"%3A{"op"%3A"~"%2C"lang"%3A"en"%2C"val"%3A""}%2C"e7d69602-9939-11ea-b514-f875a44e0e11"%3A{"op"%3A"eq"%2C"val"%3A""}}]&format=json`
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
        const associatedActivity = {
            data: {"ea059ab7-83d7-11ea-a3c4-f875a44e0e11":this.addtionalConfigData().activityId},
            nodegroup_id: 'ea059ab7-83d7-11ea-a3c4-f875a44e0e11',
            parenttile_id: null,
            resourceinstance_id: "",
            tileid: null,
            sortorder: 0
          };
          const associatedActivityTile = await window.fetch(arches.urls.api_tiles(uuid.generate()), {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(associatedActivity),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const response = await associatedActivityTile.json()
          this.selectedResource(response.resourceinstance_id)
      }
  
      this.selectedActivity.subscribe((resourceId) => {
        if (!resourceId) {
          this.parentTileOptions([]);
          this.selectedResource(null);
          return;
        }
        this.getParentTileOptions(resourceId);
        this.addtionalConfigData()['activityId'] = [{"resourceId":resourceId}]
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
  
    return ko.components.register('open-excavation-site-visit-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  