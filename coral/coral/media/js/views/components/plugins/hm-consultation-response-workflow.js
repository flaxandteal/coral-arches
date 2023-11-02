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
          title: 'Select Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'consultation-select-step',
                  uniqueInstanceName: 'select-step',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    graphids: ['8effdca4-ffb6-482b-94b8-4d35fb5c88c5'],
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4'
                    // hiddenNodes: ['991c4340-48b6-11ee-85af-0242ac140007']
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
                {
                  componentName: 'consultation-select-step',
                  uniqueInstanceName: 'select-step',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    graphids: ['8effdca4-ffb6-482b-94b8-4d35fb5c88c5'],
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4'
                    // hiddenNodes: ['991c4340-48b6-11ee-85af-0242ac140007']
                  }
                }
                // {
                //   componentName: 'select-resource-step',
                //   uniqueInstanceName: 'select-step',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                //     graphids: ['8effdca4-ffb6-482b-94b8-4d35fb5c88c5'],
                //     nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4'
                //     // hiddenNodes: ['991c4340-48b6-11ee-85af-0242ac140007']
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
