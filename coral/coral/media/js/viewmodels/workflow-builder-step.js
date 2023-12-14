define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-step.htm',
  'viewmodels/workflow-builder-card'
], function ($, _, ko, koMapping, arches, template, WorkflowBuilderCard) {
  const WorkflowBuilderStep = function (params) {
    _.extend(this, params);

    this.title = ko.observable(params?.title);
    this.cards = ko.observableArray();

    this.init = () => {
      console.log('workflow-builder-step: ', this, params);
    };

    this.addCard = () => {
      const card = new WorkflowBuilderCard({
        title: 'Card ' + (this.cards().length + 1)
      });
      this.cards().push(card);
      this.cards.valueHasMutated();
    };

    this.titleToId = () => {
      return this.title().toLowerCase().split(' ').join('-');
    };

    this.getStepData = () => {
      return {
        title: this.title(),
        name: this.titleToId(),
        required: false,
        // informationboxdata: {
        //   heading: '',
        //   text: ''
        // },
        layoutSections: [
          {
            componentConfigs: this.cards().map((card) => card.getComponentData())
          }
        ]
      };
    };

    this.init();
  };

  ko.components.register('workflow-builder-step', {
    template: template
  });

  return WorkflowBuilderStep;
});
