define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/hm-consultation-response-workflow.htm',
  'views/components/workflows/select-resource-step'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('hm-consultation-response-workflow', {
    viewModel: function (params) {
      this.componentName = 'hm-consultation-response-workflow';

      console.log('hm-consultation-response-workflow');

      this.stepConfig = [
        {
          title: 'Select Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'select-resource-step',
                  uniqueInstanceName: 'select-step',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'cc5da227-24e7-4088-bb83-a564c4331efd'
                    // nodegroupid: '991c3c74-48b6-11ee-85af-0242ac140007',
                    // hiddenNodes: ['991c4340-48b6-11ee-85af-0242ac140007']
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
