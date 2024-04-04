define([
  'knockout',
  'arches',
  'viewmodels/chained-workflow',
  'templates/views/components/plugins/chained-workflow.htm',
  'views/components/workflows/select-resource-id',
  'views/components/workflows/default-card-util'
], function (ko, arches, ChainedWorkflow, workflowTemplate) {
  return ko.components.register('site-visit-workflow', {
    viewModel: function (params) {
      this.componentName = 'site-visit-workflow';

      this.workflow1 = [
        {
          title: 'Initial step',
          name: 'workflow-1-step-1',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'workflow-1-comp-1',
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
          title: 'Second step',
          name: 'workflow-1-step-2',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'workflow-1-comp-1',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007'
                  }
                }
              ]
            }
          ]
        }
      ];

      this.workflow2 = [
        {
          title: 'Initial step',
          name: 'workflow-2-step-1',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'workflow-2-comp-1',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007'
                  }
                }
              ]
            }
          ]
        }
      ];

      this.workflow3 = [
        {
          title: 'Initial step',
          name: 'workflow-3-step-1',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'workflow-3-comp-1',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd',
                    nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007'
                  }
                }
              ]
            }
          ]
        }
      ];

      this.chainedConfig = [
        {
          name: 'workflow-1',
          title: 'Workflow 1',
          config: this.workflow1,
          required: false
        },
        {
          name: 'workflow-2',
          title: 'Workflow 2',
          config: this.workflow2,
          required: false
        },
        {
          name: 'workflow-3',
          title: 'Workflow 3',
          config: this.workflow3,
          required: false
        }
      ];

      ChainedWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
