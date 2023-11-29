define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/default-card-util.htm'
], function (_, ko, koMapping, uuid, arches, widgetLabeller) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);
    self.tile()?.dirty.subscribe(function (val) {
      self.dirty(val);
    });
    self.tiles([self.tile()]);

    this.graphid = params.graphid;
    this.graphids = params.graphids ? params.graphids : [this.graphid];
    this.hiddenCard = params?.hiddenCard || false;

    this.hiddenCard = params?.hiddenCard || false;

    if (this.componentData.parameters.prefilledNodes) {
      this.componentData.parameters.prefilledNodes?.forEach((prefill) => {
        Object.keys(self.tile().data).forEach((node) => {
          if (node == prefill[0]) {
            self.tile().data[node](prefill[1]);
          }
        });
      });
    }

    this.card()
      ?.widgets()
      .forEach((widget) => {
        widget.graphids = this.graphids ? this.graphids : [this.graphid];
        params.labels?.forEach(([prevLabel, newLabel]) => {
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
