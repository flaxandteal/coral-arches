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

    this.title = params?.title || 'default';

    this.selectedNodegroup = ko.observable();
    this.optionsNodegroups = ko.observableArray(['test', 'test1', 'test3']);

    this.workflowComponentAbstract = ko.observable();

    // Annoyingly 'one' as the ID will be selected when
    // 'none' is selected because the code does an includes check
    this.tileManagedOptions = ko.observableArray([
      { text: 'One', id: 'tile_one' },
      { text: 'Many', id: 'tile_many' },
      { text: 'None', id: 'tile_none' }
    ]);
    this.selectedTileManaged = ko.observable('tile_one');

    this.configKeys = ko.observable({ placeholder: 0 });

    this.selectedTileManaged.subscribe((value) => {
      console.log('this.selectedTileManaged: ', value);
      this.currentComponentData().tilesManaged = value?.replace('tile_', '');
      this.loadAbstractComponent(this.currentComponentData());
    });

    this.currentComponentData = ko.observable();

    this.nodegroupOptions = ko.observableArray();
    this.selectedNodegroup.subscribe((value) => {
      const data = JSON.parse(JSON.stringify(this.components()[value]));
      delete data.parameters.resourceid;
      data.parameters.parenttileid = 'dummy-id';
      console.log(this.title, data);
      this.currentComponentData(data);
      this.loadAbstractComponent(this.currentComponentData());
    });

    this.components = ko.observableArray();

    this.isStepActive = ko.observable(false);

    this.loadComponents = async () => {
      let searchParams = new URLSearchParams(window.location.search);
      let graphId = searchParams.get('graph-id');
      const data = await (
        await window.fetch(
          arches.urls.root + `workflow-builder/graph-components?graph-id=${graphId}`
        )
      ).json();
      const nodegroupOptions = data.component_configs.map((item, idx) => {
        return {
          text: item.parameters.semanticName,
          id: idx
        };
      });
      console.log('nodegroupOptions: ', nodegroupOptions);
      this.nodegroupOptions(nodegroupOptions);
      this.components(data.component_configs);
      return data.component_configs;
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
        workflowId: '1234',
        alert: null,
        outerSaveOnQuit: null,
        isStepActive: this.isStepActive
      });
      workflowCA.getCardResourceIdOrGraphId = () => {
        return componentData.parameters.graphid + '/override';
      };
      this.isStepActive(true);
      this.workflowComponentAbstract(workflowCA);
      console.log('this.workflowComponentAbstract(): ', this.workflowComponentAbstract());
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
      console.log('workflow-builder-card: ', this, params);
      this.components(await this.loadComponents());
      console.log('this.components: ', this.components());
    };

    this.init();
  };

  ko.components.register('workflow-builder-card', {
    template: template
  });

  return WorkflowBuilderCard;
});
