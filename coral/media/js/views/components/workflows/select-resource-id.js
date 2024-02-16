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

    params.configKeys = ['placeholder', 'defaultResourceInstance'];
    params.graphids = params.graphIds;

    ResourceInstanceSelectViewModel.apply(this, [params]);

    this.tileIds = ko.observable(params.form.savedData()?.tileIds || {});

    if (this.form.savedData()?.selectedResourceId) {
      this.value(this.form.savedData()?.selectedResourceId);
    }

    if (params.label) {
      this.label(params.label);
    }

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

      this.tileIds()[lookupName] = tiles[0].tileid;
    };

    this.form.save = async () => {
      if (!this.value()) {
        params.form.saving(false);
        return;
      }
      await Promise.all(params.getTileIdFromNodegroup.map(this.getTile));

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

  return viewModel;
});
