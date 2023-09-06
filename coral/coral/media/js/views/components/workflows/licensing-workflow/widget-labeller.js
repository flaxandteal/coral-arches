define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/widget-labeller.htm'
], function (_, ko, koMapping, uuid, arches, widgetLabeller) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);

    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.pageVm = params.pageVm;

    this.card().widgets().forEach((widget) => {
      console.log('widget loop: ', widget);
      params.labels.forEach(([prevLabel, newLabel]) => {
        if (widget.label() === prevLabel) {
          widget.label(newLabel)
        }
      })
    });
  }

  ko.components.register('widget-labeller', {
    viewModel: viewModel,
    template: widgetLabeller
  });

  return viewModel;
});
