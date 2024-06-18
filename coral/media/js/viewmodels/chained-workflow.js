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
    this.chainedWorkflowIds = ko.observable();

    this.updateChainPan = (val) => {
      if (this.chainPan() !== val) {
        this.chainPan(val);
      } else {
        this.chainPan.valueHasMutated();
      }
    };

    this.isWorkflowChainFinished = ko.observable(false);

    this.initChainedWorkflow = () => {
      this.chainedWorkflowIds(this.getChainedWorkflowIds());

      const workflowUrlId = this.chainGetWorkflowIdFromUrl();

      let currentWorkflowTitle = null;
      if (workflowUrlId in this.chainedWorkflowIds()) {
        currentWorkflowTitle = this.chainedWorkflowIds()[workflowUrlId].name;
      } else {
        this.chainedWorkflowIds({});
        this.setChainedWorkflowIds();
      }

      this.chainedConfig.forEach((config, idx) => {
        config.workflow = this;
        config._index = idx;

        if (currentWorkflowTitle) {
          if (config.name === currentWorkflowTitle) {
            config.workflowId = workflowUrlId;
            config.complete = this.chainedWorkflowIds()[workflowUrlId].complete;
            console.log('config.complete: ', config.complete);
          } else {
            Object.entries(this.chainedWorkflowIds()).forEach(([id, { name, complete }]) => {
              if (name === config.name) {
                config.workflowId = id;
                config.complete = complete;
                console.log('config.complete: ', config.complete);
              }
            });
          }
        } else {
          const id = uuid.generate();
          config.workflowId = id;
          this.chainedWorkflowIds()[id] = {
            name: config.name,
            complete: false
          };
        }

        this.chainedWorkflows.push(new WorkflowLink(config));
      });

      localStorage.setItem(this.CHAINED_WORKFLOW_IDS, JSON.stringify(this.chainedWorkflowIds()));

      this.activeWorkflow(
        this.chainedWorkflows().find((workflow) => workflow.name === currentWorkflowTitle) ||
          this.chainedWorkflows()[0]
      );
      this.stepConfig = this.activeWorkflow().config;

      this.chainSetWorkflowIdToUrl(this.activeWorkflow().workflowId);
    };

    this.getChainedWorkflowIds = () => {
      const rawChainedWorkflowIds = localStorage.getItem(this.CHAINED_WORKFLOW_IDS);
      return rawChainedWorkflowIds ? JSON.parse(rawChainedWorkflowIds) : {};
    };

    this.setChainedWorkflowIds = () => {
      localStorage.setItem(this.CHAINED_WORKFLOW_IDS, JSON.stringify(this.chainedWorkflowIds()));
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
        // this.setWorkflowIdToUrl(activeWorkflow); // NEEDS IMPLEMENTED SO REFRESHING THE PAGE WORKS
        // this.hiddenWorkflowButtons(activeWorkflow.hiddenWorkflowButtons()); // NO CLUE?

        this.stepConfig = activeWorkflow.config;
        this.chainSetWorkflowIdToUrl(activeWorkflow.workflowId);
        this.initialize();
      });
    };

    /**
     * Initialise Chained Workflow
     * then Arches Workflow
     * then apply subscriptions and overrides
     */
    this.initChainedWorkflow();
    OpenWorkflowViewModel.apply(this, [config]);
    this.setupSubscriptions();

    this.next = async () => {
      let activeStep = this.activeStep();
      let activeWorkflow = this.activeWorkflow();

      if (activeStep.stepInjectionConfig) {
        await this.updateStepPath();
      }

      if (
        (!activeStep.required() || activeStep.complete()) &&
        activeStep._index < this.steps().length - 1
      ) {
        this.activeStep(this.steps()[activeStep._index + 1]);
      }

      /**
       * Logic to change to the next workflow after saving on the final step
       */
      if (
        (!activeStep.required() || activeStep.complete()) &&
        activeStep._index === this.steps().length - 1 &&
        activeWorkflow._index < this.chainedWorkflows().length - 1
      ) {
        this.activeWorkflow().complete(true);
        this.chainedWorkflowIds()[this.activeWorkflow().workflowId].complete = true;
        this.setChainedWorkflowIds();
        this.activeWorkflow(this.chainedWorkflows()[activeWorkflow._index + 1]);
      }
    };
  };

  return ChainedWorkflow;
});
