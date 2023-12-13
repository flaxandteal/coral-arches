define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/default-workflow.htm'
], function (ko, arches, Workflow, workflowTemplate) {
  return ko.components.register('workflow-builder-loader', {
    viewModel: function (params) {
      this.componentName = params.plugin.slug;

      console.log('params: ', params);
      this.stepConfig = params.stepData;

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
