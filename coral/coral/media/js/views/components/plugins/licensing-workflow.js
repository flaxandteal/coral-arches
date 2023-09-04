define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/licensing-workflow.htm',
  'views/components/workflows/excavation-workflow/asset-reference-card',
  'views/components/workflows/excavation-workflow/collecting-information-step',
  'views/components/workflows/excavation-workflow/bfile-card',
], function (ko, arches, Workflow, licensingWorkflowTemplate) {
  return ko.components.register('licensing-workflow', {
    viewModel: function (params) {
      this.componentName = 'licensing-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Excavation',
          name: 'init-name-step' /* unique to workflow */,
          required: false,
          informationboxdata: {
            heading: 'Initialise Excavation'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'application-id-instance' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
                    renderContext: 'workflow',
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
                  componentName: 'collecting-information-step',
                  uniqueInstanceName: 'site-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
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
                //     resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //   }
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-names' ,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
                    hiddenNodes: [
                      'a541922b-f121-11eb-a081-a87eeabdefba'
                    ],
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'bfile-card',
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
                    label: 'B-File/CM number',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

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
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'license-name' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'pow-details' ,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'activity-description' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a472226f-9937-11ea-966a-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'activity-times' ,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4f5ec415-993e-11ea-bab0-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
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
