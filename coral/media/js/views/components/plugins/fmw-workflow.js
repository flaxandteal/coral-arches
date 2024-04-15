define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('fmw-workflow', {
    viewModel: function (params) {
      this.componentName = 'fmw-workflow';
      this.stepConfig = [
        {
          title: 'Start',
          name: 'start-step',
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
                    graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                    nodegroupid: 'b37552ba-9527-11ea-96b5-f875a44e0e11'
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
