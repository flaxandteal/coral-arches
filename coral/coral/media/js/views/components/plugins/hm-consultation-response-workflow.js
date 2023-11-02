define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/hm-consultation-response-workflow.htm',
  'views/components/workflows/planning-consultation/consultation-select-step'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('hm-consultation-response-workflow', {
    viewModel: function (params) {
      this.componentName = 'hm-consultation-response-workflow';

      console.log('hm-consultation-response-workflow');

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
          title: 'Second Step',
          name: 'second-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'select-step',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                //     nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4'
                //   }
                // }
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
