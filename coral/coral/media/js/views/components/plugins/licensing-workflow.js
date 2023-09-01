define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/licensing-workflow.htm'
], function (ko, arches, Workflow, licensingWorkflowTemplate) {
  return ko.components.register('licensing-workflow', {
    viewModel: function (params) {
      this.componentName = 'licensing-workflow';
      this.stepConfig = [
        {
          title: '',
          name: 'init-step',
          required: false,
          informationboxdata: {
            heading: '',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: []
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
