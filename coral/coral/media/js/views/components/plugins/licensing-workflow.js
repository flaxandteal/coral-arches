define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/licensing-workflow.htm',
  'views/components/workflows/licensing-workflow/initial-step',
  'views/components/workflows/licensing-workflow/widget-labeller',
  'views/components/workflows/licensing-workflow/resource-instance-select-config',
  'views/components/workflows/licensing-workflow/license-cover-letter',
  'views/components/workflows/licensing-workflow/license-final-step',
  'views/components/workflows/excavation-workflow/collecting-information-step',
  'views/components/workflows/excavation-workflow/protection-of-wrecks-card',
  'views/components/workflows/excavation-workflow/single-widget-with-label',
  'views/components/workflows/excavation-workflow/multi-widget-with-labels',
  'views/components/workflows/related-document-upload'
], function (ko, arches, Workflow, licensingWorkflowTemplate) {
  return ko.components.register('licensing-workflow', {
    viewModel: function (params) {
      this.componentName = 'licensing-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Excavation License',
          name: 'init-step',
          required: false,
          informationboxdata: {
            heading: 'Initialise Excavation'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'initial-step',
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
          informationboxdata: {
            heading: 'Application Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'site-name',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    hiddenNodes: [
                      '4a7bba20-9938-11ea-92e7-f875a44e0e11',
                      '4a7bba21-9938-11ea-8f0f-f875a44e0e11'
                    ],
                    labels: [['Activity Name', 'Site Name']]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'address-info' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
                    hiddenNodes: [
                      'a541922b-f121-11eb-a081-a87eeabdefba',
                      'a5419222-f121-11eb-8b1f-a87eeabdefba',
                      'a541e02a-f121-11eb-83b2-a87eeabdefba',
                      'a541e02d-f121-11eb-b36f-a87eeabdefba'
                    ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['actLocTileId']",

                  }
                },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'grid-info' ,
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //     nodegroupid: 'a5416b43-f121-11eb-b691-a87eeabdefba',
                //     // hiddenNodes: [
                //     //   'a541922b-f121-11eb-a081-a87eeabdefba',
                //     //   'a5419222-f121-11eb-8b1f-a87eeabdefba',
                //     //   'a541e02a-f121-11eb-83b2-a87eeabdefba',
                //     //   'a541e02d-f121-11eb-b36f-a87eeabdefba'
                //     // ],
                //     renderContext: 'workflow',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                //     parenttileid: "['init-step']['app-id'][0]['actLocTileId']",

                //   }
                // },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'location-names' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
                    labels: [
                      ['Area Name', 'Additional Area Name'],
                      ['Area Type', 'Area Type For Additional Name']
                    ],
                    hiddenNodes: [
                      'a541922b-f121-11eb-a081-a87eeabdefba'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['actLocTileId']",
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'b-file-no',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    hiddenNodes: [
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba',
                      '589d4dca-edf9-11eb-83ea-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      // Source set to Heritage Environment Record Number
                      ['589d4dcd-edf9-11eb-8a7d-a87eeabdefba', '19afd557-cc21-44b4-b1df-f32568181b2c']
                    ],
                    labels: [['Cross Reference', 'B-File / CM number']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'license-no',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    hiddenNodes: [
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba',
                      '589d4dca-edf9-11eb-83ea-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      // Source set to Excavation
                      ['589d4dcd-edf9-11eb-8a7d-a87eeabdefba', '9a383c95-b795-4d76-957a-39f84bcee49e']
                    ],
                    labels: [['Cross Reference', 'License Number (if applicable)']]
                  }
                },
                
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'asset-refs',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    hiddenNodes: [
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      // Source set to Monument
                      ['589d4dcd-edf9-11eb-8a7d-a87eeabdefba', 'df585888-b45c-4f48-99d1-4cb3432855d5']
                    ],
                    labels: [
                      ['Cross Reference', 'Asset Reference'],
                      ['Cross Reference Note', 'Asset Reference Note']
                    ]
                  }
                },
                
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'company-name' ,
                //   tilesManaged: 'one',
                //   parameters: {
                //     labels: [['Person or Organization','Please Select Company and Applicant']],
                //     graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                //     graphids: ['d4a88461-5463-11e9-90d9-000d3ab1e588'],
                //     nodegroupid: 'f5565c2c-48b6-11ee-85af-0242ac140007',
                //     renderContext: 'workflow',
                //     hiddenNodes: [
                //       'f5565c2c-48b6-11ee-85af-0242ac140007',
                //       'f55671b2-48b6-11ee-85af-0242ac140007',
                //       'f5565c2c-48b6-11ee-85af-0242ac140007',
                //       'f5566b40-48b6-11ee-85af-0242ac140007',
                //       'f5566cda-48b6-11ee-85af-0242ac140007',
                //       'f556699c-48b6-11ee-85af-0242ac140007',
                //       'f5566654-48b6-11ee-85af-0242ac140007',
                //       'f5567342-48b6-11ee-85af-0242ac140007'
                //     ],
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                //   }
                // },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'company-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    labels: [
                      ['Applicant','Please Select Company and Applicant'],
                      ['Owner', 'Land Owner']
                    ],
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '859ca092-521d-11ee-b790-0242ac120002',
                    renderContext: 'workflow',
                    hiddenNodes: [
                      '859cc43c-521d-11ee-b790-0242ac120002',
                      '859cbcd0-521d-11ee-b790-0242ac120002',
                      '859cb5b4-521d-11ee-b790-0242ac120002'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'sub-details',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '777596ba-48cf-11ee-8e4e-0242ac140007',
                      '916b5e7e-48cf-11ee-8e4e-0242ac140007'
                    ],
                    labels: [
                      ['Proposal Text', 'Submission Details'],
                      ['Digital File(s)', 'Submission Attachments']
                    ],
                    resourceModelId: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-step']['app-id'][0]['tileId']",
                    resourceModelDigitalObjectNodeGroupId: '4f0f655c-48cf-11ee-8e4e-0242ac140007'
                  }
                },
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'sub-files',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                //     nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                //     hiddenNodes: [
                //       'aec103a2-48cf-11ee-8e4e-0242ac140007',
                //       '777596ba-48cf-11ee-8e4e-0242ac140007',
                //       '916b5e7e-48cf-11ee-8e4e-0242ac140007'
                //     ],
                //     labels: [
                //       ['Digital File(s)', 'Submission Attachments']
                //     ],
                //     resourceModelId: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                //     resourceTileId: "['init-step']['app-id'][0]['tileId']",
                //     resourceModelDigitalObjectNodeGroupId: '4f0f655c-48cf-11ee-8e4e-0242ac140007'
                //   }
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-dates-and-status',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: 'ee5947c6-48b2-11ee-abec-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'decision-made-by',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '2749ea5a-48cb-11ee-be76-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'pow-ref',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    hiddenNodes: [
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      // Source set to Wreck
                      ['589d4dcd-edf9-11eb-8a7d-a87eeabdefba', 'c14def6d-4713-465f-9119-bc33f0d6e8b3']
                    ],
                    labels: [
                      ['Cross Reference', 'POW Reference'],
                      ['Cross Reference Note', 'POW Reference Note']
                    ]
                  }
                },
              ]
            }
          ]
        },
        {
          title: 'Location Details',
          name: 'location-details-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Location Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'geometry-info' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a541560c-f121-11eb-aa92-a87eeabdefba',
                    // hiddenNodes: [
                    //   'a541922b-f121-11eb-a081-a87eeabdefba',
                    //   'a5419222-f121-11eb-8b1f-a87eeabdefba',
                    //   'a541e02a-f121-11eb-83b2-a87eeabdefba',
                    //   'a541e02d-f121-11eb-b36f-a87eeabdefba'
                    // ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                    parenttileid: "['init-step']['app-id'][0]['actLocTileId']",

                  }
                },
              ]
            }
          ]
        },
        {
          title: 'Cover Letter',
          name: 'location-details-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Location Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'license-cover-letter',
                  uniqueInstanceName: 'cover-letter' ,
                  tilesManaged: 'none',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    // nodegroupid: 'a541560c-f121-11eb-aa92-a87eeabdefba',
                    // hiddenNodes: [
                    //   'a541922b-f121-11eb-a081-a87eeabdefba',
                    //   'a5419222-f121-11eb-8b1f-a87eeabdefba',
                    //   'a541e02a-f121-11eb-83b2-a87eeabdefba',
                    //   'a541e02d-f121-11eb-b36f-a87eeabdefba'
                    // ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                  }
                },
              ]
            }
          ]
        },
        {
          title: 'License Summary',
          name: 'license-complete',
          description: 'Choose an option below',
          component: 'views/components/workflows/component-based-step',
          componentname: 'component-based-step',
          layoutSections: [
              {
                  componentConfigs: [
                      { 
                          componentName: 'license-final-step',
                          uniqueInstanceName: 'license-final',
                          tilesManaged: 'none',
                          parameters: {
                              // digitalObject: "['upload-documents']['upload-documents-step']",
                              // consultationTileid: "['init-name-step']['application-id-instance']['tileid']",
                              activityResourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                              resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                          },
                      },
                  ], 
              },
          ],
          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
          nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea',
          icon: 'fa-check',
          resourceid: null,
          tileid: null,
          parenttileid: null,
          informationboxdata: {
              heading: 'Workflow Complete: Review your work',
              text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over',
          }
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: licensingWorkflowTemplate
  });
});
