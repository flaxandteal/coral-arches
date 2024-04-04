define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'js-cookie',
  'viewmodels/alert',
  'arches',
  'uuid',
  'viewmodels/openable-workflow',
  'viewmodels/workflow-link'
], function (
  $,
  _,
  ko,
  koMapping,
  Cookies,
  AlertViewModel,
  arches,
  uuid,
  OpenWorkflowViewModel,
  WorkflowLink
) {
  const ChainedWorkflow = function (config) {
    OpenWorkflowViewModel.apply(this, [config]);

    this.chainPan = ko.observable();

    this.chainedConfig;
    this.chainedWorkflows = ko.observableArray();

    this.activeWorkflow = ko.observable();
    this.activeWorkflow.subscribe((activeWorkflow) => {
      // activeStep.loading(true); // THIS WAS ALREADY COMMENTED IN WORKFLOW.JS
      // self.setWorkflowIdToUrl(activeWorkflow); // NEEDS IMPLEMENTED SO REFRESHING THE PAGE WORKS
      // self.hiddenWorkflowButtons(activeWorkflow.hiddenWorkflowButtons()); // NO CLUE?
    });

    this.updateChainPan = function (val) {
      if (this.chainPan() !== val) {
        this.chainPan(val);
      } else {
        this.chainPan.valueHasMutated();
      }
    };

    this.initChainedWorkflow = () => {
      this.chainedConfig.forEach((config) => {
        config.workflow = this;
        this.chainedWorkflows.push(new WorkflowLink(config));
      });
      this.activeWorkflow(this.chainedWorkflows()[0])
      console.log('this.activeWorkflow: ', this.activeWorkflow())
    };

    this.initChainedWorkflow();
  };

  return ChainedWorkflow;
});
