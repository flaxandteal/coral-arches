define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/default-card-util',
  'views/components/workflows/licensing-workflow/licence-initial-step',
  'views/components/workflows/related-document-upload',
  'views/components/workflows/licensing-workflow/licence-cover-letter',
  'views/components/workflows/file-template',
  'views/components/workflows/licensing-workflow/licence-final-step',
  'views/components/workflows/licensing-workflow/fetch-generated-licence-number',
  'views/components/workflows/licensing-workflow/fetch-updated-dates',
  'views/components/workflows/licensing-workflow/transfer-of-licence',
  'views/components/workflows/licensing-workflow/transfer-of-licence',
  'views/components/workflows/fetch-latest-tile'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('licensing-workflow', {
    viewModel: function (params) {
      this.componentName = 'licensing-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Excavation Licence',
          name: 'init-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          hiddenWorkflowButtons: ['undo'],
          informationboxdata: {
            heading: 'Important Information',
            text: 'Please note that it could take up to a minute to complete the initialisation for the Licence application. If something goes wrong during the process an error will be displayed to you.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'licence-initial-step',
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
          required: false,
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
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    tileid: "['init-step']['app-id'][0]['resourceid']['cmRefTileId']"
                  }
                },
                {
                  componentName: 'fetch-latest-tile',
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
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    nodeOptions: {
                    "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "1add78d0-c450-11ee-8be7-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "239c373a-c451-11ee-8be7-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "684110e4-48ce-11ee-8e4e-0242ac140007": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "c6f09242-c4d2-11ee-b171-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "1add78d0-c450-11ee-8be7-0242ac180006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "59b77af6-dc6f-11ee-8def-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    },
                    "0a089af2-dc7a-11ee-8def-0242ac120006": {
                      "config":{
                        "maxDate":"today"
                      }
                    }
                  }
                  }
                },
                {
                  componentName: 'fetch-generated-licence-number',
                  uniqueInstanceName: 'application-details',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    tileid: "['init-step']['app-id'][0]['resourceid']['applicationDetailsTileId']"
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
                    parenttileid:
                      "['init-step']['app-id'][0]['resourceid']['activityLocationTileId']",
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
                      //'a541e034-f121-11eb-8803-0242ac120003', // county_value,
                      'a541e035-f121-11eb-a3d9-a87eeabdefba' // street_metatype
                    ]
                  }
                },
                {
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    nodegroupid: '5f81a8d4-d7de-11ee-b2c1-0242ac120006',
                    parenttileid:
                      "['init-step']['app-id'][0]['resourceid']['activityLocationTileId']",
                    semanticName: 'Council'
                  },
                  tilesManaged: 'one',
                  componentName: 'default-card',
                  uniqueInstanceName: 'e0a60085-eeeb-44e0-83de-2dcb5ad38d95'
                },
                {
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    nodegroupid: '33b4430a-16be-11ef-8633-0242ac180006',
                    parenttileid:
                      "['init-step']['app-id'][0]['resourceid']['activityLocationTileId']",
                    semanticName: 'Irish Grid Reference'
                  },
                  tilesManaged: 'one',
                  componentName: 'fetch-latest-tile',
                  uniqueInstanceName: 'irish-grid-reference'
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-description',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b40-f121-11eb-9cb6-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid:
                      "['init-step']['app-id'][0]['resourceid']['activityLocationTileId']",
                    hiddenNodes: ['a5419231-f121-11eb-911a-a87eeabdefba']
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
                  componentName: 'fetch-latest-tile',
                  uniqueInstanceName: 'geometry-info',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a541560c-f121-11eb-aa92-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    parenttileid:
                      "['init-step']['app-id'][0]['resourceid']['activityLocationTileId']"
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
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    nodeOptions: {
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Record Decision',
          name: 'record-decision-step',
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
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']",
                    nodeOptions: {
                      "69f30298-c430-11ee-94bf-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                },
                {
                  componentName: 'fetch-generated-licence-number',
                  uniqueInstanceName: 'grade-d-decision',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'c9f504b4-c42d-11ee-94bf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']",
                    nodeOptions: {
                      "c9f51490-c42d-11ee-94bf-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                },
                {
                  componentName: 'fetch-updated-dates',
                  uniqueInstanceName: 'licence-valid-timespan',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '1887f678-c42d-11ee-bc4b-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['init-step']['app-id'][0]['resourceid']['decisionTileId']",
                    nodeOptions: {
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                },
                {
                  componentName: 'fetch-generated-licence-number',
                  uniqueInstanceName: 'application-details',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    tileid: "['init-step']['app-id'][0]['resourceid']['applicationDetailsTileId']",
                    hiddenNodes: [
                      '777596ba-48cf-11ee-8e4e-0242ac140007',
                      'aec103a2-48cf-11ee-8e4e-0242ac140007',
                      'c2f40174-5dd5-11ee-ae2c-0242ac120008'
                    ]
                  }
                },
                {
                  componentName: 'fetch-latest-tile',
                  uniqueInstanceName: 'licence-number',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '6de3741e-c502-11ee-86cf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'cm-reference',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'b84fa9c6-bad2-11ee-b3f2-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    tileid: "['init-step']['app-id'][0]['resourceid']['cmRefTileId']"
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
          name: 'ea74e8cb-ce03-49c6-aeef-b5a0e62f8cdf',
          title: 'Letter',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '976e49fe-3928-11ef-ab34-0242ac140006',
                      '21319570-3928-11ef-b242-0242ac140006'
                    ],
                    nodegroupid: '87bdb8d8-3927-11ef-ab34-0242ac140006',
                    semanticName: 'Correspondence',
                    letterMetatype: '976e49fe-3928-11ef-ab34-0242ac140006',
                    letterTypeNode: '56364572-3928-11ef-b242-0242ac140006',
                    letterResourceNode: '21319570-3928-11ef-b242-0242ac140006'
                  },
                  noTileSidebar: true,
                  tilesManaged: 'many',
                  componentName: 'file-template',
                  uniqueInstanceName: 'letter-template'
                }
              ]
            }
          ],
          workflowstepclass: 'workflow-form-component'
        },
        {
          title: 'Amendments',
          name: 'amendments-step',
          workflowstepclass: 'workflow-form-component',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'transfer-of-licence',
                  componentName: 'transfer-of-licence',
                  uniqueInstanceName: 'transfer-of-licence',
                  tilesManaged: 'many',
                  manyTitle: 'Transfers',
                  manyTitle: 'Transfers',
                  parameters: {
                    title: 'Transfer of Licence',
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '6397b05c-c443-11ee-94bf-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    nodeOptions: {
                      "058ccf60-c44d-11ee-94bf-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "43ec68d6-c445-11ee-8be7-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "6bc892c8-c44d-11ee-94bf-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'extension-of-licence',
                  tilesManaged: 'many',
                  parameters: {
                    title: 'Extension of Licence',
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '69b2738e-c4d2-11ee-b171-0242ac180006',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    nodeOptions: {
                      "2e7a876e-c4d4-11ee-b171-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "50970864-c4d3-11ee-90c5-0242ac180006": {
                        "allowInstanceCreation": false
                      },
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        /**
         * TODO: Excavation Report Step
         *
         * This needs to be dicussed. Adding a many tile with a file upload that also uses
         * a custom component specifically for it isn't an easy task. It would make more
         * sense for this to be it's own workflow.
         */
        {
          title: 'Excavation Report',
          name: 'excavation-report-step',
          workflowstepclass: 'workflow-form-component',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card', // Has fix for many tiles
                  uniqueInstanceName: 'report-info',
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'f060583a-6120-11ee-9fd1-0242ac120003',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    nodeOptions: {
                      "d8f74d42-dc6e-11ee-8def-0242ac120006": {
                        "node": {
                          "isrequired": true
                        }
                      },
                      "5707d294-dc72-11ee-b70c-0242ac120006": {
                        "allowInstanceCreation": false
                      },
                      "ed16bb80-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1887faf6-c42d-11ee-bc4b-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "239c373a-c451-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "ea6ea7a8-dc70-11ee-b70c-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        },
                        "node": { 
                          "isrequired": true
                        }
                      },
                      "97f6c776-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "684110e4-48ce-11ee-8e4e-0242ac140007": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "c6f09242-c4d2-11ee-b171-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "1add78d0-c450-11ee-8be7-0242ac180006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "58880bd6-5d4a-11ee-9b75-0242ac130003": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "59b77af6-dc6f-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      },
                      "0a089af2-dc7a-11ee-8def-0242ac120006": {
                        "config":{
                          "maxDate":"today"
                        }
                      }
                    }
                  }
                },
                {
                  /**
                   * Using custom component to handle the creation of Digital
                   * Objects that will then be automatically named and related
                   * to the Excavation Licence model.
                   */
                  componentName: 'related-document-upload',
                  uniqueInstanceName: 'report-documents',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
                    nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',
                    resourceModelId:
                      "['init-step']['app-id'][0]['resourceid']['activityResourceId']",
                    resourceModelDigitalObjectNodeGroupId: '316c7d1e-8554-11ea-aed7-f875a44e0e11',
                    fileObjectNamePrefix: 'Site report files for '
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Summary',
          name: 'licence-complete',
          required: false,
          informationboxdata: {
            heading: 'Workflow Complete: Review your work',
            text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'licence-final-step',
                  uniqueInstanceName: 'licence-final',
                  tilesManaged: 'none',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        }
      ];

      OpenableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
