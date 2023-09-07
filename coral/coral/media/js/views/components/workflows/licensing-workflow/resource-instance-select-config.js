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
    this.graphIds = params.graphIds;
    console.log('graph ids: ', this.graphIds);

    console.log('thisssss ', this)
  }

  ko.components.register('resource-instance-select-config', {
    viewModel: viewModel,
    template: resourceInstanceSelectConfig
  });

  return viewModel;
});
