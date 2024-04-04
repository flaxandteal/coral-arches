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
    this.WORKFLOW_ID_LABEL = 'workflow-id';
    this.CHAINED_WORKFLOW_IDS = 'chained-workflow-ids';
    this.chainPan = ko.observable();

    this.chainedConfig;
    this.chainedWorkflows = ko.observableArray();

    this.activeWorkflow = ko.observable();

    this.updateChainPan = (val) => {
      if (this.chainPan() !== val) {
        this.chainPan(val);
      } else {
        this.chainPan.valueHasMutated();
      }
    };

    this.isWorkflowChainFinished = ko.observable(false);

    this.initChainedWorkflow = () => {
      const rawChainedWorkflowIds = localStorage.getItem(this.CHAINED_WORKFLOW_IDS);
      const chainedWorkflowIds = rawChainedWorkflowIds ? JSON.parse(rawChainedWorkflowIds) : {};

      console.log('chainedWorkflowIds: ', chainedWorkflowIds);
      console.log('this.chainGetWorkflowIdFromUrl(): ', this.chainGetWorkflowIdFromUrl());
      let currentWorkflowId = null;
      if (Object.values(chainedWorkflowIds).includes(this.chainGetWorkflowIdFromUrl())) {
        currentWorkflowId = this.chainGetWorkflowIdFromUrl();
      }
      console.log('workflowId: ', currentWorkflowId);

      this.chainedConfig.forEach((config, idx) => {
        config.workflow = this;
        config._index = idx;

        if (config.name in chainedWorkflowIds) {
          config.workflowId = chainedWorkflowIds[config.name];
        } else {
          const id = uuid.generate();
          config.workflowId = id;
          chainedWorkflowIds[config.name] = id;
        }

        // console.log('self.getWorkflowIdFromUrl();: ', this.getWorkflowIdFromUrl())
        this.chainedWorkflows.push(new WorkflowLink(config));
      });

      localStorage.setItem(this.CHAINED_WORKFLOW_IDS, JSON.stringify(chainedWorkflowIds));

      console.log('this.chainedWorkflows(): ', this.chainedWorkflows());
      console.log(
        'this.chainedWorkflows().find((workflow) => workflow.workflowId === currentWorkflowId)',
        this.chainedWorkflows().find((workflow) => workflow.workflowId === currentWorkflowId)
      );
      this.activeWorkflow(
        this.chainedWorkflows().find((workflow) => workflow.workflowId === currentWorkflowId) ||
          this.chainedWorkflows()[0]
      );
      console.log('this.activeWorkflow: ', this.activeWorkflow());

      this.chainSetWorkflowIdToUrl(this.activeWorkflow().workflowId);
    };

    this.chainSetWorkflowIdToUrl = (uuid) => {
      var searchParams = new URLSearchParams(window.location.search);
      searchParams.set(this.WORKFLOW_ID_LABEL, uuid);

      var newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;
      history.replaceState(null, '', newRelativePathQuery);
    };

    this.chainGetWorkflowIdFromUrl = () => {
      var searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(this.WORKFLOW_ID_LABEL);
    };

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

    this.setupSubscriptions = () => {
      this.activeWorkflow.subscribe((activeWorkflow) => {
        // activeStep.loading(true); // THIS WAS ALREADY COMMENTED IN WORKFLOW.JS
        // self.setWorkflowIdToUrl(activeWorkflow); // NEEDS IMPLEMENTED SO REFRESHING THE PAGE WORKS
        // self.hiddenWorkflowButtons(activeWorkflow.hiddenWorkflowButtons()); // NO CLUE?

        this.stepConfig = activeWorkflow.config;
        this.chainSetWorkflowIdToUrl(activeWorkflow.workflowId);
        this.initialize();
      });
    };

    this.initChainedWorkflow();
    OpenWorkflowViewModel.apply(this, [config]);
    this.setupSubscriptions();
  };

  return ChainedWorkflow;
});
