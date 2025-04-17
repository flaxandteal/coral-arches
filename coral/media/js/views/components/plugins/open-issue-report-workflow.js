define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'viewmodels/open-workflow',
  'templates/views/components/plugins/open-issue-report-workflow.htm'
], function ($, ko, koMapping, arches, OpenWorkflow, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    OpenWorkflow.apply(this, [params]);

    this.OPEN_WORKFLOW_CONFIG = 'open-workflow-config';

    this.issueTiles = ko.observableArray();
    this.selectedIssueReport = ko.observable();

    this.configKeys = ko.observable({ placeholder: 0 });

    this.addtionalConfigData = ko.observable({
      parentTileIds: {}
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

    this.getParentTileOptions = async (resourceId) => {
      const tiles = await this.fetchTileData(resourceId, '20017860-d711-11ee-9dd0-0242ac120006');
      this.parentTileOptions(
        tiles.map((tile, idx) => {
          return {
            text: tile?.data['2001a33a-d711-11ee-9dd0-0242ac120006']?.en?.value,
            tile: tile,
            id: tile.parenttile
          };
        })
      );
    };

    this.setAdditionalOpenConfigData = () => {
      localStorage.setItem(this.OPEN_WORKFLOW_CONFIG, JSON.stringify(this.addtionalConfigData()));
    };

    this.selectedResource.subscribe(async (resourceId) => {
      if (!resourceId) {
        this.parentTileOptions([]);
        this.selectedIssueReport(null);
        return;
      }
      this.getParentTileOptions(resourceId);
    });

    this.selectedIssueReport.subscribe((tileId) => {
      this.addtionalConfigData()['parentTileIds']['d3ff3fe6-d62b-11ee-9454-0242ac180006'] = tileId;
      this.setAdditionalOpenConfigData();
    });
  };

  return ko.components.register('open-issue-report-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
});
