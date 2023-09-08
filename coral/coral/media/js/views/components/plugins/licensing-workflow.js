define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/licensing-workflow.htm',
  'views/components/workflows/licensing-workflow/initial-step',
  'views/components/workflows/licensing-workflow/widget-labeller',
  'views/components/workflows/licensing-workflow/resource-instance-select-config',
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
                    nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007'
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
                    labels: [
                      ['Cross Reference', 'Asset Reference'],
                      ['Cross Reference Note', 'Asset Reference Note']
                    ]
                  }
                },
                
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'company-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    labels: [['Person or Organization','Please Select Company and Applicant']],
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    graphids: ['d4a88461-5463-11e9-90d9-000d3ab1e588'],
                    nodegroupid: 'f5565c2c-48b6-11ee-85af-0242ac140007',
                    renderContext: 'workflow',
                    hiddenNodes: [
                      'f5565c2c-48b6-11ee-85af-0242ac140007',
                      'f55671b2-48b6-11ee-85af-0242ac140007',
                      'f5565c2c-48b6-11ee-85af-0242ac140007',
                      'f5566b40-48b6-11ee-85af-0242ac140007',
                      'f5566cda-48b6-11ee-85af-0242ac140007',
                      'f556699c-48b6-11ee-85af-0242ac140007',
                      'f5566654-48b6-11ee-85af-0242ac140007',
                      'f5567342-48b6-11ee-85af-0242ac140007'
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
                      '5d2ae012-48cf-11ee-8e4e-0242ac140007',
                      '777596ba-48cf-11ee-8e4e-0242ac140007',
                      '916b5e7e-48cf-11ee-8e4e-0242ac140007'
                    ],
                    labels: [
                      ['Proposal Text', 'Submission Details']
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'sub-files',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'aec103a2-48cf-11ee-8e4e-0242ac140007',
                      '777596ba-48cf-11ee-8e4e-0242ac140007',
                      '916b5e7e-48cf-11ee-8e4e-0242ac140007'
                    ],
                    labels: [
                      ['Digital File(s)', 'Submission Attachments']
                    ],
                    resourceModelId: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-step']['app-id'][0]['tileId']",
                    resourceModelDigitalObjectNodeGroupId: '4f0f655c-48cf-11ee-8e4e-0242ac140007'
                  }
                },
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
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'grid-info' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b43-f121-11eb-b691-a87eeabdefba',
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
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: licensingWorkflowTemplate
  });
});
