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

    this.title = params?.title || 'default';
    this.cards = ko.observableArray();

    this.init = () => {
      console.log('workflow-builder-step: ', this, params);
    };

    this.addCard = () => {
      this.cards().push({
        title: 'Card ' + (this.cards().length + 1)
      });
      this.cards.valueHasMutated();
    };

    this.init();
  };

  ko.components.register('workflow-builder-step', {
    template: template
  });

  return WorkflowBuilderStep;
});
