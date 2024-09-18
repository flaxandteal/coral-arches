define([
  'knockout',
  'arches',
  'viewmodels/openable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/default-card-util',
  'views/components/workflows/workflow-builder-initial-step',

  // Not the way I want this implemented but this will allow the use
  // of custom components
  'views/components/workflows/assign-consultation-workflow/show-hierarchy-change',
  'views/components/workflows/enforcement-workflow/enforcement-summary-step',
  'views/components/workflows/related-document-upload',
  'views/components/workflows/file-template',
  'views/components/workflows/fmw-workflow/get-selected-monument-details',
  'views/components/workflows/excavation-site-visit-workflow/get-selected-license-details',
  'views/components/workflows/fmw-workflow/calculate-composite-score',
  'views/components/workflows/generate-ha-number',
  'views/components/workflows/generate-smr-number',
  'views/components/workflows/generate-garden-number',
  'views/components/workflows/generate-hb-number',
  'views/components/workflows/heritage-asset-designation-workflow/ha-summary',
  'views/components/workflows/heritage-asset-designation-workflow/approval-summary',
  'views/components/workflows/heritage-asset-designation-workflow/start-remap-and-merge',
  'views/components/workflows/assign-consultation-workflow/pc-summary',
  'views/components/workflows/excavation-license-workflow/excavation-report-step',
  'views/components/workflows/fetch-latest-tile',
], function (ko, arches, OpenableWorkflow, workflowTemplate) {
  return ko.components.register('workflow-builder-loader', {
    viewModel: function (params) {
      this.componentName = params.plugin.slug;

      this.stepConfig = params.stepConfig;

      OpenableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
