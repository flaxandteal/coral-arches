define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm'
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('monument-revision-workflow', {
    viewModel: function (params) {
      this.componentName = 'monument-revision-workflow';
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
                  tilesManaged: 'none',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635b60-eabf-11ed-9e22-72d420f37f11'
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
