import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import componentTemplate from 'templates/views/components/cards/default.htm';

function viewModel(params) {

const AGRICULTURE_DATE_NODEGROUP_ID = "c57c0e55-9d47-5161-ad50-5c27eadb5d3a"
const RESPONSE_DATE_NODE = '0da2486a-aaca-5b02-beb7-f81a2ebab9aa';
const DUE_DATE_NODE = '4dd92777-2d90-515a-bbf5-540796a299ff';
const DEADLINE_NODE = 'eae8dfeb-f907-50e2-9a59-7c6a2c847504';

CardComponentViewModel.apply(this, [params]);

  this.fetchTileData = async (resourceId) => {
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
    );

    const data = await tilesResponse.json();

    return data.tiles;
  };

  this.fetchAgriDate = async (resourceId) => {
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
        (AGRICULTURE_DATE_NODEGROUP_ID ? `?nodeid=${AGRICULTURE_DATE_NODEGROUP_ID}` : '')
    );

    const data = await tilesResponse.json();

    return data.tiles[0];
  }

  this.withinDeadline = async () => {
    const dateTiles = await this.fetchAgriDate(this.tile.resourceinstance_id);

    if (!dateTiles) return false;

    const responseDate = new Date(dateTiles.data[RESPONSE_DATE_NODE]);
    const dueDate = new Date(dateTiles.data[DUE_DATE_NODE]);

    if (RESPONSE_DATE_NODE in dateTiles.data && dateTiles.data[RESPONSE_DATE_NODE] === null) {
      return false;
    }

    if (responseDate < dueDate) {
        return true;   
    }

      return false
  }

  this.init = async() => {
    const bool = await this.withinDeadline();
    this.tile.data[DEADLINE_NODE](bool);
  }

  this.init();

}

ko.components.register('update-deadline', {
  viewModel: viewModel,
  template: componentTemplate
});

export default viewModel;
