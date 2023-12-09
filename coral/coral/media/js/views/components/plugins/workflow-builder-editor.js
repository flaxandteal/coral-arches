define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/workflow-builder-editor.htm',
  'viewmodels/workflow-builder-step',
  'plugins/knockout-select2'
], function ($, ko, koMapping, arches, pageTemplate, WorkflowBuilderStep) {
  const pageViewModel = function (params) {
    this.workflowName = ko.observable('Workflow Builder Editor');
    this.workflowSteps = ko.observableArray();
    this.test = ko.observable();

    this.addStep = () => {
      console.log('adding step');
      let stepName = 'Step ' + (this.workflowSteps().length + 1);
      this.workflowSteps().push(stepName);
      this.workflowSteps.valueHasMutated();
      const step = new WorkflowBuilderStep({
        name: stepName
      });
      this.test(step);
    };

    this.updatePan = (direction) => {
      console.log('direction: ', direction);
    };

    this.init = async () => {
      console.log('workflow-builder-editor');
      //
      // this.test(
      //   new WorkflowBuilderStep({
      //     name: '123'
      //   })
      // );
    };

    this.init();
  };

  return ko.components.register('workflow-builder-editor', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
