define([
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/edit-workflow.htm'
], function (ko, koMapping, arches, editWorkflowTemplate) {
  const editWorkflow = function (params) {
    console.log('Init edit workflow: ', params);

    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();

    this.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.selectedResource.subscribe(async (value) => {
      if (value) {
        console.log('selectedResource: ', value);
        /**
         * TODO: Current hardcoded to only edit licensing workflows,
         * would be interesting to investigate editing all workflows
         * from the same edit workflow page.
         */
        await this.loadLicensingData(value);
        this.workflowUrl(arches.urls.plugin('licensing-workflow'));
      }
    });

    /**
     * It seems like there will need to be a custom resolver method
     * for each type of workflow that requires multiple dependacies.
     * All that needs to be done is have all the nodegroup tiles populated
     * into local storage and then have the related resource's nodegroups
     * also populated into to local storage.
     */
    this.loadLicensingData = async (licenseResourceId) => {
      const licenseTiles = await this.fetchTileData(licenseResourceId);
      const result = {};
      licenseTiles.forEach((tile) => {
        result[tile.nodegroup] = {
          value: JSON.stringify({
            tileData: koMapping.toJSON(tile.data),
            resourceInstanceId: tile.resourceinstance,
            tileId: tile.tileid,
            nodegroupId: tile.nodegroup
          })
        };
      });
      const relatedActivitiesTile = licenseTiles.find(
        (tile) => tile.nodegroup === 'a9f53f00-48b6-11ee-85af-0242ac140007'
      );
      console.log('relatedActivitiesTile: ', relatedActivitiesTile);
      const activityTiles = await this.fetchTileData(
        relatedActivitiesTile.data['a9f53f00-48b6-11ee-85af-0242ac140007'][0].resourceId
      );
      console.log('activityTiles: ', activityTiles);
      activityTiles.forEach((tile) => {
        result[tile.nodegroup] = {
          value: JSON.stringify({
            tileData: koMapping.toJSON(tile.data),
            resourceInstanceId: tile.resourceinstance,
            tileId: tile.tileid,
            nodegroupId: tile.nodegroup
          })
        };
      });
      localStorage.setItem('workflow-component-abstracts', JSON.stringify(result));
    };

    this.openWorkflow = () => {
      console.log('Open workflow: ', this.selectedResource());
      localStorage.setItem('workflow-edit-mode', JSON.stringify(true));
      // window.location.href = arches.urls.plugin('licensing-workflow');
    };
  };

  return ko.components.register('edit-workflow', {
    viewModel: editWorkflow,
    template: editWorkflowTemplate
  });
});
