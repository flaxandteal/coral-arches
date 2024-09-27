define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'templates/views/components/cards/default.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);

    this.tileId = this.tile.tileid;
    this.resourceId = this.tile.resourceinstance_id;

    this.fetchTileData = async (resourceId, nodeId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getLatestTile = async () => {
      try {
        const tiles = await this.fetchTileData(this.resourceId, params.nodegroupid);

        if (!tiles?.length) return;

        const tile = tiles[0];

        if (!tile) return;

        Object.keys(tile.data).forEach((nodeId) => {
          this.setValue(tile.data[nodeId], nodeId);
        });

        this.tile.tileid = tile.tileid;

        // Reset dirty state
        this.tile._tileData(koMapping.toJSON(this.tile.data));
      } catch (err) {
        console.error('failed fetching tile: ', err);
      }
    };

    this.setValue = (value, nodeId) => {
      if (ko.isObservable(this.tile.data[nodeId])) {
        this.tile.data[nodeId](value);
      } else {
        this.tile.data[nodeId] = ko.observable();
        this.tile.data[nodeId](value);
      }
    };

    this.getLatestTile();
  }

  ko.components.register('fetch-latest-tile', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});
