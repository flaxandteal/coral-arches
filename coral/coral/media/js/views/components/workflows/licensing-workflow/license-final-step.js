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

    self.nodesToRender = ko.observable({
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
      relatedActivities: {
        label: 'Related Activities',
        nodegroupId: 'a9f53f00-48b6-11ee-85af-0242ac140007',
        renderNodeIds: [
          // Possibly need method to go get the related resource,
          {
            related: true,
            nodeId: 'a9f53f00-48b6-11ee-85af-0242ac140007',
            label: 'Site',
            nodesToRender: {
              address: {
                label: 'Address',
                nodegroupId: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
                renderNodeIds: null,
                data: []
              }
            }
          }
        ]
      }
    });

    self.renderNodes = async (key, tileData, nodesToRender) => {
      console.log('tileData: ', tileData);
      console.log('key: ', key);
      let result = [];
      const config = nodesToRender[key];
      console.log('config: ', config);
      const tiles = tileData[config?.nodegroupId];
      console.log('tiles: ', tiles);

      const getNodeDataFromTile = async (t) => {
        console.log('t: ', t);
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
              if (!nodeIdObject.related) {
                console.log('Not related');
                if (nodeIdObject.label) node.label = nodeIdObject.label;
                if (nodeIdObject.defaultValue && !node.displayValue)
                  node.displayValue = nodeIdObject.defaultValue;
                filtered.push(node);
              } else {
                console.log('Related');
                const resourceId = node.value[0].resourceId;
                const relatedTiles = self.formatTileData(await self.fetchTileData(resourceId));
                console.log('resourceId: ', resourceId);
                console.log('relatedTiles: ', relatedTiles);
                filtered.push(
                  Object.values(
                    await self.renderNodes('address', relatedTiles, nodeIdObject.nodesToRender)
                  )
                );
                console.log('nodeData after related: ', nodeData);
              }
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
      nodesToRender[key].data = result;
      console.log(`nodesToRender[${key}].data: `, nodesToRender[key]);
      return nodesToRender;
    };

    console.log('Logging params: ', params);

    self.getValueFromTiles = (tileData, nodeValueId, validator) => {
      /**
       * The validator callback can be used to access the found tile
       * and validate that another node value is present. Useful for
       * identifing multiple tiles of the same type.
       */
      const result = {
        tileId: null,
        value: null,
        display: null
      };
      for (const tile of tileData) {
        if (!(nodeValueId in tile.data)) continue;
        if (validator) {
          if (validator(tile)) {
            result.tileId = tile.tileid;
            result.value = tile.data[nodeValueId];
            result.display = tile.display_values.find((node) => node.nodeid === nodeValueId)?.value;
            break;
          }
          continue;
        }
        result.tileId = tile.tileid;
        result.value = tile.data[nodeValueId];
        result.display = tile.display_values.find((node) => node.nodeid === nodeValueId)?.value;
      }
      return result.tileId ? result : null;
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

    self.loadData = async () => {
      self.loading(true);
      const licenseTiles = await self.fetchTileData(self.resourceid);
      const formattedLicenseTiles = self.formatTileData(licenseTiles);
      console.log('formattedLicenseTiles: ', formattedLicenseTiles);

      for await (const key of Object.keys(self.nodesToRender())) {
        self.nodesToRender(
          await self.renderNodes(key, formattedLicenseTiles, self.nodesToRender())
        );
      }

      console.log('self.nodesToRender: ', self.nodesToRender());
      self.loading(false);
    };

    // Call load data
    self.loadData();

    // this.siteAddress = {};
    // this.observedSiteAddress = ko.observable({});
    // this.siteAddressIndex = ko.observable(0);
    // this.applicants = ko.observable([]);
    // this.applicantsAddresses = ko.observable([]);
    // this.companies = ko.observable([]);
    // this.companiesAddresses = ko.observable([]);

    // this.createAddress = function (address) {
    //   console.log(address);
    //   return `${address.buildingName ? address.buildingName + ', <br />' : ''}
    //   ${address.buildingNumber} ${address.street},
    //   ${address.subStreetNumber ? address.subStreetNumber + ' ' : ''}
    //   ${address.subStreet ? address.subStreet + ',' : ''}
    //   <br />${address.city},
    //   <br />${address.county},
    //   <br />${address.postCode}`;
    // };

    // // const self = this;
    // this.resourceid = params.resourceid;
    // this.reportVals = {
    //   assetNames: [],
    //   assetNotes: [],
    //   wreckNames: [],
    //   wreckNotes: [],
    //   county: ko.computed({
    //     read: function () {
    //       console.log('county comp');
    //       console.log(self.siteAddressIndex(), JSON.stringify(self.siteAddress), self.siteAddress);
    //       return self.observedSiteAddress().counties
    //         ? self.observedSiteAddress().counties[self.siteAddressIndex()].en.value
    //         : '';
    //     }
    //   }),
    //   siteAddress: ko.computed({
    //     read: function () {
    //       if (self.observedSiteAddress().buildingNumbers) {
    //         return `${
    //           self.observedSiteAddress().buildingNames
    //             ? self.observedSiteAddress().buildingNames[self.siteAddressIndex()].en.value +
    //               ', <br />'
    //             : ''
    //         }
    //         ${self.observedSiteAddress().buildingNumbers[self.siteAddressIndex()].en.value} ${
    //           self.observedSiteAddress().streets[self.siteAddressIndex()].en.value
    //         },
    //         ${
    //           self.observedSiteAddress().subStreetNumbers
    //             ? self.observedSiteAddress().subStreetNumbers[self.siteAddressIndex()].en.value +
    //               ' '
    //             : ''
    //         }
    //         ${
    //           self.observedSiteAddress().subStreets
    //             ? self.observedSiteAddress().subStreets[self.siteAddressIndex()].en.value + ','
    //             : ''
    //         }
    //         <br />${self.observedSiteAddress().cities[self.siteAddressIndex()].en.value},
    //         <br />${self.observedSiteAddress().counties[self.siteAddressIndex()].en.value},
    //         <br />${self.observedSiteAddress().postcodes[self.siteAddressIndex()].en.value}`;
    //       }
    //       return '';
    //     }
    //   }),
    //   licenseHolders: ko.computed({
    //     read: function () {
    //       console.log('comp app');
    //       return self.applicants();
    //     }
    //   }),
    //   licenseHoldersAddresses: ko.observable(['place holder'])
    // };

    // this.resourceLoading = ko.observable(false);
    // this.relatedResourceLoading = ko.observable(false);
    // this.geometry = false;

    // var getNodeValues = function (tiles, nodeId) {
    //   var values = [];
    //   tiles.forEach((tile) => {
    //     if (tile.data[nodeId]) {
    //       values.push(tile.data[nodeId]);
    //     }
    //   });
    //   return values;
    // };

    // this.relatedResources.subscribe((val) => {
    //   console.log('revalu', val);
    //   val.related_resources.forEach((related_resource) => {
    //     if (related_resource.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588') {
    //       // company / organisation
    //     }
    //     if (related_resource.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {
    //       // people
    //     }
    //     if (related_resource.graph_id === 'b9e0701e-5463-11e9-b5f5-000d3ab1e588') {
    //       // activity
    //       externalRefs = getNodeValues(
    //         related_resource.tiles,
    //         '589d4dc7-edf9-11eb-9856-a87eeabdefba'
    //       );
    //       externalRefSources = getNodeValues(
    //         related_resource.tiles,
    //         '589d4dcd-edf9-11eb-8a7d-a87eeabdefba'
    //       );
    //       externalRefNotes = getNodeValues(
    //         related_resource.tiles,
    //         '589d4dca-edf9-11eb-83ea-a87eeabdefba'
    //       );

    //       this.siteAddress.buildingNames = getNodeValues(
    //         related_resource.tiles,
    //         'a541e029-f121-11eb-802c-a87eeabdefba'
    //       );
    //       this.siteAddress.buildingNumbers = getNodeValues(
    //         related_resource.tiles,
    //         'a541b925-f121-11eb-9264-a87eeabdefba'
    //       );
    //       this.siteAddress.streets = getNodeValues(
    //         related_resource.tiles,
    //         'a541b927-f121-11eb-8377-a87eeabdefba'
    //       );
    //       this.siteAddress.subStreetNumbers = getNodeValues(
    //         related_resource.tiles,
    //         'a541b922-f121-11eb-9fa2-a87eeabdefba'
    //       );
    //       this.siteAddress.subStreets = getNodeValues(
    //         related_resource.tiles,
    //         'a541e027-f121-11eb-ba26-a87eeabdefba'
    //       );
    //       this.siteAddress.counties = getNodeValues(
    //         related_resource.tiles,
    //         'a541e034-f121-11eb-8803-a87eeabdefba'
    //       );
    //       this.siteAddress.postcodes = getNodeValues(
    //         related_resource.tiles,
    //         'a541e025-f121-11eb-8212-a87eeabdefba'
    //       );
    //       this.siteAddress.cities = getNodeValues(
    //         related_resource.tiles,
    //         'a541e023-f121-11eb-b770-a87eeabdefba'
    //       );
    //     }
    //     if (related_resource.graph_id === 'a535a235-8481-11ea-a6b9-f875a44e0e11') {
    //       // digital objects
    //     }
    //   });
    //   for (const index in externalRefSources) {
    //     // currently using HER ref as bfile number. Need to change when we have Kanika's concepts.
    //     if (externalRefSources[index] === '19afd557-cc21-44b4-b1df-f32568181b2c') {
    //       this.reportVals.bFileNumber = externalRefs[index].en.value;
    //     }
    //     if (externalRefSources[index] === '9a383c95-b795-4d76-957a-39f84bcee49e') {
    //       this.reportVals.licenseNumber = externalRefs[index].en.value;
    //     }
    //     if (externalRefSources[index] === 'df585888-b45c-4f48-99d1-4cb3432855d5') {
    //       this.reportVals.assetNames.push(externalRefs[index].en.value);
    //       this.reportVals.assetNotes.push(externalRefNotes[index].en.value);
    //     }
    //     if (externalRefSources[index] === 'c14def6d-4713-465f-9119-bc33f0d6e8b3') {
    //       this.reportVals.wreckNames.push(externalRefs[index].en.value);
    //       this.reportVals.wreckNotes.push(externalRefNotes[index].en.value);
    //     }
    //   }
    //   console.log(this.siteAddress);
    //   this.observedSiteAddress(this.siteAddress);
    // }, this);

    // this.resourceData.subscribe((val) => {
    //   console.log('valueeeeee: ', val);
    //   this.displayName = val['displayname'] || 'Unnamed';
    //   (this.reportVals.applicationId = {
    //     name: 'Application ID',
    //     value: this.getResourceValue(val.resource, [
    //       'System Reference Numbers',
    //       'UUID',
    //       'ResourceID',
    //       '@value'
    //     ])
    //   }),
    //     (this.reportVals.siteName = {
    //       name: 'Site Name',
    //       value: this.getResourceValue(val.resource, ['Associated Activities', '@value'])
    //     }),
    //     (this.reportVals.submissionDetails = {
    //       name: 'Submission Details',
    //       value: this.getResourceValue(val.resource, ['Proposal', 'Proposal Text', '@value'])
    //     }),
    //     // gridRef: {
    //     //   name: 'Grid Reference',
    //     //   value: this.getResourceValue(val.resource, ['Grid Reference', '@value'])
    //     // },
    //     // planningRef: {
    //     //   name: 'Planning Reference',
    //     //   value: this.getResourceValue(val.resource, ['Planning Reference', '@value'])
    //     // },

    //     (this.reportVals.inspector = this.getResourceValue(val.resource, [
    //       'Decision',
    //       'Decision Assignment',
    //       'Decision Made By',
    //       '@value'
    //     ]));
    //   this.reportVals.decisionDate = this.getResourceValue(val.resource, [
    //     'Decision',
    //     'Decision Assignment',
    //     'Decision Time Span',
    //     'Decision Date',
    //     '@value'
    //   ]);

    //   console.log('pre fetch', this.applicants(), this.companies());
    //   window
    //     .fetch(
    //       this.urls.api_tiles(val.resource['Contacts']['Applicants']['Applicant']['@tile_id']) +
    //         '?format=json&compact=false'
    //     )

    //     .then((response) => response.json())

    //     .then((data) =>
    //       data.data['859cb33e-521d-11ee-b790-0242ac120002'].forEach((contact_tile) => {
    //         const contacts = [];
    //         window
    //           .fetch(
    //             this.urls.api_resources(contact_tile.resourceId) + '?format=json&compact=false'
    //           )
    //           .then((response) => response.json())
    //           .then((data) => {
    //             this.loading(true);
    //             contacts.push(data);
    //           })
    //           .then((x) => {
    //             this.loading(true);

    //             for (let contact of contacts) {
    //               if (contact.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {
    //                 console.log('new app', contact['resource']['Name'][0]['Full Name']['@value']);
    //                 this.applicants()[contact['resource']['Name'][0]['Full Name']['@value']] = [];

    //                 if (contact['resource']['Location Data']) {
    //                   this.applicants()[contact['resource']['Name'][0]['Full Name']['@value']] =
    //                     contact['resource']['Location Data'].map((location) => {
    //                       return {
    //                         buildingName:
    //                           location.Addresses['Building Name']['Building Name Value']['@value'],
    //                         buildingNumber:
    //                           location.Addresses['Building Number']['Building Number Value'][
    //                             '@value'
    //                           ],
    //                         street: location.Addresses['Street']['Street Value']['@value'],
    //                         buildingNumberSubSt:
    //                           location.Addresses['Building Number Sub-Street'][
    //                             'Building Number Sub-Street Value'
    //                           ]['@value'],
    //                         subStreet:
    //                           location.Addresses['Sub-Street ']['Sub-Street Value']['@value'],
    //                         city: location.Addresses['Town or City']['Town or City Value'][
    //                           '@value'
    //                         ],
    //                         county: location.Addresses['County']['County Value']['@value'],
    //                         postCode: location.Addresses['Postcode']['Postcode Value']['@value']
    //                       };
    //                     });
    //                 }
    //               } else if (contact.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588') {
    //                 console.log(
    //                   'new com',
    //                   contact['resource']['Names'][0]['Organization Name']['@value']
    //                 );
    //                 this.companies()[
    //                   contact['resource']['Names'][0]['Organization Name']['@value']
    //                 ] = [];

    //                 if (contact['resource']['Location Data']) {
    //                   this.companies()[
    //                     contact['resource']['Names'][0]['Organization Name']['@value']
    //                   ] = contact['resource']['Location Data'].map((location) => {
    //                     return {
    //                       buildingName:
    //                         location.Addresses['Building Name']['Building Name Value']['@value'],
    //                       buildingNumber:
    //                         location.Addresses['Building Number']['Building Number Value'][
    //                           '@value'
    //                         ],
    //                       street: location.Addresses['Street']['Street Value']['@value'],
    //                       buildingNumberSubSt:
    //                         location.Addresses['Building Number Sub-Street'][
    //                           'Building Number Sub-Street Value'
    //                         ]['@value'],
    //                       subStreet:
    //                         location.Addresses['Sub-Street ']['Sub-Street Value']['@value'],
    //                       city: location.Addresses['Town or City']['Town or City Value']['@value'],
    //                       county: location.Addresses['County']['County Value']['@value'],
    //                       postCode: location.Addresses['Postcode']['Postcode Value']['@value']
    //                     };
    //                   });
    //                 }
    //               }
    //               this.loading(true);

    //               this.loading(false);
    //             }
    //           });
    //       })
    //     );
    //   this.loading(true);
    //   console.log('report vals: ', this.reportVals);

    //   this.loading(false);
    // }, this);
  }

  ko.components.register('license-final-step', {
    viewModel: viewModel,
    template: licenseFinalStepTemplate
  });
  return viewModel;
});
