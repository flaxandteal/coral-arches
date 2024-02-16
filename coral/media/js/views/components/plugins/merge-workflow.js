define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/merge-workflow/submit-merge',
  // 'views/components/workflows/merge-workflow/heritage-asset-map'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('merge-workflow', {
    viewModel: function (params) {
      this.componentName = 'merge-workflow';
      this.stepConfig = [
        {
          title: 'Search',
          name: 'search-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'base-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    getTileIdFromNodegroup: [
                      {
                        nodegroupId: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                        lookupName: 'systemRef'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Merging',
          name: 'merging-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-id',
                  uniqueInstanceName: 'merge-record',
                  tilesManaged: 'none',
                  parameters: {
                    graphIds: [
                      '076f9381-7b00-11e9-8d6b-80000b44d1d9' // Monument
                    ],
                    label: 'Hello world',
                    getTileIdFromNodegroup: [
                      {
                        nodegroupId: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                        lookupName: 'systemRef'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        },
        // {
        //   title: 'Map of Locations',
        //   name: 'locations-step',
        //   required: false,
        //   workflowstepclass: 'workflow-form-component',
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'heritage-asset-map',
        //           uniqueInstanceName: 'map-locations',
        //           tilesManaged: 'none',
        //           parameters: {}
        //         }
        //       ]
        //     }
        //   ]
        // },
        {
          title: 'Information',
          name: 'information-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'base-record-legacy-id',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['search-step']['base-record'][0]['selectedResourceId']",
                    nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                    tileid: "['search-step']['base-record'][0]['systemRef']",
                    hiddenNodes: [
                      '325a2f33-efe4-11eb-b0bb-a87eeabdefba',
                      '325a430a-efe4-11eb-810b-a87eeabdefba'
                    ]
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'merge-record-legacy-id',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['merging-step']['merge-record'][0]['selectedResourceId']",
                    nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                    tileid: "['merging-step']['merge-record'][0]['systemRef']",
                    hiddenNodes: [
                      '325a2f33-efe4-11eb-b0bb-a87eeabdefba',
                      '325a430a-efe4-11eb-810b-a87eeabdefba'
                    ]
                  }
                }
              ]
            }
            // {
            //   componentConfigs: [
            //     {
            //       componentName: 'default-card',
            //       uniqueInstanceName: 'notes',
            //       tilesManaged: 'none',
            //       parameters: {}
            //     }
            //   ]
            // }
          ]
        },
        {
          title: 'Approval',
          name: 'approval-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'submit-merge',
                  uniqueInstanceName: 'approval',
                  tilesManaged: 'none',
                  parameters: {
                    baseResourceId: "['search-step']['base-record'][0]['selectedResourceId']",
                    mergeResourceId: "['merging-step']['merge-record'][0]['selectedResourceId']"
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
