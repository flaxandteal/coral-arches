define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'templates/views/components/workflows/generate-smr-number.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);
    console.log('generate-smr-number: ', this);
  }

  ko.components.register('generate-smr-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
