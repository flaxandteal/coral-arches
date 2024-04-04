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
          name: 'initial-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
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
          title: 'Second step',
          name: 'second-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
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
        }
      ];

      this.workflow2 = [
        {
          title: 'Initial step',
          name: 'initial-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
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
        }
      ];

      this.workflow3 = [
        {
          title: 'Initial step',
          name: 'initial-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
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
        }
      ];

      // this.chainedConfig = {
      //   'workflow-1': {
      //     name: 'Workflow 1',
      //     config: this.workflow1
      //   },
      //   'workflow-2': {
      //     name: 'Workflow 2',
      //     config: this.workflow2
      //   },
      //   'workflow-3': {
      //     name: 'Workflow 3',
      //     config: this.workflow3
      //   }
      // };
      // this.currentWorkflow = 'workflow-1';
      // this.stepConfig = this.chainedConfig[this.currentWorkflow].config;

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

      this.stepConfig = this.chainedConfig[0].config;

      ChainedWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
