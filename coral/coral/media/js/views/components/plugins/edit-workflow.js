define([
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/edit-workflow.htm'
], function (ko, koMapping, arches, editWorkflowTemplate) {
  const editWorkflow = function (params) {
    this.WORKFLOW_LABEL = 'workflow-slug';
    this.WORKFLOW_EDIT_MODE_LABEL = 'workflow-edit-mode';

    this.editableWorkflows = params.editableWorkflows;
    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();
    this.workflowSlug = ko.observable();
    this.workflow = ko.observable();
    this.graphId = ko.observable();
    this.loading = ko.observable(false);

    this.getWorkflowSlug = () => {
      let searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(this.WORKFLOW_LABEL);
    };

    this.getWorkflowData = () => {
      return this.editableWorkflows.find((workflow) => workflow.slug === this.workflowSlug());
    };

    this.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.selectedResource.subscribe(async (value) => {
      if (value) {
        /**
         * TODO: Current hardcoded to only edit licensing workflows,
         * would be interesting to investigate editing all workflows
         * from the same edit workflow page.
         */
        this.loading(true);
        await this[this.workflow().setupFunction](value);
        this.loading(false);
      }
    });

    /**
     * It seems like there will need to be a custom resolver method
     * for each type of workflow that requires multiple dependacies.
     * All that needs to be done is have all the nodegroup tiles populated
     * into local storage and then have the related resource's nodegroups
     * also populated into to local storage.
     */
    this.loadLicenseData = async (licenseResourceId) => {
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
      const activityTiles = await this.fetchTileData(
        relatedActivitiesTile.data['a9f53f00-48b6-11ee-85af-0242ac140007'][0].resourceId
      );
      const actLocTile = activityTiles.find(
        (tile) => tile.nodegroup === 'a5416b49-f121-11eb-8e2c-a87eeabdefba'
      );
      activityTiles.forEach((tile) => {
        let nodegroupId = tile.nodegroup;
        const externalRefSource = tile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'];
        if (externalRefSource === '19afd557-cc21-44b4-b1df-f32568181b2c') {
          nodegroupId += '|cm-ref'; // This is set to match the unique instance name from the workflow
        }
        if (externalRefSource === 'df585888-b45c-4f48-99d1-4cb3432855d5') {
          nodegroupId += '|asset-ref'; // This is set to match the unique instance name from the workflow
        }
        if (externalRefSource === 'c14def6d-4713-465f-9119-bc33f0d6e8b3') {
          nodegroupId += '|pow-ref'; // This is set to match the unique instance name from the workflow
        }
        result[nodegroupId] = {
          value: JSON.stringify({
            tileData: koMapping.toJSON(tile.data),
            resourceInstanceId: tile.resourceinstance,
            tileId: tile.tileid,
            nodegroupId: tile.nodegroup
          })
        };
      });
      licenseTiles.forEach((tile) => {
        const value = {
          tileData: koMapping.toJSON(tile.data),
          resourceInstanceId: tile.resourceinstance,
          tileId: tile.tileid,
          nodegroupId: tile.nodegroup
        };
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && actLocTile) {
          value['actLocTileId'] = actLocTile.tileid;
          value['actResourceId'] = actLocTile.resourceinstance;
        }
        result[tile.nodegroup] = {
          value: JSON.stringify(value)
        };
      });
      localStorage.setItem('workflow-component-abstracts', JSON.stringify(result));
    };

    this.editWorkflow = () => {
      localStorage.setItem(this.WORKFLOW_EDIT_MODE_LABEL, JSON.stringify(true));
    };

    this.init = () => {
      console.log('Init edit workflow: ', params);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.graphId(this.workflow().graphId);
    };

    this.init();
  };

  return ko.components.register('edit-workflow', {
    viewModel: editWorkflow,
    template: editWorkflowTemplate
  });
});
