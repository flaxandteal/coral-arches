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

    this.LICENCE_CONTACTS_NODEGROUP = '6d290832-5891-11ee-a624-0242ac120004';
    this.APPLICANT_NODE = '6d2924b6-5891-11ee-a624-0242ac120004';
    this.EXCAVATION_DIRECTOR_NODE = '6d294784-5891-11ee-a624-0242ac120004';
    this.EMPLOYING_BODY_NODE_ID = "07d3905c-d58b-11ee-a02f-0242ac180006";

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
        const tiles = await this.fetchTileData(this.resourceId, this.LICENCE_CONTACTS_NODEGROUP);

        const contactsTile = tiles[0];

        if (!contactsTile) return;

        this.setValue(contactsTile.data[this.APPLICANT_NODE], this.APPLICANT_NODE);
        this.setValue(contactsTile.data[this.EXCAVATION_DIRECTOR_NODE], this.EXCAVATION_DIRECTOR_NODE);
        this.setValue(contactsTile.data[this.EMPLOYING_BODY_NODE_ID], this.EMPLOYING_BODY_NODE_ID);

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

  ko.components.register('fetch-latest-contacts', {
    viewModel: viewModel,
    template: componentTemplate
  });

  return viewModel;
});
