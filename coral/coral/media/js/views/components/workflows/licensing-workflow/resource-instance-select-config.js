define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'templates/views/components/workflows/licensing-workflow/resource-instance-select-config.htm'
], function (_, ko, koMapping, uuid, arches, resourceInstanceSelectConfig) {
  function viewModel(params) {
    const self = this;

    _.extend(this, params.form);

    self.tile().dirty.subscribe(function (val) {
      self.dirty(val);
    });

    this.pageVm = params.pageVm;
    this.graphids = params.graphids;
    this.card = params.card
    this.widget_group = this.card.widgets()
    this.widget_group.forEach((widget) => {
            if (widget.widgetList()[0].name === 'resource-instance-multiselect-widget') {
                widget.graphids = `graphids: ['${this.graphid}'],`
            } else {
                widget.graphids = ''
            }
          })
          
    console.log('graph ids: ', this.graphids);

    console.log('thisssss ', this)
  }

  ko.components.register('resource-instance-select-config', {
    viewModel: viewModel,
    template: resourceInstanceSelectConfig
  });

  return viewModel;
});
