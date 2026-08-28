import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/fmw-workflow/get-selected-monument-details.htm';

  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);
    this.SYSTEM_REFERENCE_NODEGROUP = '325a2f2f-efe4-11eb-9b0c-a87eeabdefba';
    this.SYSTEM_REFERENCE_RESOURCE_ID_NODE = '325a430a-efe4-11eb-810b-a87eeabdefba';

    this.HERRITAGE_ASSET_REFERENCES_NODEGROUP = 'ebd91984-e3fd-5dcd-b8e0-42d63cda77fc'
    this.SMR_NUMBER_NODE = 'd146451b-9140-5f81-b3de-9005acc01e28';

    this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
    this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

    this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
    this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

    this.CM_REFERENCE_NODEGROUP = 'c9c4e6dc-aa34-5254-a7b5-4f79bd8b73c1';
    this.CM_REFERENCE_NODE = '9c4a43d9-a689-5ba2-bed5-4fbbd6ad47e6';

    this.ADDRESSES_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba'
    this.TOWNLAND_NODEGROUP = 'ffaf4062-be4a-52e6-ace8-7e29014f96bc';
    this.TOWNLAND_NODE = 'd033683a-345c-11ef-a5b7-0242ac120003';

    this.BFILE_NODEGROUP = "34e9c49c-5523-598a-98a2-32224336d197";
    this.BFILE_NODE = "0d0b653a-03e2-5a35-9ed4-9219b0681dd0";

    this.haRefStrings = {
      'd146451b-9140-5f81-b3de-9005acc01e28': 'SMR Number',
      '4b9883ef-9aad-559a-bd84-e4bb7b94a358': 'HB Number',
      '0b14fb28-961e-5817-9cac-c61073b58981': 'IHR Number',
      '1edc61a9-b64b-51ae-9077-536908761903': 'Historic Parks and Gardens Number'
    }

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
          this.cards({...this.cards(), [id] : {
            designationType : "",
            monumentName : "",
            cmNumber : "",
            smrNumber : "",
            bFile : "",
            townlandValue : ""
          }})
          this.getMonumentDetails(id);
        })
        this.selectedMonuments(currentResources);
      } else {
        this.selectedMonuments([])
      }
    }, this);

    this.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getMonumentDetails = async (resourceId) => {
      const tiles = await this.fetchTileData(resourceId);
      const designationType = ko.observable('None');
      const monumentName = ko.observable('None');
      const haRefNumber = ko.observable('None');
      const haNumberLabel = ko.observable('Heritage Asset Ref Number');
      const bFile = ko.observable('None');
      const townlandValue = ko.observableArray(['None']);

      const additionalPromises = []

      for (const tile of tiles) {
        if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
          for (const [key, value] of Object.entries(tile.data)){
            if (value){
              haRefNumber(value.en.value);
              haNumberLabel(this.haRefStrings[key]);
            }
          }
        }

        if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
          monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
        }

        if (tile.nodegroup === this.BFILE_NODEGROUP) {
          let bfileIds = tile.data[this.BFILE_NODE].map(t => t.resourceId)
          bFile('');
          for (let id of bfileIds) {
            additionalPromises.push($.ajax({
              type: 'GET',
              url: arches.urls.api_resource_report(id),
              context: self,
              success: async function (responseJSON, status, response) {
                bFile(bFile() ? `${bFile()},\n${responseJSON.report_json["Display Name"]["Display Name Value"]}`: responseJSON.report_json["Display Name"]["Display Name Value"])
              },
              error: function (response, status, error) {
                if (response.statusText !== 'abort') {
                  this.viewModel.alert(
                    new AlertViewModel(
                      'ep-alert-red',
                      arches.requestFailed.title,
                      response.responseText
                    )
                  );
                }
              }
          }))
        }
      }

        if (tile.nodegroup === this.DESIGNATIONS_NODEGROUP) {
          const typeId = tile.data[this.DESIGNATIONS_TYPE_NODE];
          if(!typeId) continue;
          additionalPromises.push($.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${typeId}`,
            context: self,
            success: function (responseJSON, status, response) {
              designationType(responseJSON.value);
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
        }

        if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
          const typeId = tile.data[this.TOWNLAND_NODE];
          if (!typeId) continue;
          townlandValue.removeAll()
          typeId.forEach(id => {
            additionalPromises.push($.ajax({
              type: 'GET',
              url: arches.urls.concept_value + `?valueid=${id}`,
              context: self,
              success: function (responseJSON, status, response) {
                townlandValue.push(responseJSON.value);
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

    this.cards({...this.cards(), [resourceId]: {
              designationType : designationType(),
              monumentName : monumentName(),
              haNumberLabel: haNumberLabel(),
              smrNumber : haRefNumber(),
              bFile : bFile(),
              townlandValue : townlandValue()
            }})
  }

  // This will force a refresh to generate the tile if it already exists - not ideal
  this.tile.data[this.dataNode](this.tile.data[this.dataNode]())

}

  ko.components.register('get-selected-monument-details', {
    viewModel: viewModel,
    template: template
  });

export default viewModel;
