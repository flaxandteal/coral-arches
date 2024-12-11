define([
    'jquery',
    'knockout',
    'knockout-mapping',
    'arches',
    'uuid',
    'viewmodels/open-workflow',
    'templates/views/components/plugins/open-evaluation-meeting-workflow.htm'
  ], function ($, ko, koMapping, arches, uuid, OpenWorkflow, pageTemplate) {
    const openWorkflowViewModel = function (params) {
      OpenWorkflow.apply(this, [params]);
      this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';
      this.evmTiles = ko.observableArray();
      this.selectedEvaluationMeeting = ko.observable();
      this.selectedBuilding = ko.observable();

      this.buildingString = `/search/resources?advanced-search=[{\"op\"%3A\"and\"%2C\"2c2d02fc-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"158e1ed2-3aae-11ef-a2d0-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"1de9abf0-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"~\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}%2C\"250002fe-3aae-11ef-91fd-0242ac120003\"%3A{\"op\"%3A\"not_null\"%2C\"lang\"%3A\"en\"%2C\"val\"%3A\"\"}}]`

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
            arches.urls.search_results + `?advanced-search=[{"op"%3A"and"%2C"58a2b98f-a255-11e9-9a30-00224800b26d"%3A{"op"%3A""%2C"val"%3A["${resourceId}"]}}]&format=json`
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
            data: {"58a2b98f-a255-11e9-9a30-00224800b26d":this.addtionalConfigData().buildingId},
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
  
    return ko.components.register('open-evaluation-meeting-workflow', {
      viewModel: openWorkflowViewModel,
      template: pageTemplate
    });
  });
  