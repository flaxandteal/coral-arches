define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'uuid',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-risk-assessment-workflow.htm'
  ], function ($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
      this.smcTiles = ko.observableArray();
      this.selectedSMC = ko.observable();
      this.selectedHA = ko.observable();

      this.configKeys = ko.observable({ placeholder: 0 });

      this.stateMonumentString = "/search/resources?advanced-search=[{\"op\":\"and\",\"7c639efc-fa6b-11ef-b578-ae394b224c56\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b69e-efc5-11eb-801e-a87eeabdefba\":{\"op\":\"~\",\"lang\":\"en\",\"val\":\"\"},\"6af2b697-efc5-11eb-8152-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"74ef37e0-37b5-11ef-9263-0242ac150006\":{\"op\":\"eq\",\"val\":\"\"},\"74ef37e0-37b5-11ef-9263-a1a88c0bb289\":{\"op\":\"eq\",\"val\":\"\"},\"6af2a0ce-efc5-11eb-88d1-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"21c50f53-3922-0246-8fe8-bf640be2b8e8\"},\"5782bd48-6aa6-11ef-b483-5e5ea193fa45\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b696-efc5-11eb-b0b5-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b6a3-efc5-11eb-af76-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b69b-efc5-11eb-8d5a-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b6a0-efc5-11eb-985a-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2a0d0-efc5-11eb-ab44-a87eeabdefba\":{\"op\":\"~\",\"lang\":\"en\",\"val\":\"\"},\"6af2a0cf-efc5-11eb-806d-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b698-efc5-11eb-9eeb-a87eeabdefba\":{\"op\":\"eq\",\"val\":\"\"},\"6af2b6a4-efc5-11eb-b5d4-a87eeabdefba\":{\"op\":\"~\",\"val\":\"\"},\"f4c393ac-6aa6-11ef-b483-5e5ea193fa45\":{\"op\":\"~\",\"lang\":\"en\",\"val\":\"\"}}]"
  
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
  
    return ko.components.register('open-risk-assessment-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  