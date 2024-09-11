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


    console.log('this: ', this);

    this.tileId = this.tile.tileid;
    this.resourceId = this.tile.resourceinstance_id;

    console.log('tile id: ', this.tileId);
    console.log('resource id: ', this.resourceId);

    this.fetchTileData = async (resourceId, nodeId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
          (nodeId ? `?nodeid=${nodeId}` : '')
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getLatestTile = async () => {
      console.log('called get latest tile');

      try {
        const tiles = await this.fetchTileData(this.resourceId, this.LICENCE_CONTACTS_NODEGROUP);
        console.log('tiles: ', tiles);

        const contactsTile = tiles[0];
        console.log('contacts: ', contactsTile);

        if (!contactsTile) return;

        console.log('contactsTile.data[this.APPLICANT_NODE]: ', contactsTile.data[this.APPLICANT_NODE])
        console.log('contactsTile.data[this.EXCAVATION_DIRECTOR_NODE]: ', contactsTile.data[this.EXCAVATION_DIRECTOR_NODE])

        console.log('this.tile: ', this.tile)

        this.setValue(contactsTile.data[this.APPLICANT_NODE], this.APPLICANT_NODE);
        this.setValue(contactsTile.data[this.EXCAVATION_DIRECTOR_NODE], this.EXCAVATION_DIRECTOR_NODE);

        console.log('this.tile.data[this.APPLICANT_NODE]: ', this.tile.data[this.APPLICANT_NODE]())
        console.log('this.tile.data[this.EXCAVATION_DIRECTOR_NODE]: ', this.tile.data[this.EXCAVATION_DIRECTOR_NODE]())

      } catch (err) {
        console.error('failed fetching tile: ', err);
      }
    };

    this.setValue = (value, nodeId) => {
      // const localisedValue = {
      //   en: {
      //     direction: 'ltr',
      //     value: value
      //   }
      // };
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
