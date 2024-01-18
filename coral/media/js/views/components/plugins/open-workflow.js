define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/open-workflow.htm'
], function ($, ko, koMapping, arches, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    this.WORKFLOW_LABEL = 'workflow-slug';
    this.WORKFLOW_EDIT_MODE_LABEL = 'workflow-edit-mode';
    this.WORKFLOW_COMPONENT_ABSTRACTS_LABEL = 'workflow-component-abstracts';
    this.WORKFLOW_RECENTLY_EDITED_LABEL = 'workflow-recently-edited';
    this.RESOURCE_ID_LABEL = 'resource-id';

    this.editableWorkflows = params.editableWorkflows;
    this.selectedResource = ko.observable();
    this.workflowUrl = ko.observable();
    this.workflowSlug = ko.observable();
    this.workflow = ko.observable();
    this.graphId = ko.observable();
    this.loading = ko.observable(false);

    this.resourceName = ko.observable();
    this.recentlyEdited = ko.observable();

    this.recentlyOpenedResources = ko.computed(() => {
      const items = this.recentlyEdited()?.[this.workflowSlug()];
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
      return this.editableWorkflows.find((workflow) => workflow.slug === this.workflowSlug());
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
      localStorage.setItem(this.WORKFLOW_EDIT_MODE_LABEL, JSON.stringify(true));
      await this.loadResourceData(resourceId);
    };

    this.editWorkflow = async () => {
      localStorage.setItem(this.WORKFLOW_EDIT_MODE_LABEL, JSON.stringify(true));
      await this.loadResourceData(this.selectedResource());
      this.updateRecentlyEdited(this.selectedResource());
    };

    this.updateRecentlyEdited = (resourceId) => {
      const slug = this.workflowSlug();
      const newEdit = {
        name: this.resourceName(),
        resourceId: resourceId
      };
      if (!(slug in this.recentlyEdited())) {
        this.recentlyEdited()[slug] = {
          [resourceId]: newEdit
        };
      } else {
        this.recentlyEdited()[slug][resourceId] = newEdit;
      }
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_EDITED_LABEL,
        JSON.stringify(this.recentlyEdited())
      );
    };

    this.saveRecentlyEdited = () => {
      localStorage.setItem(
        this.WORKFLOW_RECENTLY_EDITED_LABEL,
        JSON.stringify(this.recentlyEdited())
      );
    };

    this.validateRecentlyEdited = async (workflows) => {
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

      const recentlyEdited = this.recentlyEdited();
      removeWorkflows.forEach((resourceId) => {
        delete recentlyEdited[this.workflowSlug()][resourceId];
      });
      this.recentlyEdited(recentlyEdited);
      this.saveRecentlyEdited();
    };

    this.clearRecentlyEdited = () => {
      const recentlyEdited = this.recentlyEdited();
      recentlyEdited[this.workflowSlug()] = {};
      this.recentlyEdited(recentlyEdited);
      this.saveRecentlyEdited();
    };

    this.init = async () => {
      this.loading(true);
      console.log('Init edit workflow: ', params);
      this.workflowSlug(this.getWorkflowSlug());
      this.workflowUrl(arches.urls.plugin(this.workflowSlug()));
      this.workflow(this.getWorkflowData());
      this.graphId(this.workflow().graphId);
      this.recentlyEdited(
        JSON.parse(localStorage.getItem(this.WORKFLOW_RECENTLY_EDITED_LABEL)) || {}
      );
      if (this.workflow().checkForResourceId) {
        this.selectedResource(this.getResourceIdFromUrl());
        if (!this.selectedResource()) return;
        await this.editWorkflow();
        window.location.href = this.workflowUrl();
        return;
      }

      await this.validateRecentlyEdited(this.recentlyEdited()[this.workflowSlug()]);
      this.loading(false);
    };

    this.init();
  };

  return ko.components.register('open-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
});