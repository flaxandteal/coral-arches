define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/default-card-util'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('relate-two-monuments-workflow', {
    viewModel: function (params) {
      this.componentName = 'relate-two-monuments-workflow';
      this.stepConfig = [
        {
          title: 'Select Target Heritage Asset',
          name: 'target-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Target Heritage Asset',
            text: 'The monument selected here will be the Heritage Asset that is related to. The Heritage Asset selected on the second page will appear on this Heritage Asset.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'target-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    label: 'Name/SMR of the Heritage Asset',
                    getTileIdFromNodegroup: [
                      {
                        nodegroupId: '055b3e3f-04c7-11eb-8d64-f875a44e0e11',
                        lookupName: 'relatedMonuments'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Select Heritage Asset',
          name: 'relating-step',
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'relating-record',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '055b3e3f-04c7-11eb-8d64-f875a44e0e11',
                    resourceid: "['target-step']['target-record'][0]['selectedResourceId']",
                    tileid: "['target-step']['target-record'][0]['relatedMonuments']",
                    hiddenNodes: [
                      '055b3e42-04c7-11eb-a1a4-f875a44e0e11'
                    ]
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
