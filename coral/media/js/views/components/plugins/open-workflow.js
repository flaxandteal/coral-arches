define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/open-workflow.htm'
], function ($, ko, koMapping, arches, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    this.WORKFLOW_LABEL = 'workflow-slug';
    this.WORKFLOW_OPEN_MODE_LABEL = 'workflow-open-mode';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';
    this.WORKFLOW_RECENTLY_OPENED_LABEL = 'workflow-recently-opened';
    this.RESOURCE_ID_LABEL = 'resource-id';

    this.openableWorkflows = params.openableWorkflows;
    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();
    this.workflowSlug = ko.observable();
    this.workflow = ko.observable();
    this.graphId = ko.observable();
    this.loading = ko.observable(false);

    this.resourceName = ko.observable();
    this.recentlyOpened = ko.observable();

    this.recentlyOpenedResources = ko.computed(() => {
      const items = this.recentlyOpened()?.[this.workflowSlug()];
      return items ? Object.values(items) : [];
    }, this);

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

    this.getNameFromNodeId = (tiles, nodeId) => {
      const tile = tiles.find((tile) => nodeId in tile.data);
      return tile?.display_values.find((dv) => dv.nodeid === nodeId)?.value || '';
    };

    this.loadResourceData = async (resourceId) => {
      this.loading(true);
      const componentData = await this[this.workflow().setupFunction](resourceId);
      localStorage.setItem(this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL, JSON.stringify(componentData));
      this.loading(false);
    };

    this.openRecent = async (resourceId) => {
      localStorage.setItem(this.WORKFLOW_OPEN_MODE_LABEL, JSON.stringify(true));
      await this.loadResourceData(resourceId);
    };

    this.openWorkflow = async () => {
      localStorage.setItem(this.WORKFLOW_OPEN_MODE_LABEL, JSON.stringify(true));
      // await this.loadResourceData(this.selectedResource());
      this.updateRecentlyOpened(this.selectedResource());
    };

    this.updateRecentlyOpened = (resourceId) => {
      const slug = this.workflowSlug();
      const newOpen = {
        name: this.resourceName(),
        resourceId: resourceId
      };
      if (!(slug in this.recentlyOpened())) {
        this.recentlyOpened()[slug] = {
          [resourceId]: newOpen
        };
      } else {
        this.recentlyOpened()[slug][resourceId] = newOpen;
      }
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_OPENED_LABEL,
        JSON.stringify(this.recentlyOpened())
      );
    };

    this.saveRecentlyOpened = () => {
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_OPENED_LABEL,
        JSON.stringify(this.recentlyOpened())
      );
    };

    this.validateRecentlyOpened = async (workflows) => {
      const removeWorkflows = [];

      const validate = (resourceId) =>
        new Promise(async (resolve, reject) => {
          const tiles = await this.fetchTileData(resourceId);
          if (!tiles.length) {
            removeWorkflows.push(resourceId);
          }
          resolve();
        });

      await Promise.all(Object.values(workflows).map(({ resourceId }) => validate(resourceId)));

      const recentlyOpened = this.recentlyOpened();
      removeWorkflows.forEach((resourceId) => {
        delete recentlyOpened[this.workflowSlug()][resourceId];
      });
      this.recentlyOpened(recentlyOpened);
      this.saveRecentlyOpened();
    };

    this.clearRecentlyOpened = () => {
      const recentlyOpened = this.recentlyOpened();
      recentlyOpened[this.workflowSlug()] = {};
      this.recentlyOpened(recentlyOpened);
      this.saveRecentlyOpened();
    };

    this.init = async () => {
      this.loading(true);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.graphId(this.workflow().graphId);
      this.recentlyOpened(
        JSON.parse(localStorage.getItem(this.WORKFLOW_RECENTLY_EDITED_LABEL)) || {}
      );
      if (this.workflow().checkForResourceId) {
        this.selectedResource(this.getResourceIdFromUrl());
        if (!this.selectedResource()) return;
        this.workflowUrl(
          arches.urls.plugin(this.workflowSlug()) + `?resource-id=${this.getResourceIdFromUrl()}`
        );
        await this.openWorkflow();
        window.location.href = this.workflowUrl();
        return;
      }

      await this.validateRecentlyOpened(this.recentlyOpened()[this.workflowSlug()]);
      this.loading(false);
    };

    this.init();
  };

  return ko.components.register('open-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
});
