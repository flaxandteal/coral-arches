define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'uuid',
  'templates/views/components/plugins/workflow-builder-editor.htm',
  'viewmodels/workflow-builder-step',
  'viewmodels/workflow-builder-config',
  'plugins/knockout-select2'
], function ($, ko, koMapping, arches, uuid, pageTemplate, WorkflowBuilderStep) {
  const pageViewModel = function (params) {
    this.graphId = ko.observable();
    this.workflowName = ko.observable('Basic');
    this.showWorkflowInSidebar = ko.observable(false);
    this.workflowSlug = ko.observable('basic-workflow');

    this.workflowSteps = ko.observableArray();
    this.activeStep = ko.observable();

    this.workflowPlugin = ko.observable();

    this.configActive = ko.observable(false);

    this.addStep = (stepData) => {
      const title = stepData?.title || 'New Step';
      const step = new WorkflowBuilderStep({
        title: title,
        cards: stepData?.layoutSections[0].componentConfigs,
        graphId: this.graphId(),
        required: stepData?.required || false,
        stepId: stepData?.name || uuid.generate(),
        parentWorkflow: this
      });
      this.workflowSteps().push(step);
      this.workflowSteps.valueHasMutated();
      if (!this.activeStep()) {
        this.activeStep(this.workflowSteps()[0]);
      }
    };

    this.loadSteps = (steps) => {
      steps?.forEach((stepData) => {
        this.addStep(stepData);
      });
    };

    this.switchStep = (stepIdx) => {
      this.setConfigActive(false);
      this.activeStep(this.workflowSteps()[stepIdx]);
    };

    this.removeStepFromWorkflow = (stepId) => {
      this.workflowSteps.remove((step) => {
        return step.stepId === stepId;
      });
      if (this.workflowSteps().length) {
        this.activeStep(this.workflowSteps()[0]);
      } else {
        this.setConfigActive(true);
      }
    };

    this.setConfigActive = (active) => {
      if (active !== this.configActive()) {
        this.configActive(active);
      }
    };

    this.getWorkflowData = () => {
      return {
        pluginid: this.workflowPluginId(),
        name: this.workflowName(),
        icon: 'fa fa-check',
        component: 'views/components/plugins/workflow-builder-loader',
        componentname: 'workflow-builder-loader',
        config: {
          show: this.showWorkflowInSidebar(),
          stepData: this.workflowSteps().map((step) => step.getStepData())
        },
        slug: this.workflowSlug(),
        sortorder: 0
      };
    };

    this.registerWorkflow = async () => {
      const data = this.getWorkflowData();
      const workflowPlugin = await $.ajax({
        type: 'POST',
        url: '/workflow-builder/register',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this
      });
      this.workflowPlugin(workflowPlugin);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('graph-id');
      currentUrl.searchParams.append('workflow-id', this.workflowPlugin().pluginid);
      history.replaceState(null, null, currentUrl.href);
    };

    this.exportWorkflow = async () => {
      await this.updateWorkflow();
      if (this.workflowId()) {
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', arches.urls.root + `workflow-builder/export?id=${this.workflowId()}`);
        downloadAnchorNode.setAttribute('download', `${this.workflowSlug()}.json`);
        document.body.appendChild(downloadAnchorNode); // Required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    };

    this.updateWorkflow = async () => {
      const data = this.getWorkflowData();
      const workflowPlugin = await $.ajax({
        type: 'PUT',
        url: '/workflow-builder/update',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      this.workflowPlugin(workflowPlugin);
    };

    this.workflowId = ko.computed(() => {
      if (this.workflowPlugin()?.pluginid) {
        return this.workflowPlugin().pluginid;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const workflowId = searchParams.get('workflow-id');
      if (workflowId) {
        return workflowId;
      }
    }, this);

    /**
     * Temporary solution to grab the graph id.
     * FIXME: Need to setup a way of storing multiple
     * graph IDs
     */
    this.graphId = ko.computed(() => {
      if (this.workflowPlugin()) {
        return this.workflowPlugin()?.config?.stepData?.[0]?.layoutSections?.[0].componentConfigs?.[0]?.parameters
          .graphid;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const graphId = searchParams.get('graph-id');
      if (graphId) {
        return graphId;
      }
    }, this);

    this.workflowPluginId = ko.computed(() => {
      return this.workflowPlugin()?.pluginid || '';
    }, this);

    this.getRequiredParentTiles = () => {
      const requiredParentTiles = [];
      this.workflowSteps().forEach((step) => {
        step.cards().forEach((card) => {
          if (card.parentTile()) {
            requiredParentTiles.push(card.parentTile());
          }
        });
      });
      return requiredParentTiles;
    };

    this.workflowResourceIdPathOptions = ko.computed(() => {
      const resourceIdPaths = [];
      resourceIdPaths.push({
        text: 'None',
        id: resourceIdPaths.length,
        resourceIdPath: undefined,
        tileIdPath: undefined,
        basePath: undefined
      });
      this.workflowSteps().forEach((step) => {
        step.cards().forEach((card) => {
          if (card.currentComponentData()) {
            const pathData = {
              text: step.title(),
              id: resourceIdPaths.length
            };
            pathData.text += ` > ${card.title()}`;
            pathData.resourceIdPath = `['${step.stepId}']['${card.cardId}'][0]['resourceid']['resourceInstanceId']`;
            pathData.tileIdPath = `['${step.stepId}']['${card.cardId}'][0]['tileId']`;
            pathData.basePath = `['${step.stepId}']['${card.cardId}'][0]['resourceid']`;
            resourceIdPaths.push(pathData);
          }
        });
      });
      return resourceIdPaths;
    });

    this.loadExistingWorkflow = async () => {
      if (this.workflowId()) {
        const workflow = await $.getJSON(arches.urls.root + `workflow-builder/plugins?id=${this.workflowId()}`);
        this.workflowPlugin(workflow);
        this.loadSteps(this.workflowPlugin()?.config.stepData);
        this.workflowName(this.workflowPlugin()?.name);
        this.showWorkflowInSidebar(this.workflowPlugin()?.config.show);
        this.workflowSlug(this.workflowPlugin().slug);
      }
    };

    this.init = async () => {
      await this.loadExistingWorkflow();
      if (!this.workflowSteps().length) {
        this.configActive(true);
      }
      this.workflowResourceIdPathOptions();
    };

    this.init();
  };

  return ko.components.register('workflow-builder-editor', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
