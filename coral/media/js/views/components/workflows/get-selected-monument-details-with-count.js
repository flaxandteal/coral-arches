import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import { hasListItem, referenceLabel } from 'utils/reference-values';

const NO_DATA = 'No data available';
const NO_REF_LABEL = 'Heritage Reference Number';
import template from 'templates/views/components/workflows/get-selected-monument-details-with-count.htm';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);

  this.HERRITAGE_ASSET_REFERENCES_NODEGROUP = 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
  this.SMR_NUMBER_NODE = 'd146451b-9140-5f81-b3de-9005acc01e28';

  this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
  this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

  this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
  this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

  this.CM_REFERENCE_NODEGROUP = 'c9c4e6dc-aa34-5254-a7b5-4f79bd8b73c1';
  this.CM_REFERENCE_NODE = '9c4a43d9-a689-5ba2-bed5-4fbbd6ad47e6';

  this.ADDRESSES_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba';
  this.TOWNLAND_NODEGROUP = 'ffaf4062-be4a-52e6-ace8-7e29014f96bc';
  this.TOWNLAND_NODE = 'b7ffd24b-2db2-5d8c-8d18-17870c566fea';
  this.COUNTY_NODE = "87d3ff32-f44f-11eb-aa82-a87eeabdefba";

  this.BFILE_NODEGROUP = "34e9c49c-5523-598a-98a2-32224336d197";
  this.BFILE_NODE = "0d0b653a-03e2-5a35-9ed4-9219b0681dd0";

  this.CONSTRUCTION_NODEGROUP = "77e8f287-efdc-11eb-a790-a87eeabdefba";
  this.HA_TYPE_NODE = "77e90834-efdc-11eb-b2b9-a87eeabdefba";

  this.haRefStrings = {
    'd146451b-9140-5f81-b3de-9005acc01e28': 'SMR Number',
    '4b9883ef-9aad-559a-bd84-e4bb7b94a358': 'HB Number',
    '0b14fb28-961e-5817-9cac-c61073b58981': 'IHR Number',
    '1edc61a9-b64b-51ae-9077-536908761903': 'Historic Parks and Gardens Number'
  }

  const MONUMENT_COUNT_NODE = "a7d5d94e-1094-568a-ab49-bdd9362a1485";
  const SCHEDULED_MONUMENT_COUNT_NODE = "4cbfed23-7989-500c-9a0f-c63307d15beb";
  const HA_NODE = "0f74af35-a8d7-5a12-953a-1773d3981fec";

  this.labels = params.labels || [];

  this.selectedMonuments = ko.observable([]);

  this.cards = ko.observable({})

  this.dataNode = params.node;

  const self = this;

  this.searchString = params.searchString;

  this.form
    .card()
    ?.widgets()
    .forEach((widget) => {
      this.labels?.forEach(([prevLabel, newLabel]) => {
        if (widget.label() === prevLabel) {
          widget.label(newLabel);
        }
      });
    });

  this.tile.data[this.dataNode].subscribe((value) => {
    if (value && value.length) {
      const currentResources = value.map(t => ko.unwrap(t.resourceId))
      currentResources.forEach(id => {
        this.cards({
          ...this.cards(), [id]: {
            haType: [NO_DATA],
            haNumberLabel: NO_REF_LABEL,
            monumentName: NO_DATA,
            cmNumber: NO_DATA,
            smrNumber: NO_DATA,
            countyValue: NO_DATA,
            townlandValue: [NO_DATA]
          }
        })
        this.getMonumentDetails(id);
      })
      this.selectedMonuments(currentResources);
    } else {
      this.selectedMonuments([])
    }
  }, this);

  this.fetchTileData = async(resourceId, nodeId=null) => {
    console.log("node", resourceId, nodeId)
    const tilesResponse = await window.fetch(
      arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
        (nodeId ? `?nodeid=${nodeId}` : '')
    );
    const data = await tilesResponse.json();
    return data.tiles;
  };

  if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
    this.tile.data[HA_NODE].subscribe(async(newValue) => {
      this.tile.data[MONUMENT_COUNT_NODE](newValue.length);
      const counts = await Promise.all(
        newValue.map(item => this.returnScheduledMonumentCount(ko.unwrap(item.resourceId)))
      );
      this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE](counts.reduce((a, b) => a + b, 0));
    });
  };

  // the HA's recommended designation holds the Scheduled Monument list item
  this.returnScheduledMonumentCount = async(resourceId) => {
    const RECOMMENDED_DESIGNATION_NODE = "5aa9d22a-29c6-5de0-8119-84ee1e93081f";
    const SCHEDULED_MONUMENT_ITEM = "1e898077-9144-9ef0-b6e1-08f4e4881972";
    const tileData = await this.fetchTileData(resourceId, RECOMMENDED_DESIGNATION_NODE);
    for(const tile of tileData){
      if(hasListItem(tile.data?.[RECOMMENDED_DESIGNATION_NODE], SCHEDULED_MONUMENT_ITEM)){
        return 1;
      }
    }
    return 0;
  }

  this.getMonumentDetails = async (resourceId) => {
    const tiles = await this.fetchTileData(resourceId);
    const countyValue = ko.observable(NO_DATA);
    const monumentName = ko.observable(NO_DATA);
    const haRefNumber = ko.observable(NO_DATA);
    const haNumberLabel = ko.observable(NO_REF_LABEL);
    const haType = ko.observableArray([NO_DATA]);
    const townlandValue = ko.observableArray([NO_DATA]);

    for (const tile of tiles) {
      if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
        for (const [key, value] of Object.entries(tile.data)) {
          if (value) {
            haRefNumber(value.en.value);
            haNumberLabel(this.haRefStrings[key]);
          }
        }
      }

      if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
        monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
      }

      if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
        const townland = referenceLabel(tile.data[this.TOWNLAND_NODE]);
        const county = referenceLabel(tile.data[this.COUNTY_NODE]);
        if (townland) townlandValue([townland]);
        if (county) countyValue(county);
      }

      if (tile.nodegroup === this.CONSTRUCTION_NODEGROUP) {
        const type = referenceLabel(tile.data[this.HA_TYPE_NODE]);
        if (type) haType([type]);
      }
    }

    this.cards({
      ...this.cards(), [resourceId]: {
        haType: haType(),
        monumentName: monumentName(),
        haNumberLabel: haNumberLabel(),
        smrNumber: haRefNumber(),
        countyValue: countyValue(),
        townlandValue: townlandValue()
      }
    })
  }
}


ko.components.register('get-selected-monument-details-with-count', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
