define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/merge-workflow/submit-merge',
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
        //   required: true,
        //   workflowstepclass: 'workflow-form-component',
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'map-locations',
        //           tilesManaged: 'none',
        //           parameters: {}
        //         }
        //       ]
        //     }
        //   ]
        // },
        // {
        //   title: 'Map of Locations',
        //   name: 'locations-step',
        //   required: true,
        //   workflowstepclass: 'workflow-form-component',
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'base-record-legacy-id',
        //           tilesManaged: 'none',
        //           parameters: {}
        //         }
        //       ]
        //     },
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'merge-record-legacy-id',
        //           tilesManaged: 'none',
        //           parameters: {}
        //         }
        //       ]
        //     },
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'notes',
        //           tilesManaged: 'none',
        //           parameters: {}
        //         }
        //       ]
        //     }
        //   ]
        // },
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
        },
      ];

      OpenableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
