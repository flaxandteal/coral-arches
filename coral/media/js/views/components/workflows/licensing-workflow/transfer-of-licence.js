import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import defaultTemplate from 'templates/views/components/cards/default.htm';

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
  template: defaultTemplate
});

export default viewModel;
