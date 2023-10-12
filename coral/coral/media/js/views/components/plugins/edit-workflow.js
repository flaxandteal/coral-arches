define([
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/edit-workflow.htm'
], function (ko, koMapping, arches, editWorkflowTemplate) {
  const editWorkflow = function (params) {
    this.WORKFLOW_LABEL = 'workflow-slug';
    this.WORKFLOW_EDIT_MODE_LABEL = 'workflow-edit-mode';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';
    this.WORKFLOW_RECENTLY_EDITED_LABEL = 'workflow-recently-edited';

    this.editableWorkflows = params.editableWorkflows;
    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();
    this.workflowSlug = ko.observable();
    this.workflow = ko.observable();
    this.graphId = ko.observable();
    this.loading = ko.observable(false);

    this.resourceName = ko.observable();
    this.recentlyEdited = ko.observable();

    this.recentlyEditedResources = ko.computed(() => {
      const items = this.recentlyEdited()?.[this.workflowSlug()];
      return items ? Object.values(items) : [];
    }, this);

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

    this.getNameFromNodeId = (tiles, nodeId) => {
      const tile = tiles.find((tile) => nodeId in tile.data);
      return tile?.display_values.find((dv) => dv.nodeid === nodeId)?.value || '';
    };

    this.loadResourceData = async (resourceId) => {
      this.loading(true);
      const componentData = await this[this.workflow().setupFunction](resourceId);
      localStorage.setItem(this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL, JSON.stringify(componentData));
      this.loading(false);
    };

    /**
     * TODO: Refactor this into utility methods to make it easier
     * to create more setup functions.
     */
    this.loadLicenseData = async (licenseResourceId) => {
      const manyTilesManagedNodegroups = {
        '6840f820-48ce-11ee-8e4e-0242ac140007': [],
        'a5416b46-f121-11eb-8f2d-a87eeabdefba': []
      };
      const licenseTiles = await this.fetchTileData(licenseResourceId);
      this.resourceName(
        this.getNameFromNodeId(licenseTiles, '59d6676c-48b9-11ee-84da-0242ac140007')
      );
      const componentData = {};
      const licenseDigitalFiles = licenseTiles.find(
        (tile) => tile.nodegroup === '8c5356f4-48ce-11ee-8e4e-0242ac140007'
      );
      if (licenseDigitalFiles) {
        const licenseDigitalFilesTiles = await this.fetchTileData(
          licenseDigitalFiles.data['8c5356f4-48ce-11ee-8e4e-0242ac140007'][0].resourceId
        );
        licenseDigitalFilesTiles.forEach((tile) => {
          if (tile.nodegroup === '7db68c6c-8490-11ea-a543-f875a44e0e11') {
            componentData[tile.nodegroup + `|file-upload`] = {
              value: JSON.stringify({
                tileData: koMapping.toJSON(tile.data),
                resourceInstanceId: tile.resourceinstance,
                tileId: tile.tileid,
                nodegroupId: tile.nodegroup
              })
            };
          }
        });
      }
      const relatedActivitiesTile = licenseTiles.find(
        (tile) => tile.nodegroup === 'a9f53f00-48b6-11ee-85af-0242ac140007'
      );
      /**
       * FIXME: Currently dosen't support multiple associated activities.
       * Needs a search implemented to find an activity with the same system
       * reference ID assigned to the License.
       */
      const activityTiles = await this.fetchTileData(
        relatedActivitiesTile.data['a9f53f00-48b6-11ee-85af-0242ac140007'][0].resourceId
      );
      const actLocTile = activityTiles.find(
        (tile) => tile.nodegroup === 'a5416b49-f121-11eb-8e2c-a87eeabdefba'
      );
      activityTiles.forEach((tile) => {
        if (tile.nodegroup in manyTilesManagedNodegroups) {
          manyTilesManagedNodegroups[tile.nodegroup].push(tile);
          return;
        }
        let nodegroupId = tile.nodegroup;
        
        if (tile.nodegroup in manyTilesManagedNodegroups) {
          manyTilesManagedNodegroups[tile.nodegroup].push(tile);
          return;
        }
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
        componentData[nodegroupId] = {
          value: JSON.stringify({
            tileData: koMapping.toJSON(tile.data),
            resourceInstanceId: tile.resourceinstance,
            tileId: tile.tileid,
            nodegroupId: tile.nodegroup
          })
        };
      });
      const activityDigitalFiles = activityTiles.find(
        (tile) => tile.nodegroup === '316c7d1e-8554-11ea-aed7-f875a44e0e11'
      );
      if (activityDigitalFiles) {
        const activityDigitalFilesTiles = await this.fetchTileData(
          activityDigitalFiles.data['316c7d1e-8554-11ea-aed7-f875a44e0e11'][0].resourceId
        );
        activityDigitalFilesTiles.forEach((tile) => {
          if (tile.nodegroup === '7db68c6c-8490-11ea-a543-f875a44e0e11') {
            componentData[tile.nodegroup + `|report-documents`] = {
              value: JSON.stringify({
                tileData: koMapping.toJSON(tile.data),
                resourceInstanceId: tile.resourceinstance,
                tileId: tile.tileid,
                nodegroupId: tile.nodegroup
              })
            };
          }
        });
      }
      licenseTiles.forEach((tile) => {
        if (tile.nodegroup in manyTilesManagedNodegroups) {
          manyTilesManagedNodegroups[tile.nodegroup].push(tile);
          return;
        }
        /**
         * Cover letter node group
         */
        const value = {
          tileData: koMapping.toJSON(tile.data),
          resourceInstanceId: tile.resourceinstance,
          tileId: tile.tileid,
          nodegroupId: tile.nodegroup
        };
        if (tile.nodegroup === '0dcf7c74-53d5-11ee-844f-0242ac130008') {
          const letterData =
            tile.data['a99a4236-68e0-11ee-81c3-0242ac130004']?.[arches.activeLanguage]?.value;
          if (letterData) {
            value['coverLetterData'] = JSON.parse(letterData);
          }
        }
        /**
         * Good example of populating custom array access values. These
         * two values will be included in the safeArrayAccesses.
         */
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && actLocTile) {
          value['actLocTileId'] = actLocTile.tileid;
          value['actResourceId'] = actLocTile.resourceinstance;
        }
        componentData[tile.nodegroup] = {
          value: JSON.stringify(value)
        };
      });
      Object.entries(manyTilesManagedNodegroups).forEach(([key, value]) => {
        componentData[key] = {
          value: JSON.stringify(value)
        };
      });
      return componentData;
    };

    this.openRecent = async (resourceId) => {
      localStorage.setItem(this.WORKFLOW_EDIT_MODE_LABEL, JSON.stringify(true));
      await this.loadResourceData(resourceId);
    };

    this.editWorkflow = async () => {
      localStorage.setItem(this.WORKFLOW_EDIT_MODE_LABEL, JSON.stringify(true));
      await this.loadResourceData(this.selectedResource());
      this.updateRecentlyEdited(this.selectedResource());
    };

    this.updateRecentlyEdited = (resourceId) => {
      const slug = this.workflowSlug();
      const newEdit = {
        name: this.resourceName(),
        resourceId: resourceId
      };
      if (!(slug in this.recentlyEdited())) {
        this.recentlyEdited()[slug] = {
          [resourceId]: newEdit
        };
      } else {
        this.recentlyEdited()[slug][resourceId] = newEdit;
      }
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_EDITED_LABEL,
        JSON.stringify(this.recentlyEdited())
      );
    };

    this.init = () => {
      console.log('Init edit workflow: ', params);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.graphId(this.workflow().graphId);
      this.recentlyEdited(
        JSON.parse(localStorage.getItem(this.WORKFLOW_RECENTLY_EDITED_LABEL)) || {}
      );
    };

    this.init();
  };

  return ko.components.register('edit-workflow', {
    viewModel: editWorkflow,
    template: editWorkflowTemplate
  });
});
