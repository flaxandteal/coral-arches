define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'templates/views/components/cards/default.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, widgetLabeller) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.graphid = params.graphid;
    this.graphids = params.graphids ? params.graphids : [this.graphid];

    if (this.form.componentData.parameters.prefilledNodes) {
      this.form.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(this.form.tile().data).forEach((node) => {
          if (node == prefill[0]) {
            this.form.tile().data[node](prefill[1]);
          }
        });
      });
    }

    this.form
      .card()
      ?.widgets()
      .forEach((widget) => {
        widget.graphids = this.graphids ? this.graphids : [this.graphid];
        this.labels?.forEach(([prevLabel, newLabel]) => {
          if (widget.label() === prevLabel) {
            widget.label(newLabel);
          }
        });
      });
  }

  ko.components.register('default-card-util', {
    viewModel: viewModel,
    template: widgetLabeller
  });

  return viewModel;
});
