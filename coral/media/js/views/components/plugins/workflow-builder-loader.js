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
  'views/components/workflows/excavation-site-visit-workflow/get-selected-licence-details',
  'views/components/workflows/fmw-workflow/calculate-composite-score',
  'views/components/workflows/generate-ha-number',
  'views/components/workflows/generate-smr-number',
  'views/components/workflows/generate-garden-number',
  'views/components/workflows/generate-hb-number',
  'views/components/workflows/heritage-asset-designation-workflow/ha-summary',
  'views/components/workflows/heritage-asset-designation-workflow/approval-summary',
  'views/components/workflows/heritage-asset-designation-workflow/start-remap-and-merge',
  'views/components/workflows/assign-consultation-workflow/pc-summary',
  'views/components/workflows/assign-consultation-workflow/related-heritage-asset-map',
  'views/components/workflows/fetch-latest-tile',
  'views/components/workflows/show-nodes',
  'views/components/workflows/agriculture-and-forestry-consultation-workflow/get-selected-heritage-asset-details',
  'views/components/workflows/update-dates',
  'views/components/workflows/agriculture-and-forestry-consultation-workflow/generate-afc-number',
  'views/components/workflows/update-deadline',
  'views/components/workflows/daera-workflow/generate-ail-number',
  'views/components/workflows/monuments-count',
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
