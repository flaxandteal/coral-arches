define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('monument-update-workflow', {
    viewModel: function (params) {
      this.componentName = 'monument-update-workflow';
      this.stepConfig = [
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
                  uniqueInstanceName: 'system-reference',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '65b1be1a-dfa4-49cf-a736-a1a88c0bb289',
                    nodegroupid: 'cbf55769-eaf1-4074-84d9-8a47310dfbc2'
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