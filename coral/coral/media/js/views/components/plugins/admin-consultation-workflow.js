define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/admin-consultation-workflow.htm',
], function (ko, arches, Workflow, adminConsultationWorkflowTemplate) {
  return ko.components.register('admin-consultation-workflow', {
    viewModel: function (params) {
      this.componentName = 'admin-consultation-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Consultation Workflow',
          name: 'init-step',
          required: false,
          informationboxdata: {
            heading: 'Initialise Consultation'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'initial-step',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '',
                    nodegroupid: ''
                  }
                }
              ]
            }
          ]
        },
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: adminConsultationWorkflowTemplate
  });
});
