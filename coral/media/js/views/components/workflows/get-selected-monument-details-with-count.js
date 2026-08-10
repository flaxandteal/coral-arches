import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
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
            haType: "",
            monumentName: "",
            cmNumber: "",
            smrNumber: "",
            countyValue: "",
            townlandValue: ""
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

  let previousValue;

  // get the old value of the drop down
  if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
    this.tile.data[HA_NODE].subscribe(async(oldValue) => {
      previousValue = oldValue;
    }, null, "beforeChange");
  }

  // get the new value and compare with the previous to find what has been added
  if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
    this.tile.data[HA_NODE].subscribe(async(newValue) => {
      let newEntry = [];
      if (previousValue){
        newEntry = newValue.filter(item => previousValue.indexOf(item) === -1);
      } else {
        newEntry = newValue;
      }
      const monumentCount = this.tile.data[HA_NODE]().length;
      this.tile.data[MONUMENT_COUNT_NODE](monumentCount);
      const scheduledMonumentCount = await this.returnScheduledMonumentCount(ko.unwrap(newEntry[0].resourceId));
      this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE](this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE]() + scheduledMonumentCount);
    }, "arrayChange");
  };

  // check the HA recommend for scheduled monument - only present if revision merged in
  this.returnScheduledMonumentCount = async(resourceId) => {
    const RECOMMENDED_DESIGNATION_NODE = "5aa9d22a-29c6-5de0-8119-84ee1e93081f"
    const SCHEDULED_MONUMENT_CONCEPT = "40462188-3aa9-cdaf-8b1d-3ed8dfa57df9"
    const tileData = await this.fetchTileData(resourceId, RECOMMENDED_DESIGNATION_NODE);
    for(const tile of tileData){
      if(tile.data[RECOMMENDED_DESIGNATION_NODE].includes(SCHEDULED_MONUMENT_CONCEPT)){
        return 1;
      }
    }
    return 0;
  }

  this.getMonumentDetails = async (resourceId) => {
    const tiles = await this.fetchTileData(resourceId);
    const countyValue = ko.observable('None');
    const monumentName = ko.observable('None');
    const haRefNumber = ko.observable('None');
    const haNumberLabel = ko.observable('Heritage Asset Ref Number');
    const haType = ko.observableArray(['None']);
    const townlandValue = ko.observableArray(['None']);

    const additionalPromises = []

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
        const townlandData = tile.data[this.TOWNLAND_NODE];
        const countyData = tile.data[this.COUNTY_NODE];

        const idsToFetch = []
        if (townlandData){
          townlandValue.removeAll();
          townlandData.forEach(id => {
            idsToFetch.push({ key: this.TOWNLAND_NODE, id })
          })
        }
        if (countyData){
          idsToFetch.push({ key: this.COUNTY_NODE, id: countyData})
        }

        idsToFetch.forEach(id => {
          additionalPromises.push($.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${id.id}`,
            context: self,
            success: function (responseJSON, status, response) {
              if(id.key === this.TOWNLAND_NODE){
                townlandValue.push(responseJSON.value);
              }
              else if(id.key === this.COUNTY_NODE){
                countyValue(responseJSON.value);
              }
            },
            error: function (response, status, error) {
              if (response.statusText !== 'abort') {
                const alert = new AlertViewModel(
                  'ep-alert-red',
                  arches.requestFailed.title,
                  response.responseText
                )
                this.viewModel.alert(alert);
              }
              return
            }
          }))
        })
      }

      if (tile.nodegroup === this.CONSTRUCTION_NODEGROUP) {
        const typeId = tile.data[this.HA_TYPE_NODE];
        if (!typeId) continue;
        haType.removeAll()
        typeId.forEach(id => {
          additionalPromises.push($.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${id}`,
            context: self,
            success: function (responseJSON, status, response) {
              haType.push(responseJSON.value);
            },
            error: function (response, status, error) {
              if (response.statusText !== 'abort') {
                const alert = new AlertViewModel(
                  'ep-alert-red',
                  arches.requestFailed.title,
                  response.responseText
                )
                this.viewModel.alert( alert );
              }
              return
            }
          }))
        })
      }
    }

    await Promise.all(additionalPromises);

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
