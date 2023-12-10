define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-card.htm'
], function ($, _, ko, koMapping, arches, template) {
  const WorkflowBuilderCard = function (params) {
    _.extend(this, params);

    this.title = params?.title || 'default';

    this.selectedNodegroup = ko.observable();
    this.optionsNodegroups = ko.observableArray(['test', 'test1', 'test3']);

    this.selectedNodegroup.subscribe((value) => {
      console.log(this.title + ' ' + value);
    });

    this.init = () => {
      console.log('workflow-builder-card: ', this, params);
    };

    this.init();
  };

  ko.components.register('workflow-builder-card', {
    template: template
  });

  return WorkflowBuilderCard;
});
