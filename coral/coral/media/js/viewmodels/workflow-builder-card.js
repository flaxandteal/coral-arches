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

    this.selectedNodegroup.subscribe((value) => {
      const data = JSON.parse(JSON.stringify(value));
      delete data.parameters.resourceid;
      console.log(this.title, data);

      this.loadAbstractComponent(data);
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
      this.isStepActive(true);
      this.workflowComponentAbstract(workflowCA);
      console.log('this.workflowComponentAbstract(): ', this.workflowComponentAbstract());
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
