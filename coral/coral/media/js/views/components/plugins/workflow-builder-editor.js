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
    this.activeStep = ko.observable();

    this.addStep = () => {
      console.log('adding step');
      let stepName = ko.observable('Step ' + (this.workflowSteps().length + 1));
      // this.workflowSteps().push(stepName);
      const step = new WorkflowBuilderStep({
        title: stepName
      });
      this.workflowSteps().push(step);
      this.workflowSteps.valueHasMutated();
      if (!this.activeStep()) {
        console.log('setting active step');
        this.activeStep(this.workflowSteps()[0]);
      }
    };

    this.updatePan = (direction) => {
      console.log('direction: ', direction);
    };

    this.switchStep = (stepIdx) => {
      console.log('changing step idx: ', stepIdx);
      this.activeStep(this.workflowSteps()[stepIdx]);
    };

    this.init = async () => {
      console.log('workflow-builder-editor');
    };

    this.init();
  };

  return ko.components.register('workflow-builder-editor', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
