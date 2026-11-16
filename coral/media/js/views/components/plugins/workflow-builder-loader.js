import ko from 'knockout';
import arches from 'arches';
import OpenableWorkflow from 'viewmodels/openable-workflow';
import workflowTemplate from 'templates/views/components/plugins/default-workflow.htm';
import defaultCardUtil from 'views/components/workflows/default-card-util';
import workflowBuilderInitialStep from 'views/components/workflows/workflow-builder-initial-step';
import showHierarchyChange from 'views/components/workflows/assign-consultation-workflow/show-hierarchy-change';
import enforcementSummaryStep from 'views/components/workflows/enforcement-workflow/enforcement-summary-step';
import relatedDocumentUpload from 'views/components/workflows/related-document-upload';
import fileTemplate from 'views/components/workflows/file-template';
import getSelectedMonumentDetails from 'views/components/workflows/fmw-workflow/get-selected-monument-details';
import getSelectedLicenceDetails from 'views/components/workflows/excavation-site-visit-workflow/get-selected-licence-details';
import calculateCompositeScore from 'views/components/workflows/fmw-workflow/calculate-composite-score';
import generateHaNumber from 'views/components/workflows/generate-ha-number';
import generateSmrNumber from 'views/components/workflows/generate-smr-number';
import generateGardenNumber from 'views/components/workflows/generate-garden-number';
import generateHbNumber from 'views/components/workflows/generate-hb-number';
import haSummary from 'views/components/workflows/heritage-asset-designation-workflow/ha-summary';
import approvalSummary from 'views/components/workflows/heritage-asset-designation-workflow/approval-summary';
import startRemapAndMerge from 'views/components/workflows/heritage-asset-designation-workflow/start-remap-and-merge';
import pcSummary from 'views/components/workflows/assign-consultation-workflow/pc-summary';
import relatedHeritageAssetMap from 'views/components/workflows/assign-consultation-workflow/related-heritage-asset-map';
import fetchLatestTile from 'views/components/workflows/fetch-latest-tile';
import showNodes from 'views/components/workflows/show-nodes';
import updateDates from 'views/components/workflows/update-dates';
import generateAfcNumber from 'views/components/workflows/agriculture-and-forestry-consultation-workflow/generate-afc-number';
import updateDeadline from 'views/components/workflows/update-deadline';
import generateAilNumber from 'views/components/workflows/daera-workflow/generate-ail-number';
import getSelectedMonumentDetailsWithCount from 'views/components/workflows/get-selected-monument-details-with-count';
import getHaDetails from 'views/components/workflows/risk-assessment-workflow/get-ha-details';
import getHaSmcDetails from 'views/components/workflows/risk-assessment-workflow/get-ha-smc-details';
import getCalculatedRisk from 'views/components/workflows/risk-assessment-workflow/get-calculated-risk';

export default ko.components.register('workflow-builder-loader', {
    viewModel: function (params) {
      this.componentName = params.plugin.slug;

      this.stepConfig = params.stepConfig;

      OpenableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
