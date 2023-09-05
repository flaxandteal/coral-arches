define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/licensing-workflow.htm',
  'views/components/workflows/licensing-workflow/initial-step',
  'views/components/workflows/excavation-workflow/asset-reference-card',
  'views/components/workflows/excavation-workflow/collecting-information-step',
  'views/components/workflows/excavation-workflow/protection-of-wrecks-card',
  'views/components/workflows/excavation-workflow/single-widget-with-label',
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
          name: 'app-details-step' /* unique to workflow */,
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Application Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'single-widget-with-label',
                  uniqueInstanceName: 'site-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    label: 'Site Name',
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']"
                  }
                },
                // {
                //   componentName: 'grouping-card',
                //   uniqueInstanceName: 'townland-name' ,
                //   tilesManaged: 'multi',
                //   parameters: {
                //     graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //     nodegroupid: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
                //     hiddenNodes: [
                //       ''
                //     ],
                //     renderContext: 'workflow',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'location-names' ,
                //   tilesManaged: 'many',
                //   parameters: {
                //     graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //     nodegroupid: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
                //     hiddenNodes: [
                //       'a541922b-f121-11eb-a081-a87eeabdefba'
                //     ],
                //     renderContext: 'workflow',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'address-info' ,
                //   tilesManaged: 'many',
                //   parameters: {
                //     graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //     nodegroupid: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
                //     hiddenNodes: [
                //       'a541922b-f121-11eb-a081-a87eeabdefba'
                //     ],
                //     renderContext: 'workflow',
                //     resourceid: "['init-step']['app-id'][0]['resourceid']['actResourceId']",
                //   }
                // },
                {
                  componentName: 'single-widget-with-label',
                  uniqueInstanceName: 'bfile-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    hiddenNodes: [
                      '589d4dca-edf9-11eb-83ea-a87eeabdefba',
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba',
                    ],
                    label: 'B-File / CM number',
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                {
                  componentName: 'asset-reference-card',
                  uniqueInstanceName: 'asset-names' ,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                {
                  componentName: 'single-widget-with-label',
                  uniqueInstanceName: 'license-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    label: 'Applicant / Licensee',
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '2a5b99a9-fe48-11ea-9deb-f875a44e0e11',
                    renderContext: 'workflow',
                    hiddenNodes: [
                      '2a5bc0a2-fe48-11ea-ae9c-f875a44e0e11',
                      '2a5bc0a6-fe48-11ea-b5a3-f875a44e0e11',
                      '2a5bc0a5-fe48-11ea-8aeb-f875a44e0e11',
                      '2a5b99ae-fe48-11ea-aa8a-f875a44e0e11',
                      '2a5bc0a8-fe48-11ea-b191-f875a44e0e11',
                      '2a5bc0a4-fe48-11ea-b3d7-f875a44e0e11'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'single-widget-with-label',
                  uniqueInstanceName: 'company-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    label: 'Company',
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '2a5b99a9-fe48-11ea-9deb-f875a44e0e11',
                    renderContext: 'workflow',
                    hiddenNodes: [
                      '2a5bc0a2-fe48-11ea-ae9c-f875a44e0e11',
                      '2a5bc0a6-fe48-11ea-b5a3-f875a44e0e11',
                      '2a5bc0a5-fe48-11ea-8aeb-f875a44e0e11',
                      '2a5b99ae-fe48-11ea-aa8a-f875a44e0e11',
                      '2a5bc0a8-fe48-11ea-b191-f875a44e0e11',
                      '2a5bc0a4-fe48-11ea-b3d7-f875a44e0e11'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'protection-of-wrecks-card',
                  uniqueInstanceName: 'pow-details' ,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    hiddenNodes: [
                      // '589d4dca-edf9-11eb-83ea-a87eeabdefba',
                      '589d4dcd-edf9-11eb-8a7d-a87eeabdefba',
                      '589d4dcc-edf9-11eb-ae7b-a87eeabdefba',
                    ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                
                {
                  componentName: 'single-widget-with-label',
                  uniqueInstanceName: 'activity-description' ,
                  tilesManaged: 'one',
                  parameters: {
                    label: 'Submission Details',
                    widget_type: 'rich-text-widget',
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a472226f-9937-11ea-966a-f875a44e0e11',
                    hiddenNodes: [
                      'a4724977-9937-11ea-a11e-f875a44e0e11'
                    ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'activity-times' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4f5ec415-993e-11ea-bab0-f875a44e0e11',
                    hiddenNodes: [
                      '4f5eeb2a-993e-11ea-a2db-f875a44e0e11'
                    ],
                    renderContext: 'workflow',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
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
