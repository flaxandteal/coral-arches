define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/alert',
  'viewmodels/card-component',
  'templates/views/components/workflows/select-resource-id.htm'
], function (_, ko, koMapping, uuid, arches, AlertViewModel, CardComponentViewModel, template) {
  function viewModel(params) {
    const ResourceInstanceSelectViewModel = require('viewmodels/resource-instance-select');

    params.multiple = false;
    params.datatype = 'resource-instance';
    params.configKeys = ['placeholder', 'defaultResourceInstance'];
    params.graphids = params.graphIds;

    ResourceInstanceSelectViewModel.apply(this, [params]);

    if (this.form.savedData()?.selectedResourceId) {
      this.value(this.form.savedData()?.selectedResourceId);
    }

    this.form.save = () => {
      if (!this.value()) {
        params.form.saving(false);
        return;
      };
      this.form.savedData({
        selectedResourceId: this.value()
      });
      params.form.complete(true);
      params.form.saving(false);
    };
  }

  ko.components.register('select-resource-id', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
