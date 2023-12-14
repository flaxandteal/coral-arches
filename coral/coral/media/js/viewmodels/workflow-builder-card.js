define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-card.htm',
  'views/components/workflows/workflow-component-abstract'
], function ($, _, ko, koMapping, arches, template, WorkflowComponentAbstract) {
  const WorkflowBuilderCard = function (params) {
    _.extend(this, params);

    this.cardHasLoaded = ko.observable(false);
    this.title = params?.title || 'default';

    this.workflowComponentAbstract = ko.observable();
    this.isStepActive = ko.observable(false);
    this.currentComponentData = ko.observable();

    this.components = ko.observableArray();

    this.nodegroupOptions = ko.observableArray();
    this.selectedNodegroup = ko.observable();

    // Annoyingly 'one' as the ID will be selected when
    // 'none' is selected because the code does an includes check
    this.tileManagedOptions = ko.observableArray([
      { text: 'One', id: 'tile_one' },
      { text: 'Many', id: 'tile_many' },
      { text: 'None', id: 'tile_none' }
    ]);
    this.selectedTileManaged = ko.observable('tile_one');

    this.configKeys = ko.observable({ placeholder: 0 });

    this.loadGraphComponents = async () => {
      const data = await $.getJSON(
        arches.urls.root + `workflow-builder/graph-components?graph-id=${this.graphId()}`
      );
      const nodegroupOptions = data.component_configs.map((item, idx) => {
        return {
          text: item.parameters.semanticName,
          nodegroupid: item.parameters.nodegroupid,
          id: idx
        };
      });
      this.nodegroupOptions(nodegroupOptions);
      this.components(data.component_configs);
    };

    this.loadAbstractComponent = (componentData) => {
      this.isStepActive(false);
      let workflowCA = new WorkflowComponentAbstract({
        componentData: componentData,
        workflowComponentAbstractId: null,
        isValidComponentPath: () => {
          console.log('isValidComponentPath was called');
        },
        getDataFromComponentPath: () => {
          console.log('getDataFromComponentPath was called');
        },
        title: 'Step title',
        isStepSaving: false,
        locked: false,
        lockExternalStep: () => {
          console.log('lockExternalStep was called');
        },
        lockableExternalSteps: [],
        workflowId: '',
        alert: null,
        outerSaveOnQuit: null,
        isStepActive: this.isStepActive
      });
      /**
       * This endpoint was created only to add additional tiles
       * that don't exist. These tiles are used to provide additional
       * cards to the topCards.
       *
       * For example the 'Location Data' nodegroup has nested nodegroups.
       * These nodegroups will only load if the parent tile (Location Data)
       * exists in the returned tiles because the tile will provide the cards.
       *
       * A dummy-id has been created to match the tile returned to the parenttileid
       * of the node config. This will eventually need to be changed if there
       * are multiple components that require a parenttileid.
       */
      workflowCA.getCardResourceIdOrGraphId = () => {
        return this.graphId() + '/override';
      };
      this.isStepActive(true);
      this.workflowComponentAbstract(workflowCA);
    };

    this.graphId = ko.computed(() => {
      if (this.currentComponentData()?.parameters.graphid) {
        return this.currentComponentData()?.parameters.graphid;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const graphId = searchParams.get('graph-id');
      if (graphId) {
        return graphId;
      }
    }, this);

    this.loadComponent = () => {
      if (this.currentComponentData()) {
        this.selectedNodegroup(
          this.nodegroupOptions().findIndex(
            (option) => option.nodegroupid === this.currentComponentData().parameters.nodegroupid
          )
        );
        this.selectedTileManaged('tile_' + this.currentComponentData().tilesManaged);
        this.loadAbstractComponent(this.currentComponentData());
      }
    };

    this.setupSubscriptions = () => {
      this.selectedTileManaged.subscribe((value) => {
        this.currentComponentData().tilesManaged = value?.replace('tile_', '');
        this.loadAbstractComponent(this.currentComponentData());
      });

      this.selectedNodegroup.subscribe((value) => {
        const data = JSON.parse(JSON.stringify(this.components()[value]));
        data.parameters.resourceid = '';
        data.parameters.parenttileid = 'dummy-id';
        this.currentComponentData(data);
        this.loadAbstractComponent(this.currentComponentData());
      });
    };

    this.getComponentData = () => {
      return {
        componentName: this.currentComponentData().componentName,
        tilesManaged: this.currentComponentData().tilesManaged,
        uniqueInstanceName: this.currentComponentData().uniqueInstanceName,
        parameters: {
          graphid: this.currentComponentData().parameters.graphid,
          nodegroupid: this.currentComponentData().parameters.nodegroupid,
          resourceid: this.currentComponentData().parameters.resourceid,
          semanticName: this.currentComponentData().parameters.semanticName
        }
      };
    };

    this.init = async () => {
      this.currentComponentData(params?.componentData);
      await this.loadGraphComponents();
      this.loadComponent();
      this.setupSubscriptions();
      this.cardHasLoaded(true);
    };

    this.init();
  };

  ko.components.register('workflow-builder-card', {
    template: template
  });

  return WorkflowBuilderCard;
});
