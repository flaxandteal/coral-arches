define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/open-incident-report-workflow.htm'
], function ($, ko, koMapping, arches, pageTemplate) {
  const openWorkflowViewModel = function (params) {
    this.loading = params.loading;

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

    this.resourceName = ko.observable();
    this.recentlyOpened = ko.observable();

    this.incidentTiles = ko.observableArray();

    this.configKeys = ko.observable({ placeholder: 0 });

    this.selectedIncidentReport = ko.observable();

    this.recentlyOpenedResources = ko.computed(() => {
      const items = this.recentlyOpened()?.[this.workflowSlug()];
      return items ? Object.values(items) : [];
    }, this);

    this.noResourceSelected = ko.computed(() => {
      return false;
      return !this.selectedResource();
    }, this);

    this.noResourceSelected.subscribe((value) => {
      console.log('no res: ', value);
    });

    this.parentTileOptions = ko.observableArray();

    this.fetchTileData = async (resourceId, nodeId) => {
      console.log('resourceId, nodeId: ', resourceId, nodeId);
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.selectedResource.subscribe(async (resourceId) => {
      console.log('value: ', resourceId);
      // const tiles = await this.fetchTileData(value, 'd3ff3fe6-d62b-11ee-9454-0242ac180006');
      this.getParentTileOptions(resourceId);
    });

    this.getParentTileOptions = async (resourceId) => {
      const tiles = await this.fetchTileData(resourceId, 'd3ff3fe6-d62b-11ee-9454-0242ac180006');
      console.log('incident report tiles: ', tiles);
      this.parentTileOptions(
        tiles.map((tile, idx) => {
          return {
            text: tile.data['b7c8c0a4-d6ee-11ee-8240-0242ac180006'].en.value,
            tile: tile,
            id: idx
          };
        })
      );
    };

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

    // this.fetchTileData = async (resourceId) => {
    //   const tilesResponse = await window.fetch(
    //     arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
    //   );
    //   const data = await tilesResponse.json();
    //   return data.tiles;
    // };

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

    this.setupWorkflow = async () => {
      let result = null;
      if (this.workflow().setupFunction) {
        result = await this[this.workflow().setupFunction]();
      }
      return result;
    };

    this.setupMonumentRevision = async () => {
      const monumentResourceId = this.selectedResource();
      const response = await $.ajax({
        type: 'POST',
        url: '/monument-revision-remap',
        dataType: 'json',
        data: JSON.stringify({
          monumentResourceId: monumentResourceId
        }),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      this.selectedResource(response.revisionResourceId);
    };

    this.openWorkflow = async () => {
      if (!this.selectedResource()) return;
      this.loading(true);
      localStorage.setItem(this.WORKFLOW_OPEN_MODE_LABEL, JSON.stringify(true));
      this.updateRecentlyOpened(this.selectedResource());
      await this.setupWorkflow();
      this.workflowUrl(
        arches.urls.plugin(this.workflowSlug()) + `?resource-id=${this.selectedResource()}`
      );
      window.window.location = this.workflowUrl();
      this.loading(false);
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
      if (!workflows) return;

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
        JSON.parse(localStorage.getItem(this.WORKFLOW_RECENTLY_OPENED_LABEL)) || {}
      );
      if (this.workflow().checkForResourceId && this.getResourceIdFromUrl()) {
        this.selectedResource(this.getResourceIdFromUrl());
        this.openWorkflow();
        return;
      }
      await this.validateRecentlyOpened(this.recentlyOpened()[this.workflowSlug()]);
      this.loading(false);
    };

    this.init();
  };

  return ko.components.register('open-incident-report-workflow', {
    viewModel: openWorkflowViewModel,
    template: pageTemplate
  });
});
