import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import AlertViewModel from 'viewmodels/alert';
import CardComponentViewModel from 'viewmodels/card-component';
import template from 'templates/views/components/workflows/select-resource-id.htm';
import ResourceInstanceSelectViewModel from 'viewmodels/resource-instance-select';

function viewModel(params) {
  // ResourceInstanceSelectViewModel imported at top of file

  params.graphids = params.graphIds;

  ResourceInstanceSelectViewModel.apply(this, [params]);

  this.tileIds = ko.observable(params.form.savedData()?.tileIds || {});

  if (this.form.savedData()?.selectedResourceId) {
    this.value(this.form.savedData()?.selectedResourceId);
  }

  this.label = params.label;

  this.fetchTileData = async (resourceId, nodeId) => {
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
        (nodeId ? `?nodeid=${nodeId}` : '')
    );
    const data = await tilesResponse.json();
    return data.tiles;
  };

  this.getTile = async ({ nodegroupId, lookupName }) => {
    const tiles = await this.fetchTileData(this.value(), nodegroupId);

    if (!tiles.length === 1) return;

    this.tileIds()[lookupName] = tiles.length ? tiles[0].tileid : null;
  };

  this.form.save = async () => {
    if (!this.value()) {
      params.form.saving(false);
      return;
    }
    if (params.getTileIdFromNodegroup && Array.isArray(params.getTileIdFromNodegroup)) {
      await Promise.all(params.getTileIdFromNodegroup?.map(this.getTile));
    }

    // TODO: Catch errors

    this.form.savedData({
      selectedResourceId: this.value(),
      tileIds: this.tileIds(),
      ...this.tileIds()
    });
    params.form.complete(true);
    params.form.saving(false);
  };
}

ko.components.register('select-resource-id', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
