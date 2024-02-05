define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/default-card-util',
  'views/components/workflows/licensing-workflow/license-initial-step',
  'views/components/workflows/related-document-upload',
  'views/components/workflows/licensing-workflow/license-cover-letter',
  // 'views/components/workflows/licensing-workflow/license-final-step',
  // 'views/components/workflows/licensing-workflow/fetch-generated-license-number',
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('licensing-workflow', {
    viewModel: function (params) {
      this.componentName = 'licensing-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Excavation License',
          name: 'init-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Important Information',
            text: 'Please note that it could take up to a minute to complete the initialisation for the License application. If something goes wrong during the process an error will be displayed to you.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'license-initial-step',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007',
                    hiddenNodes: ['991c4340-48b6-11ee-85af-0242ac140007']
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Application Details',
          name: 'app-details-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'site-name',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    hiddenNodes: [
                      '4a7bba20-9938-11ea-92e7-f875a44e0e11',
                      '4a7bba21-9938-11ea-8f0f-f875a44e0e11'
                    ],
                    labels: [['Activity Name', 'Site Name']]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'planning-reference',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '9236156e-bad1-11ee-b3f2-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'cm-reference',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'b84fa9c6-bad2-11ee-b3f2-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'contacts',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '6d290832-5891-11ee-a624-0242ac120004',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-dates',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '05f6b846-5d49-11ee-911e-0242ac130003',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'application-details',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Geospatial Details',
          name: 'geospaital-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'geometry-info',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a541560c-f121-11eb-aa92-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['activityLocationTileId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Location Details',
          name: 'location-step',
          workflowstepclass: 'workflow-form-component',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'address-info',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['activityLocationTileId']",
                    hiddenNodes: [
                      'a5419221-f121-11eb-a173-a87eeabdefba', // full_address_type,
                      'a5419222-f121-11eb-8b1f-a87eeabdefba', // address_status,
                      'a5419224-f121-11eb-9ca7-a87eeabdefba', // full_address,
                      'a541b91c-f121-11eb-beb5-a87eeabdefba', // postcode_metatype,
                      'a541b91d-f121-11eb-adf3-a87eeabdefba', // address_currency_metatype,
                      'a541b91e-f121-11eb-94ea-a87eeabdefba', // address_status_metatype,
                      'a541b91f-f121-11eb-b90b-a87eeabdefba', // locality_type,
                      'a541b920-f121-11eb-89e7-a87eeabdefba', // building_number_type,
                      'a541b921-f121-11eb-ba56-a87eeabdefba', // building_number_sub_street_type,
                      'a541b922-f121-11eb-9fa2-a87eeabdefba', // building_number_sub_street_value,
                      'a541b925-f121-11eb-9264-a87eeabdefba', // building_number_value,
                      //'a541b927-f121-11eb-8377-a87eeabdefba', // street_value,
                      'a541b928-f121-11eb-aaf3-a87eeabdefba', // locality_metatype,
                      'a541b929-f121-11eb-bd03-a87eeabdefba', // building_number_sub_street_metatype,
                      'a541b92a-f121-11eb-b6d1-a87eeabdefba', // town_or_city_metatype,
                      'a541b92b-f121-11eb-ade9-a87eeabdefba', // county_type,
                      'a541b92c-f121-11eb-b09e-a87eeabdefba', // sub_street_type,
                      'a541b92d-f121-11eb-8993-a87eeabdefba', // county_metatype,
                      'a541b92e-f121-11eb-a98d-a87eeabdefba', // building_name_metatype,
                      'a541b92f-f121-11eb-b035-a87eeabdefba', // sub_street_metatype,
                      'a541b930-f121-11eb-a30c-a87eeabdefba', // locality_value,
                      //'a541e023-f121-11eb-b770-a87eeabdefba', // town_or_city_value,
                      //'a541e025-f121-11eb-8212-a87eeabdefba', // postcode_value,
                      'a541e027-f121-11eb-ba26-a87eeabdefba', // sub_street_value,
                      'a541e029-f121-11eb-802c-a87eeabdefba', // building_name_value,
                      'a541e02a-f121-11eb-83b2-a87eeabdefba', // building_name_type,
                      'a541e02b-f121-11eb-9462-a87eeabdefba', // building_number_metatype,
                      'a541e02d-f121-11eb-b36f-a87eeabdefba', // address_currency,
                      'a541e02e-f121-11eb-b7f9-a87eeabdefba', // town_or_city_type,
                      'a541e02f-f121-11eb-8d6a-a87eeabdefba', // street_type,
                      'a541e030-f121-11eb-aaf7-a87eeabdefba', // postcode_type,
                      'a541e033-f121-11eb-9f81-a87eeabdefba', // full_address_metatype,
                      //'a541e034-f121-11eb-8803-a87eeabdefba', // county_value,
                      'a541e035-f121-11eb-a3d9-a87eeabdefba' // street_metatype
                    ]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'location-names',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['activityLocationTileId']",
                    hiddenNodes: [
                      'a5416b52-f121-11eb-9724-a87eeabdefba', // area_name_metatype,
                      //'a5416b53-f121-11eb-a507-a87eeabdefba', // area_name,
                      'a5416b54-f121-11eb-8b8d-a87eeabdefba', // area_name_type,
                      'a541921a-f121-11eb-93b5-a87eeabdefba', // area_currency_metatype,
                      'a5419227-f121-11eb-9683-a87eeabdefba', // area_metatype,
                      'a541922b-f121-11eb-a081-a87eeabdefba', // area_currency_type,
                      'a541922e-f121-11eb-b2f6-a87eeabdefba' // area_type
                    ],
                    prefilledNodes: [
                      [
                        'a541922e-f121-11eb-b2f6-a87eeabdefba',
                        '26910978-5742-d0db-8b63-ec8d65ce5198'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-description',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b40-f121-11eb-9cb6-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['activityLocationTileId']",
                    hiddenNodes: ['a5419231-f121-11eb-911a-a87eeabdefba']
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Additional Files',
          name: 'additional-files-step',
          workflowstepclass: 'workflow-form-component',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: '1fe572ec-8f8a-11ee-87af-0242ac190008',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '1fe572ec-8f8a-11ee-87af-0242ac190008'
                  }
                },
                {
                  componentName: 'related-document-upload',
                  uniqueInstanceName: 'file-upload',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
                    nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',
                    resourceModelId:
                      "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-step']['app-id'][0]['tileId']",
                    resourceModelDigitalObjectNodeGroupId: '8c5356f4-48ce-11ee-8e4e-0242ac140007',
                    label: 'Please upload the required files below'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Communications',
          name: 'communications-step',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'communications-upload-step',
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '6840f820-48ce-11ee-8e4e-0242ac140007',
                    hiddenNodes: [
                      '6841329a-48ce-11ee-8e4e-0242ac140007',
                      '68411f12-48ce-11ee-8e4e-0242ac140007',
                      '684121d8-48ce-11ee-8e4e-0242ac140007',
                      '68412778-48ce-11ee-8e4e-0242ac140007'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Record Decision',
          name: 'record-dicision-step',
          workflowstepclass: 'workflow-form-component',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'grade-e-decision',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '69f2eb3c-c430-11ee-94bf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'grade-d-decision',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'c9f504b4-c42d-11ee-94bf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'license-valid-timespan',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '1887f678-c42d-11ee-bc4b-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']"
                  }
                },
                /**
                 * TODO: Add license number nodegroup with linked tile id
                 * TODO: Link CM ref to the same tile id
                 */
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'cm-reference',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'b84fa9c6-bad2-11ee-b3f2-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'decision-note',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '3fe97968-c436-11ee-94bf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Cover Letter',
          name: 'cover-letter-step',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'license-cover-letter',
                  uniqueInstanceName: 'cover-letter',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '0dcf7c74-53d5-11ee-844f-0242ac130008',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        // // {
        // //   title: 'Site Visit',
        // //   name: 'site-visit-step',
        // //   workflowstepclass: 'workflow-form-component',
        // //   required: false,
        // //   layoutSections: [
        // //     {
        // //       componentConfigs: [
        // //         {
        // //           componentName: 'default-card-util',
        // //           uniqueInstanceName: 'site-name',
        // //           tilesManaged: 'one',
        // //           parameters: {
        // //             graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
        // //             nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
        // //             resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
        // //             tileid: "['app-details-step']['site-name'][0]['tileId']",
        // //             hiddenNodes: [
        // //               '4a7bba20-9938-11ea-92e7-f875a44e0e11',
        // //               '4a7bba21-9938-11ea-8f0f-f875a44e0e11'
        // //             ],
        // //             labels: [['Activity Name', 'Site Name']]
        // //           }
        // //         },
        // //         {
        // //           componentName: 'default-card-util',
        // //           uniqueInstanceName: 'license-no',
        // //           tilesManaged: 'one',
        // //           parameters: {
        // //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        // //             nodegroupid: '280b6cfc-4e4d-11ee-a340-0242ac140007',
        // //             tileid: "['init-step']['app-id'][0]['licenseNumberTileId']",
        // //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
        // //             hiddenNodes: [
        // //               '280b78fa-4e4d-11ee-a340-0242ac140007',
        // //               '280b7a9e-4e4d-11ee-a340-0242ac140007',
        // //               '280b7238-4e4d-11ee-a340-0242ac140007'
        // //             ],
        // //             labels: [['Cross Reference', 'License Number']]
        // //           }
        // //         },
        // //         {
        // //           componentName: 'default-card-util',
        // //           uniqueInstanceName: 'cm-ref',
        // //           tilesManaged: 'one',
        // //           parameters: {
        // //             graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
        // //             nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
        // //             resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
        // //             tileid: "['app-details-step']['cm-ref'][0]['tileId']",
        // //             hiddenNodes: [
        // //               '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
        // //               '589d4dcc-edf9-11eb-ae7b-a87eeabdefba',
        // //               '589d4dca-edf9-11eb-83ea-a87eeabdefba'
        // //             ],
        // //             prefilledNodes: [
        // //               // Source set to Heritage Environment Record Number
        // //               [
        // //                 '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
        // //                 '19afd557-cc21-44b4-b1df-f32568181b2c'
        // //               ]
        // //             ],
        // //             labels: [['Cross Reference', 'CM Reference']]
        // //           }
        // //         }
        // //       ]
        // //     }
        // //   ]
        // // },
        // {
        //   title: 'Excavation Report',
        //   name: 'excavation-report-step',
        //   workflowstepclass: 'workflow-form-component',
        //   required: false,
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'fetch-generated-license-number',
        //           uniqueInstanceName: 'app-status',
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: 'ee5947c6-48b2-11ee-abec-0242ac140007',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
        //           }
        //         },
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'report-info',
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: 'f060583a-6120-11ee-9fd1-0242ac120003',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
        //           }
        //         },
        //         {
        //           /**
        //            * Using custom component to handle the creation of Digital
        //            * Objects that will then be automatically named and related
        //            * to the Excavation License model.
        //            */
        //           componentName: 'related-document-upload',
        //           uniqueInstanceName: 'report-documents',
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
        //             nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',
        //             resourceModelId: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
        //             resourceModelDigitalObjectNodeGroupId: '316c7d1e-8554-11ea-aed7-f875a44e0e11',
        //             fileObjectNamePrefix: 'Site report files for '
        //           }
        //         }
        //       ]
        //     }
        //   ]
        // },
        // {
        //   title: 'Cover Letter',
        //   name: 'cover-letter-step',
        //   required: false,
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'license-cover-letter',
        //           uniqueInstanceName: 'cover-letter',
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: '0dcf7c74-53d5-11ee-844f-0242ac130008',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
        //           }
        //         }
        //       ]
        //     }
        //   ]
        // },
        // {
        //   title: 'Ammendments',
        //   name: 'ammendments-step',
        //   workflowstepclass: 'workflow-form-component',
        //   required: false,
        //   layoutSections: [
        //     {
        //       title: 'Re-assignments',
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card-util',
        //           uniqueInstanceName: 'former-licensee',
        //           tilesManaged: 'one',
        //           parameters: {
        //             cardTitle: 'Transfer of Licence',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: '6d290832-5891-11ee-a624-0242ac120004',
        //             semanticName: 'Contacts',
        //             hiddenNodes: [
        //               // '35bac0cc-b550-11ee-9a9d-0242ac120007', // former_licensee,
        //               '6d29144e-5891-11ee-a624-0242ac120004', // planning_officer_metatype,
        //               '6d2916d8-5891-11ee-a624-0242ac120004', // company_role_metatype,
        //               '6d2919b2-5891-11ee-a624-0242ac120004', // company_role_type,
        //               '6d2921fa-5891-11ee-a624-0242ac120004', // excavation_director_role_type,
        //               '6d2924b6-5891-11ee-a624-0242ac120004', // applicant,
        //               '6d292772-5891-11ee-a624-0242ac120004', // applicant_role_metatype,
        //               '6d292a2e-5891-11ee-a624-0242ac120004', // excavation_director,
        //               '6d292cf4-5891-11ee-a624-0242ac120004', // applicant_role_type,
        //               '6d292f88-5891-11ee-a624-0242ac120004', // company,
        //               '6d29323a-5891-11ee-a624-0242ac120004', // excavation_director_role_metatype,
        //               '6d293532-5891-11ee-a624-0242ac120004', // planning_officer,
        //               '6d29392e-5891-11ee-a624-0242ac120004', // planning_officer_role_type,
        //               '6d2941f8-5891-11ee-a624-0242ac120004', // licensee_role_metatype,
        //               '6d2944f0-5891-11ee-a624-0242ac120004' // licensee_role_type,
        //               //'6d294784-5891-11ee-a624-0242ac120004' // licensee
        //             ],
        //             labels: [
        //               ['Former Licensee', 'Former licensee(s)'],
        //               ['Licensees', 'New licensee']
        //             ],
        //             tileid: "['app-details-step']['app-contacts'][0]['tileId']"

        //             // tileid: '[app-details-step][app-contacts][0][tileId]'
        //           }
        //         },
        //         {
        //           componentName: 'default-card-util',
        //           uniqueInstanceName: 'assignment-decision-made-by',
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: '2749ea5a-48cb-11ee-be76-0242ac140007',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
        //             labels: [
        //               ['Decision Made', 'Cur grade D decision'],
        //               ['Decision Approved By', 'Decision made by'],
        //               ['Decision Date', 'Issued']
        //             ],
        //             hiddenNodes: [
        //               '246252e0-69ab-11ee-942a-0242ac130002', // license_valid_from_date,
        //               '25f04f6c-48cd-11ee-94b3-0242ac140007', // decision_type,
        //               'f3dcbf02-48cb-11ee-9081-0242ac140007', // decision_made_by,
        //               'f6c207ae-5938-11ee-9e74-0242ac130007', // decision_notes,
        //               'f8765744-69aa-11ee-942a-0242ac130002' // license_valid_to_date,
        //               //'4c58921e-48cc-11ee-9081-0242ac140007' // decision_date,
        //               //'ca121106-69ad-11ee-931f-0242ac130002', // decision_approved_by
        //             ],
        //             prefilledNodes: [
        //               [
        //                 '25f04f6c-48cd-11ee-94b3-0242ac140007',
        //                 '477f886b-dc83-4858-95e4-2374c3ec6e4d'
        //               ]
        //             ]
        //           }
        //         },
        //         {
        //           componentName: 'default-card-util',
        //           uniqueInstanceName: 'extension-decision-made-by',
        //           tilesManaged: 'many',
        //           parameters: {
        //             cardTitle: 'Extension of Licence',
        //             graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
        //             nodegroupid: '2749ea5a-48cb-11ee-be76-0242ac140007',
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

        //             // tileid: 'd59339e0-5807-4956-ab75-90058a1fbb77',
        //             // tileid: "['app-details-step']['cm-ref'][0]['tileId']",

        //             labels: [
        //               ['Decision Made', 'Cur grade E decision'],
        //               ['Decision Approved By', 'Approved By (D)'],
        //               ['Decision Made By', 'Requested by'],
        //               ['License Valid From Date', 'Valid from'],
        //               ['License Valid To Date', 'Valid until']
        //             ],
        //             prefilledNodes: [
        //               [
        //                 '25f04f6c-48cd-11ee-94b3-0242ac140007',
        //                 'bab6bee2-30d1-487c-9b58-a0abfddeb39a'
        //               ]
        //             ],
        //             hiddenNodes: [
        //               // '246252e0-69ab-11ee-942a-0242ac130002', // license_valid_from_date,
        //               '25f04f6c-48cd-11ee-94b3-0242ac140007', // decision_type,
        //               // 'f3dcbf02-48cb-11ee-9081-0242ac140007', // decision_made_by,
        //               'f6c207ae-5938-11ee-9e74-0242ac130007', // decision_notes,
        //               // 'f8765744-69aa-11ee-942a-0242ac130002', // license_valid_to_date,
        //               '4c58921e-48cc-11ee-9081-0242ac140007' // decision_date,
        //               // 'ca121106-69ad-11ee-931f-0242ac130002' // decision_approved_by
        //             ]
        //           }
        //         }
        //       ]
        //     }
        //   ]
        // },
        // {
        //   title: 'Summary',
        //   name: 'license-complete',
        //   required: false,
        //   informationboxdata: {
        //     heading: 'Workflow Complete: Review your work',
        //     text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over'
        //   },
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'license-final-step',
        //           uniqueInstanceName: 'license-final',
        //           tilesManaged: 'none',
        //           parameters: {
        //             resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
        //           }
        //         }
        //       ]
        //     }
        //   ]
        // }
      ];

      OpenableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
