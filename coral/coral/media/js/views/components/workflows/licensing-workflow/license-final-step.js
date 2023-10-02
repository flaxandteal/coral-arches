define([
  'knockout',
  'arches',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/licensing-workflow/license-final-step.htm'
], function (ko, arches, SummaryStep, licenseFinalStepTemplate) {
  function viewModel(params) {
    SummaryStep.apply(this, [params]);
    var self = this;
    console.log(SummaryStep);

    self.loading(false);

    self.displayName = 'Temp Display Name';
    self.applicationId = 'Temp Application ID';

    self.licenseNodes = ko.observable({
      dates: {
        label: 'Dates',
        nodegroupId: '05f6b846-5d49-11ee-911e-0242ac130003',
        renderNodeIds: null,
        data: []
      },
      status: {
        label: 'Application Status',
        nodegroupId: 'ee5947c6-48b2-11ee-abec-0242ac140007',
        renderNodeIds: null,
        data: []
      },
      decisionMadeBy: {
        label: 'Decision',
        nodegroupId: '2749ea5a-48cb-11ee-be76-0242ac140007',
        renderNodeIds: [
          '4c58921e-48cc-11ee-9081-0242ac140007',
          '25f04f6c-48cd-11ee-94b3-0242ac140007',
          'f3dcbf02-48cb-11ee-9081-0242ac140007',
          'f6c207ae-5938-11ee-9e74-0242ac130007'
        ],
        data: []
      },
      systemRef: {
        label: 'System Reference',
        nodegroupId: '991c3c74-48b6-11ee-85af-0242ac140007',
        renderNodeIds: ['991c49b2-48b6-11ee-85af-0242ac140007'],
        data: []
      },
      applicationDetails: {
        label: 'Application Details',
        nodegroupId: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
        renderNodeIds: [
          'aec103a2-48cf-11ee-8e4e-0242ac140007',
          'c2f40174-5dd5-11ee-ae2c-0242ac120008'
        ],
        data: []
      },
      externalRef: {
        label: 'External Reference',
        nodegroupId: '280b6cfc-4e4d-11ee-a340-0242ac140007',
        renderNodeIds: [
          { nodeId: '280b75bc-4e4d-11ee-a340-0242ac140007', label: 'License Number' }
        ],
        data: []
      },
      excavationType: {
        label: 'Excavation Type',
        nodegroupId: '6e071042-5d45-11ee-88b0-0242ac120008',
        renderNodeIds: ['6e071042-5d45-11ee-88b0-0242ac120008'],
        data: []
      },
      communication: {
        label: 'Email',
        nodegroupId: '6840f820-48ce-11ee-8e4e-0242ac140007',
        renderNodeIds: [
          '684110e4-48ce-11ee-8e4e-0242ac140007',
          '68410b3a-48ce-11ee-8e4e-0242ac140007',
          { nodeId: '684113a0-48ce-11ee-8e4e-0242ac140007', defaultValue: 'None Provided' }
        ],
        data: []
      },
      associatedActivities: {
        label: 'Associated Activities',
        nodegroupId: 'a9f53f00-48b6-11ee-85af-0242ac140007',
        renderNodeIds: ['a9f53f00-48b6-11ee-85af-0242ac140007'],
        data: []
      },
      digitalFiles: {
        label: 'Digital Files',
        nodegroupId: '8c5356f4-48ce-11ee-8e4e-0242ac140007',
        renderNodeIds: ['8c5356f4-48ce-11ee-8e4e-0242ac140007'],
        data: []
      }
    });

    self.activityNodes = ko.observable({
      name: {
        label: 'Activity',
        nodegroupId: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
        renderNodeIds: ['4a7be135-9938-11ea-b0e2-f875a44e0e11'],
        data: []
      },
      systemRef: {
        label: 'System Reference',
        nodegroupId: 'a5416b49-f121-11eb-8e2c-a87eeabdefba',
        renderNodeIds: [
          'e7d69603-9939-11ea-9e7f-f875a44e0e11',
          'e7d69604-9939-11ea-baef-f875a44e0e11'
          // { nodeId: 'e7d69603-9939-11ea-9e7f-f875a44e0e11', label: 'Application ID' },
          // { nodeId: 'e7d69604-9939-11ea-baef-f875a44e0e11', label: 'Planning Reference' }
        ],
        data: []
      },
      externalRef: {
        label: 'External References',
        nodegroupId: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
        renderNodeIds: [
          '589d4dc7-edf9-11eb-9856-a87eeabdefba',
          '589d4dca-edf9-11eb-83ea-a87eeabdefba'
        ],
        data: []
      },
      digitalFiles: {
        label: 'Digital Files',
        nodegroupId: '316c7d1e-8554-11ea-aed7-f875a44e0e11',
        renderNodeIds: ['316c7d1e-8554-11ea-aed7-f875a44e0e11'],
        data: []
      },
      areaType: {
        label: 'Area',
        nodegroupId: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
        renderNodeIds: [
          'a5416b53-f121-11eb-a507-a87eeabdefba',
          'a541922e-f121-11eb-b2f6-a87eeabdefba'
        ],
        data: []
      },
      address: {
        label: 'Address',
        nodegroupId: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
        renderNodeIds: [
          'a5419224-f121-11eb-9ca7-a87eeabdefba',
          'a541e034-f121-11eb-8803-a87eeabdefba',
          'a541e030-f121-11eb-aaf7-a87eeabdefba',
          'a541e029-f121-11eb-802c-a87eeabdefba',
          'a541e027-f121-11eb-ba26-a87eeabdefba',
          'a541e025-f121-11eb-8212-a87eeabdefba',
          'a541e023-f121-11eb-b770-a87eeabdefba',
          'a541b930-f121-11eb-a30c-a87eeabdefba',
          'a541b927-f121-11eb-8377-a87eeabdefba',
          'a541b925-f121-11eb-9264-a87eeabdefba',
          'a541b922-f121-11eb-9fa2-a87eeabdefba'
        ],
        data: []
      }
    });

    self.renderNode = async (key, tileData, config) => {
      console.log('tileData: ', tileData);
      console.log('key: ', key);
      let result = [];
      console.log('config: ', config);
      const tiles = tileData[config?.nodegroupId];
      console.log('tiles: ', tiles);

      const getNodeDataFromTile = async (t) => {
        console.log('t: ', JSON.stringify(t));
        const nodeData = [];
        if (!config.renderNodeIds) {
          // If no render nodes specified render them all
          nodeData.push(Object.values(t.data));
        } else {
          const filtered = [];
          for await (const nodeIdObject of config.renderNodeIds) {
            if (typeof nodeIdObject === 'string' || nodeIdObject instanceof String) {
              // Use the node ID string to get the node object
              filtered.push(t.data[nodeIdObject]);
            } else {
              /**
               * This is the object notation path that allows you to
               * provide values such as: label, defaultValue, related
               */
              const node = t.data[nodeIdObject.nodeId];
              console.log('nodeIdObject: ', nodeIdObject);
              if (nodeIdObject.label) {
                node.label = nodeIdObject.label;
              }
              if (nodeIdObject.defaultValue && !node.displayValue) {
                node.displayValue = nodeIdObject.defaultValue;
              }
              filtered.push(node);
            }
          }
          nodeData.push(filtered);
        }
        return nodeData;
      };

      if (tiles) {
        if (Array.isArray(tiles)) {
          // Multi Tile Node
          for await (const tile of tiles) {
            result = [...result, ...(await getNodeDataFromTile(tile))];
          }
        } else {
          // Single Tile Node
          result = [...result, ...(await getNodeDataFromTile(tiles))];
        }
      }

      console.log('result: ', result);
      config.data = result;

      return config;
    };

    self.renderAllNodes = async (nodeConfigs, tileData) => {
      for await (const [key, value] of Object.entries(nodeConfigs)) {
        const result = await self.renderNode(key, tileData, value);
        nodeConfigs[key] = result;
      }
      return nodeConfigs;
    };

    self.formatTileData = (tileData) => {
      const formatted = {};
      tileData.forEach((tile) => {
        const cardinality = !!tileData.find(
          (t) => t.tileid !== tile.tileid && t.nodegroup === tile.nodegroup
        );
        let cardinalityIdx = null;
        if (!cardinality) {
          formatted[tile.nodegroup] = {
            nodegroupId: tile.nodegroup,
            tileId: tile.tileid,
            data: {}
          };
        } else {
          if (tile.nodegroup in formatted) {
            formatted[tile.nodegroup].push({
              nodegroupId: tile.nodegroup,
              tileId: tile.tileid,
              data: {}
            });
            cardinalityIdx = formatted[tile.nodegroup].length - 1;
          } else {
            formatted[tile.nodegroup] = [];
            formatted[tile.nodegroup].push({
              nodegroupId: tile.nodegroup,
              tileId: tile.tileid,
              data: {}
            });
            cardinalityIdx = formatted[tile.nodegroup].length - 1;
          }
        }
        tile.display_values.forEach((display) => {
          console.log('cardinality: ', cardinality, cardinalityIdx);
          if (!cardinality) {
            formatted[tile.nodegroup]['data'][display.nodeid] = {
              nodeId: display.nodeid,
              label: display.label,
              displayValue: display.value,
              value: tile.data[display.nodeid]
            };
          } else {
            formatted[tile.nodegroup][cardinalityIdx]['data'][display.nodeid] = {
              nodeId: display.nodeid,
              label: display.label,
              displayValue: display.value,
              value: tile.data[display.nodeid]
            };
          }
        });
      });
      return formatted;
    };

    self.fetchTileData = async (resourceId) => {
      console.log('Fetching tiles for resource ID: ', resourceId);
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      console.log('Logging tilesResponse: ', tilesResponse, data.tiles);
      return data.tiles;
    };

    self.hasNodeGroup = (tileData, nodeGroupId) => {
      return tileData.some((tile) => tile.nodegroup === nodeGroupId);
    };

    self.getResourceIds = (nodeConfig) => {
      const ids = [];
      nodeConfig.data.forEach((data) => {
        data.forEach((node) => {
          node.value.forEach((relationship) => {
            ids.push(relationship.resourceId);
          });
        });
      });
      return ids;
    };

    self.loadData = async () => {
      self.loading(true);
      const licenseTiles = await self.fetchTileData(self.resourceid);
      const formattedLicenseTiles = self.formatTileData(licenseTiles);
      console.log('formattedLicenseTiles: ', formattedLicenseTiles);

      self.licenseNodes(await self.renderAllNodes(self.licenseNodes(), formattedLicenseTiles));

      console.log(
        'self.licenseNodes().associatedActivities: ',
        self.licenseNodes().associatedActivities
      );
      const activityResourceIds = self.getResourceIds(self.licenseNodes().associatedActivities);
      console.log('activityResourceId: ', activityResourceIds);
      const activityTiles = await self.fetchTileData(activityResourceIds[0]);
      const formattedActivityTiles = self.formatTileData(activityTiles);
      console.log('formattedActivityTiles: ', formattedActivityTiles);

      self.activityNodes(await self.renderAllNodes(self.activityNodes(), formattedActivityTiles));

      self.loading(false);
    };

    // Call load data
    self.loadData();
  }

  ko.components.register('license-final-step', {
    viewModel: viewModel,
    template: licenseFinalStepTemplate
  });
  return viewModel;
});
