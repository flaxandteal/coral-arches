define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'viewmodels/alert',
  'templates/views/components/plugins/open-workflow.htm'
], function ($, ko, koMapping, arches, AlertViewModel, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    this.loading = params.loading;

    this.WORKFLOW_LABEL = 'workflow-slug';
    this.WORKFLOW_OPEN_MODE_LABEL = 'workflow-open-mode';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';
    this.RESOURCE_ID_LABEL = 'resource-id';

    this.openableWorkflows = params.openableWorkflows;
    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();
    this.workflowSlug = ko.observable();
    this.workflow = ko.observable();
    this.graphIds = ko.observable();
    this.alert = ko.observable();

    this.searchString = ko.observable();

    this.getWorkflowSlug = () => {
      let searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(this.WORKFLOW_LABEL);
    };

    this.getResourceIdFromUrl = () => {
      let searchParams = new URLSearchParams(window.location.search);
      return searchParams.get(this.RESOURCE_ID_LABEL);
    };

    this.getWorkflowData = () => {
      return this.openableWorkflows.find((workflow) => workflow.slug === this.workflowSlug());
    };

    this.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.setupWorkflow = async () => {
      let result = null;
      if (this.workflow().setupFunction) {
        result = await this[this.workflow().setupFunction]();
      }
      return result;
    };

    this.selectResourcePlaceholder = ko.computed(() => {
      return !this.workflow()?.disableStartNew
        ? 'Start new or please select from below'
        : 'Please select from below';
    }, this);

    this.openWorkflow = async() => {
      if (!this.selectedResource()) return;
      this.loading(true);
      localStorage.setItem(this.WORKFLOW_OPEN_MODE_LABEL, JSON.stringify(true));
      if (this.alert()) {
        this.loading(false);
        const alertData = this.alert();
        params.alert(
          new AlertViewModel(
            alertData.alert,
            alertData.title,
            alertData.message,
            null,
            () => { 
              if(alertData.alert === 'ep-alert-blue'){
                window.location = arches.urls.plugin('init-workflow'); 
              }
            }
          )
        );
        this.alert(null);
        return;
      }
      this.workflowUrl(
        arches.urls.plugin(this.workflowSlug()) + `?resource-id=${this.selectedResource()}`
      );
      window.window.location = this.workflowUrl();
    };

    this.init = async () => {
      this.loading(true);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.searchString(this.workflow().searchString);
      this.graphIds(this.workflow().graphIds);
      if (this.workflow().checkForResourceId && this.getResourceIdFromUrl()) {
        this.selectedResource(this.getResourceIdFromUrl());
        this.openWorkflow();
        return;
      }
      this.loading(false);
    };

    this.init();
  };

  return openWorkflowViewModel;
});
