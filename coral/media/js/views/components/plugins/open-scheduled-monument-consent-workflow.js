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
      this.smcTiles = ko.observableArray();
      this.selectedSMC = ko.observable();
      this.selectedHA = ko.observable();

      this.configKeys = ko.observable({ placeholder: 0 });

      this.smrSearchString = `/search/resources?advanced-search=[{"op":"and","2c2d02fc-3aae-11ef-91fd-0242ac120003":{"op":"~","lang":"en","val":""},"1de9abf0-3aae-11ef-91fd-0242ac120003":{"op":"~","lang":"en","val":""},"158e1ed2-3aae-11ef-a2d0-0242ac120003":{"op":"not_null","lang":"en","val":""},"250002fe-3aae-11ef-91fd-0242ac120003":{"op":"~","lang":"en","val":""}}]`;
  
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
  
      this.searchSMCs = async (resourceId) => {
        const searchResponse = await window.fetch(
            arches.urls.search_results + `?advanced-search=[{"op":"and","b37552be-9527-11ea-9213-f875a44e0e11":{"op":"~","lang":"en","val":"SMC"},"b37552bf-9527-11ea-9c87-f875a44e0e11":{"op":"~","lang":"en","val":""},"b37552bd-9527-11ea-97f4-f875a44e0e11":{"op":"eq","val":""}},{"op":"and","58a2b98f-a255-11e9-9a30-00224800b26d":{"op":"","val":["${resourceId}"]}}]`
        )
        const data = await searchResponse.json()
        return data.results.hits.hits;
      };
  
      this.getParentTileOptions = async (resourceId) => {
        const tiles = await this.searchSMCs(resourceId);
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
            data: {"58a2b98f-a255-11e9-9a30-00224800b26d":this.addtionalConfigData().haId},
            nodegroup_id: '58a2b98f-a255-11e9-9a30-00224800b26d',
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
        this.getParentTileOptions(resourceId);
        this.addtionalConfigData()['haId'] = [];
        for (const resource of resourceId){
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
  
    return ko.components.register('open-scheduled-monument-consent-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  