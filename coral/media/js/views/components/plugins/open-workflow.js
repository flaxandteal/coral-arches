define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'viewmodels/open-workflow',
  'templates/views/components/plugins/open-workflow.htm'
], function ($, ko, koMapping, arches, OpenWorkflow, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    OpenWorkflow.apply(this, [params]);
  };

  return ko.components.register('open-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
});
