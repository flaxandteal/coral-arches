import ko from 'knockout';
import arches from 'arches';
import OpenableWorkflow from 'viewmodels/openable-workflow';
import workflowTemplate from 'templates/views/components/plugins/default-workflow.htm';

/*
 * Eagerly load components required by every workflow:
 *   - workflow-builder-initial-step renders the first step of every workflow
 *   - default-card-util backs the common "default-card-util" componentName
 *     used by most stepConfig layouts
 * Loading these lazily would force a chunk fetch on the critical path of
 * opening any workflow, defeating the perf gain from splitting the rest.
 */
import 'views/components/workflows/default-card-util';
import 'views/components/workflows/workflow-builder-initial-step';

/*
 * Lazy step-component loaders. Each entry is a function returning the
 * webpack dynamic import() for the module whose side-effect is
 * ko.components.register('<key>', ...). Components are loaded on demand
 * when a workflow's stepConfig references them, so opening a workflow no
 * longer pays the cost of parsing/registering every step component in
 * the project.
 *
 * IMPORTANT: webpack only code-splits dynamic import() calls whose
 * specifier is a literal string. Keep these inline — do not refactor
 * the paths into variables.
 */
const lazyStepComponentLoaders = {
  'show-hierarchy-change': () =>
    import('views/components/workflows/assign-consultation-workflow/show-hierarchy-change'),
  'enforcement-summary-step': () =>
    import('views/components/workflows/enforcement-workflow/enforcement-summary-step'),
  'related-document-upload': () =>
    import('views/components/workflows/related-document-upload'),
  'file-template': () => import('views/components/workflows/file-template'),
  'get-selected-monument-details': () =>
    import('views/components/workflows/fmw-workflow/get-selected-monument-details'),
  'get-selected-licence-details': () =>
    import('views/components/workflows/excavation-site-visit-workflow/get-selected-licence-details'),
  'calculate-composite-score': () =>
    import('views/components/workflows/fmw-workflow/calculate-composite-score'),
  'generate-ha-number': () => import('views/components/workflows/generate-ha-number'),
  'generate-smr-number': () => import('views/components/workflows/generate-smr-number'),
  'generate-garden-number': () => import('views/components/workflows/generate-garden-number'),
  'generate-hb-number': () => import('views/components/workflows/generate-hb-number'),
  'ha-summary': () =>
    import('views/components/workflows/heritage-asset-designation-workflow/ha-summary'),
  'approval-summary': () =>
    import('views/components/workflows/heritage-asset-designation-workflow/approval-summary'),
  'start-remap-and-merge': () =>
    import('views/components/workflows/heritage-asset-designation-workflow/start-remap-and-merge'),
  'pc-summary': () =>
    import('views/components/workflows/assign-consultation-workflow/pc-summary'),
  'related-heritage-asset-map': () =>
    import('views/components/workflows/assign-consultation-workflow/related-heritage-asset-map'),
  'fetch-latest-tile': () => import('views/components/workflows/fetch-latest-tile'),
  'show-nodes': () => import('views/components/workflows/show-nodes'),
  'update-dates': () => import('views/components/workflows/update-dates'),
  'generate-afc-number': () =>
    import('views/components/workflows/agriculture-and-forestry-consultation-workflow/generate-afc-number'),
  'update-deadline': () => import('views/components/workflows/update-deadline'),
  'generate-ail-number': () =>
    import('views/components/workflows/daera-workflow/generate-ail-number'),
  'get-selected-monument-details-with-count': () =>
    import('views/components/workflows/get-selected-monument-details-with-count'),
  'get-ha-details': () =>
    import('views/components/workflows/risk-assessment-workflow/get-ha-details'),
  'get-ha-smc-details': () =>
    import('views/components/workflows/risk-assessment-workflow/get-ha-smc-details'),
  'get-calculated-risk': () =>
    import('views/components/workflows/risk-assessment-workflow/get-calculated-risk'),
};

/*
 * Walks a stepConfig array, returning the unique set of componentName
 * values used across every layoutSection / componentConfig. Defensive:
 * stepConfig may be undefined or arrive as nested observables in some
 * code paths.
 */
const collectStepComponentNames = (stepConfig) => {
  const names = new Set();
  const steps = ko.unwrap(stepConfig);
  if (!Array.isArray(steps)) return names;
  steps.forEach((step) => {
    const sections = ko.unwrap(step?.layoutSections);
    if (!Array.isArray(sections)) return;
    sections.forEach((section) => {
      const configs = ko.unwrap(section?.componentConfigs);
      if (!Array.isArray(configs)) return;
      configs.forEach((config) => {
        const name = ko.unwrap(config?.componentName);
        if (name) names.add(name);
      });
    });
  });
  return names;
};

const preloadStepComponents = (stepConfig) => {
  const imports = Array.from(collectStepComponentNames(stepConfig))
    .map((name) => lazyStepComponentLoaders[name]?.())
    .filter(Boolean);
  return Promise.all(imports);
};

export default ko.components.register('workflow-builder-loader', {
  viewModel: function (params) {
    this.componentName = params.plugin.slug;

    this.stepConfig = params.stepConfig;

    OpenableWorkflow.apply(this, [params]);

    /*
     * Gate workflow history resolution on the dynamic step-component
     * imports for this workflow. updateStepPath() awaits this method
     * before instantiating any step, and the workflow template hides
     * activeStep until that completes, so step components are
     * guaranteed to be ko.components.register-ed before binding.
     */
    const originalGetWorkflowHistoryData = this.getWorkflowHistoryData.bind(this);
    this.getWorkflowHistoryData = async function (key) {
      const [history] = await Promise.all([
        originalGetWorkflowHistoryData(key),
        preloadStepComponents(this.stepConfig),
      ]);
      return history;
    };

    this.quitUrl = arches.urls.plugin('init-workflow');
  },
  template: workflowTemplate
});
