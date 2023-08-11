define([
  'knockout',
  'jquery',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/excavation-workflow.htm',
  'views/components/workflows/excavation-workflow/excavation-final-step'
], function (ko, $, arches, Workflow, excavationWorkflow) {
  return ko.components.register('excavation-workflow', {
    viewModel: function (params) {
      this.componentName = 'excavation-workflow';

      this.stepConfig = [
        {
          title: 'Excavation Name',
          name: 'init-step' /* unique to workflow */,
          required: true,
          informationboxdata: {
            heading: 'Excavation Name',
            text: 'Assign a name for your excavation application.',
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '06c58e13-c97c-405a-a07f-0db5894a7c5a',
                    nodegroupid: 'f8300954-4e8f-4388-a4dc-27483b7aa19e'
                  }
                }
              ]
            }
          ]
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: excavationWorkflow
  });
});
