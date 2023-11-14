define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/monument-revision-workflow.htm'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('monument-revision-workflow', {
    viewModel: function (params) {
      this.componentName = 'monument-revision-workflow';
      this.stepConfig = [
        {
          title: 'Selected Monument',
          name: 'init-step',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635b60-eabf-11ed-9e22-72d420f37f11',
                    hiddenNodes: [
                      '4264ab14-eabf-11ed-9e22-72d420f37f11',
                      '42649ca0-eabf-11ed-9e22-72d420f37f11'
                    ]
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
