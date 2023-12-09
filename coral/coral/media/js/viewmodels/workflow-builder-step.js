define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-step.htm'
], function ($, _, ko, koMapping, arches, template) {
  const WorkflowBuilderStep = function (params) {
    _.extend(this, params);

    console.log('before: ', JSON.stringify(this));
    console.log('before 1: ', JSON.stringify(params));

    this.stepName = ko.observable(params?.name || 'default');

    this.stepName.subscribe((value) => {
      console.log('this.stepName updated: ', value);
    });

    this.init = () => {
      console.log('workflow-builder-step: ', this, params);
      console.log('after: ', JSON.stringify(this));
      console.log('after 1: ', JSON.stringify(params));
      console.log('this.stepName: ', this.stepName);
      console.log('this.stepName(): ', this.stepName());
    };

    this.init();
  };

  ko.components.register('workflow-builder-step', {
    // viewModel: WorkflowBuilderStep,
    template: template
  });

  return WorkflowBuilderStep;
});
