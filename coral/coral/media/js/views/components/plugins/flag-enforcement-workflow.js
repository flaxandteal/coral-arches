define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/flag-enforcement-workflow.htm',
  'views/components/workflows/flag-enforcement-workflow/flag-enforcement-summary'
  // 'views/components/workflows/licensing-workflow/widget-labeller'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('flag-enforcement-workflow', {
    viewModel: function (params) {
      this.componentName = 'flag-enforcement-workflow';

      this.stepConfig = [
        {
          title: 'Selected Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'con-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    hiddenNodes: [
                      '6a94dbfc-2d16-4534-8e63-1cbb8d643335',
                      '0629475d-a758-4483-8481-8d68025a28a7'
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Enforcement',
          name: 'enforcement-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'enforcement',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '8e5cdd80-7fc9-11ee-b550-0242ac130008',
                    resourceid: "['init-step']['con-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Summary',
          name: 'summary-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'flag-enforcement-summary',
                  uniqueInstanceName: 'summary',
                  tilesManaged: 'none',
                  parameters: {
                    resourceid: "['init-step']['con-id'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        }
      ];

      EditableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
