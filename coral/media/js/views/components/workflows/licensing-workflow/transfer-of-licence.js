define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  // 'templates/views/components/workflows/licensing-workflow/transfer-of-licence.htm'
  'templates/views/components/cards/default.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.APPLIED_NODE_ID = '1938e0ac-703d-11ef-934d-0242ac120006';

    this.form.checkShowManyTileControls((tileId) =>
      ko.computed(() => {
        const tile = this.form.tiles()?.find((tile) => tile.tileid === tileId);
        if (!tile) {
          return true;
        }
        if (ko.unwrap(tile.data[this.APPLIED_NODE_ID]) === true) {
          return false;
        }
        return true;
      }, this)
    );
  }

  ko.components.register('transfer-of-licence', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});
