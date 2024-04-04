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

    this.updateChainPan = (val) => {
      if (this.chainPan() !== val) {
        this.chainPan(val);
      } else {
        this.chainPan.valueHasMutated();
      }
    };

    this.isWorkflowChainFinished = ko.observable(false);

    this.initChainedWorkflow = () => {
      this.chainedConfig.forEach((config, idx) => {
        config.workflow = this;
        config._index = idx;
        this.chainedWorkflows.push(new WorkflowLink(config));
      });
      this.activeWorkflow(this.chainedWorkflows()[0]);
    };

    this.initChainedWorkflow();

    this.furthestValidWorkflowIndex = ko.observable();
    this.furthestValidWorkflowIndex.subscribe((index) => {
      if (index >= this.chainedWorkflows().length - 1) {
        this.isWorkflowChainFinished(true);
      } else {
        this.isWorkflowChainFinished(false);
      }
    });
    this.chainedWorkflows.subscribe(() => {
      this.furthestValidWorkflowIndex.valueHasMutated();
    });
    this.computedFurthestValidWorkflowIndex = ko.computed(() => {
      var furthestValidWorkflowIndex = this.furthestValidWorkflowIndex() || 0;
      var startIdx = 0;

      /* furthest completed step index */
      this.chainedWorkflows().forEach((workflow) => {
        if (ko.unwrap(workflow.complete)) {
          startIdx = workflow._index;
        }
      });

      /* furthest non-required step directly after furthest completed step */
      for (var i = startIdx; i < this.chainedWorkflows().length; i++) {
        var workflow = this.chainedWorkflows()[i];

        if (ko.unwrap(workflow.complete) || !ko.unwrap(workflow.required)) {
          furthestValidWorkflowIndex = workflow._index;
        } else {
          break;
        }
      }

      /* add index position for furthest valid index if not incomplete beginning step */
      if (
        (furthestValidWorkflowIndex === 0 &&
          this.chainedWorkflows()[furthestValidWorkflowIndex] &&
          this.chainedWorkflows()[furthestValidWorkflowIndex].complete()) ||
        furthestValidWorkflowIndex > 0
      ) {
        furthestValidWorkflowIndex += 1;
      }

      if (furthestValidWorkflowIndex !== this.furthestValidWorkflowIndex()) {
        this.furthestValidWorkflowIndex(furthestValidWorkflowIndex);
      }
    }, this);
  };

  return ChainedWorkflow;
});
