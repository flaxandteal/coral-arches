define([
  'jquery',
  'knockout',
  'viewmodels/function',
  'bindings/chosen',
  'templates/views/components/functions/sample-function.htm'
], function ($, ko, FunctionViewModel, chosen, licenseNumberFunctionTemplate) {
  return ko.components.register('views/components/functions/license-number-function', {
    viewModel: function (params) {
      FunctionViewModel.apply(this, arguments);
      var nodegroups = {};
      this.triggeringNodegroups = params.config.triggering_nodegroups;
      this.cards = ko.observableArray();
      this.graph.cards.forEach(function (card) {
        this.cards.push(card);
        nodegroups[card.nodegroup_id] = true;
      }, this);

      window.setTimeout(() => {
        $('select[data-bind^=chosen]').trigger('chosen:updated');
      }, 300);
    },
    template: licenseNumberFunctionTemplate
  });
});
