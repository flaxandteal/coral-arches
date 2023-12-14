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

    this.title = ko.observable(params?.title || '');
    this.cards = ko.observableArray();

    this.addCard = (cardData) => {
      const card = new WorkflowBuilderCard({
        title: 'Card ' + (this.cards().length + 1),
        componentData: cardData
      });
      this.cards().push(card);
      this.cards.valueHasMutated();
    };

    this.loadCards = (cards) => {
      cards?.forEach((cardData) => {
        this.addCard(cardData);
      });
    };

    this.titleAsId = ko.computed(() => {
      return this.title().toLowerCase().split(' ').join('-');
    }, this);

    this.getStepData = () => {
      return {
        title: this.title(),
        name: this.titleAsId(),
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

    this.init = () => {
      this.loadCards(params?.cards);
    };

    this.init();
  };

  ko.components.register('workflow-builder-step', {
    template: template
  });

  return WorkflowBuilderStep;
});
