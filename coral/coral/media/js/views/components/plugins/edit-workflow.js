define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/edit-workflow.htm'
], function ($, ko, koMapping, arches, editWorkflowTemplate) {
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
      await this[this.workflow().setupFunction](resourceId);
      this.formatManyTilesManagedNodegroups();
      localStorage.setItem(
        this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL,
        JSON.stringify(this.componentData())
      );
      this.loading(false);
    };

    this.componentData = ko.observable({});
    this.manyTilesManagedNodegroups = ko.observable({});
    this.tileData = ko.observable({});

    this.addManyTilesManagedNodegroup = (nodegroupId) => {
      this.manyTilesManagedNodegroups()[nodegroupId] = [];
    };

    this.formatManyTilesManagedNodegroups = () => {
      Object.entries(this.manyTilesManagedNodegroups()).forEach(([key, value]) => {
        this.componentData()[key] = {
          value: JSON.stringify(value)
        };
      });
    };

    this.addComponentData = (tile, suffix, additionalValues = {}) => {
      const key = suffix ? `${tile.nodegroup}|${suffix}` : tile.nodegroup;
      this.componentData()[key] = {
        value: JSON.stringify({
          tileData: koMapping.toJSON(tile.data),
          resourceInstanceId: tile.resourceinstance,
          tileId: tile.tileid,
          nodegroupId: tile.nodegroup,
          ...additionalValues
        })
      };
    };

    this.advancedSearch = () => {};

    /**
     * TODO: Refactor this into utility methods to make it easier
     * to create more setup functions.
     */
    this.loadLicenseData = async (licenseResourceId) => {
      this.addManyTilesManagedNodegroup('6840f820-48ce-11ee-8e4e-0242ac140007');
      this.addManyTilesManagedNodegroup('a5416b46-f121-11eb-8f2d-a87eeabdefba');
      const licenseTiles = await this.fetchTileData(licenseResourceId);

      this.resourceName(
        this.getNameFromNodeId(licenseTiles, '59d6676c-48b9-11ee-84da-0242ac140007')
      );

      const findDataFromTiles = (config, tiles) => {
        const result = { ...config };
        Object.keys(result).forEach((key) => (result[key] = null));
        tiles.forEach((tile) => {
          Object.entries(config).forEach(([key, value]) => {
            console.log('key, value: ', key, value);
            if (typeof value === 'string' || value instanceof String) {
              if (tile.nodegroup === value) {
                result[key] = tile;
              }
            } else if (typeof value === 'function') {
              if (value(tile)) {
                result[key] = tile;
              }
            }
          });
        });
        return result;
      };

      const licenseData = findDataFromTiles(
        {
          digitalFiles: '8c5356f4-48ce-11ee-8e4e-0242ac140007',
          sysRef: '991c3c74-48b6-11ee-85af-0242ac140007',
          extRef: '280b6cfc-4e4d-11ee-a340-0242ac140007'
        },
        licenseTiles
      );
      console.log(licenseData);

      if (licenseData.digitalFiles) {
        const licenseDigitalFilesTiles = await this.fetchTileData(
          licenseData.digitalFiles.data['8c5356f4-48ce-11ee-8e4e-0242ac140007'][0].resourceId
        );
        const licenseFilesData = findDataFromTiles(
          { files: '7db68c6c-8490-11ea-a543-f875a44e0e11' },
          licenseDigitalFilesTiles
        );
        if (licenseFilesData.files) {
          this.addComponentData(licenseFilesData.files, 'file-upload');
        }
      }

      let acitivityResourceId = null;
      await $.ajax({
        type: 'GET',
        url: arches.urls.search_results,
        data: {
          'paging-filter': 1,
          tiles: true,
          format: 'tilecsv',
          reportlink: 'false',
          precision: '6',
          total: '0',
          'advanced-search': JSON.stringify([
            {
              op: 'and',
              'e7d69602-9939-11ea-b514-f875a44e0e11': { op: 'eq', val: '' },
              'e7d69603-9939-11ea-9e7f-f875a44e0e11': {
                op: '~',
                lang: 'en',
                val: licenseData.sysRef?.data['991c49b2-48b6-11ee-85af-0242ac140007'][
                  arches.activeLanguage
                ].value
              },
              'e7d69604-9939-11ea-baef-f875a44e0e11': { op: '~', lang: 'en', val: '' }
            }
          ])
        },
        context: this,
        success: (response) => {
          acitivityResourceId = response.results.hits.hits[0]?._id;
        },
        error: (response, status, error) => {
          console.error(error);
        },
        complete: (request, status) => {
          //
        }
      });
      const activityTiles = await this.fetchTileData(acitivityResourceId);
      const activityData = findDataFromTiles(
        {
          actLoc: 'a5416b49-f121-11eb-8e2c-a87eeabdefba',
          sysRef: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
          cmRef: (tile) => {
            if (tile.nodegroup !== '') return;
            const source = tile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'];
            if (source === '19afd557-cc21-44b4-b1df-f32568181b2c') {
              return true;
            }
          },
          assetRef: (tile) => {
            if (tile.nodegroup !== '') return;
            const source = tile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'];
            if (source === 'df585888-b45c-4f48-99d1-4cb3432855d5') {
              return true;
            }
          },
          powRef: (tile) => {
            if (tile.nodegroup !== '') return;
            const source = tile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'];
            if (source === 'c14def6d-4713-465f-9119-bc33f0d6e8b3') {
              return true;
            }
          }
        },
        activityTiles
      );
      console.log(activityData);

      // const actLocTile = activityTiles.find(
      //   (tile) => tile.nodegroup === 'a5416b49-f121-11eb-8e2c-a87eeabdefba'
      // );
      // const actSysRefTile = activityTiles.find(
      //   (tile) => tile.nodegroup === 'e7d695ff-9939-11ea-8fff-f875a44e0e11'
      // );
      activityTiles.forEach((tile) => {
        if (tile.nodegroup in this.manyTilesManagedNodegroups()) {
          this.manyTilesManagedNodegroups()[tile.nodegroup].push(tile);
          return;
        }
        let suffix = null;
        const externalRefSource = tile.data['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'];
        if (externalRefSource === '19afd557-cc21-44b4-b1df-f32568181b2c') {
          suffix += '|cm-ref'; // This is set to match the unique instance name from the workflow
        }
        if (externalRefSource === 'df585888-b45c-4f48-99d1-4cb3432855d5') {
          suffix += '|asset-ref'; // This is set to match the unique instance name from the workflow
        }
        if (externalRefSource === 'c14def6d-4713-465f-9119-bc33f0d6e8b3') {
          suffix += '|pow-ref'; // This is set to match the unique instance name from the workflow
        }
        this.addComponentData(tile, suffix);
      });
      const activityDigitalFiles = activityTiles.find(
        (tile) => tile.nodegroup === '316c7d1e-8554-11ea-aed7-f875a44e0e11'
      );
      if (activityDigitalFiles) {
        const activityDigitalFilesTiles = await this.fetchTileData(
          activityDigitalFiles.data['316c7d1e-8554-11ea-aed7-f875a44e0e11'][0].resourceId
        );
        const activityFilesData = findDataFromTiles(
          { files: '7db68c6c-8490-11ea-a543-f875a44e0e11' },
          activityDigitalFilesTiles
        );
        if (activityFilesData.files) {
          this.addComponentData(activityFilesData.files, 'report-documents');
        }
      }
      const licenseExtRefTile = licenseTiles.find(
        (tile) => tile.nodegroup === '280b6cfc-4e4d-11ee-a340-0242ac140007'
      );
      licenseTiles.forEach((tile) => {
        if (tile.nodegroup in this.manyTilesManagedNodegroups()) {
          this.manyTilesManagedNodegroups()[tile.nodegroup].push(tile);
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
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && activityResourceId) {
          value['actResourceId'] = activityResourceId;
        }
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && activityData.actLoc) {
          value['actLocTileId'] = activityData.actLoc.tileid;
        }
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && activityData.sysRef) {
          value['actSysRefTileId'] = activityData.sysRef.tileid;
        }
        if (tile.nodegroup === '991c3c74-48b6-11ee-85af-0242ac140007' && licenseExtRefTile) {
          value['licenseNumberTileId'] = licenseExtRefTile.tileid;
        }
        this.addComponentData(tile);
        this.componentData()[tile.nodegroup] = {
          value: JSON.stringify(value)
        };
      });
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

    this.saveRecentlyEdited = () => {
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_EDITED_LABEL,
        JSON.stringify(this.recentlyEdited())
      );
    };

    this.validateRecentlyEdited = async (workflows) => {
      const removeWorkflows = [];

      const validate = (resourceId) =>
        new Promise(async (resolve, reject) => {
          const tiles = await this.fetchTileData(resourceId);
          if (!tiles.length) {
            removeWorkflows.push(resourceId);
          }
          resolve();
        });

      await Promise.all(Object.values(workflows).map(({ resourceId }) => validate(resourceId)));

      const recentlyEdited = this.recentlyEdited();
      removeWorkflows.forEach((resourceId) => {
        delete recentlyEdited[this.workflowSlug()][resourceId];
      });
      this.recentlyEdited(recentlyEdited);
      this.saveRecentlyEdited();
    };

    this.clearRecentlyEdited = () => {
      const recentlyEdited = this.recentlyEdited();
      recentlyEdited[this.workflowSlug()] = {};
      this.recentlyEdited(recentlyEdited);
      this.saveRecentlyEdited();
    };

    this.init = async () => {
      console.log('Init edit workflow: ', params);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.graphId(this.workflow().graphId);
      this.recentlyEdited(
        JSON.parse(localStorage.getItem(this.WORKFLOW_RECENTLY_EDITED_LABEL)) || {}
      );

      await this.validateRecentlyEdited(this.recentlyEdited()[this.workflowSlug()]);
    };

    this.init();
  };

  return ko.components.register('edit-workflow', {
    viewModel: editWorkflow,
    template: editWorkflowTemplate
  });
});
