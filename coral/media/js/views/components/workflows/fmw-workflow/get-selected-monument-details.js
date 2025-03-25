define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/fmw-workflow/get-selected-monument-details.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);
    this.SYSTEM_REFERENCE_NODEGROUP = '325a2f2f-efe4-11eb-9b0c-a87eeabdefba';
    this.SYSTEM_REFERENCE_RESOURCE_ID_NODE = '325a430a-efe4-11eb-810b-a87eeabdefba';

    this.HERRITAGE_ASSET_REFERENCES_NODEGROUP = 'e71df5cc-3aad-11ef-a2d0-0242ac120003'
    this.SMR_NUMBER_NODE = '158e1ed2-3aae-11ef-a2d0-0242ac120003';

    this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
    this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

    this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
    this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

    this.CM_REFERENCE_NODEGROUP = '3d415e98-d23b-11ee-9373-0242ac180006';
    this.CM_REFERENCE_NODE = '3d419020-d23b-11ee-9373-0242ac180006';

    this.ADDRESSES_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba'
    this.TOWNLAND_NODEGROUP = '919bcb94-345c-11ef-a5b7-0242ac120003';
    this.TOWNLAND_NODE = 'd033683a-345c-11ef-a5b7-0242ac120003';

    this.BFILE_NODEGROUP = "4e6c2d46-1f3f-11ef-ac74-0242ac150006";
    this.BFILE_NODE = "72331a22-4ff1-11ef-a810-0242ac120009";

    this.haRefStrings = {
      '158e1ed2-3aae-11ef-a2d0-0242ac120003': 'SMR Number',
      '250002fe-3aae-11ef-91fd-0242ac120003': 'HB Number',
      '1de9abf0-3aae-11ef-91fd-0242ac120003': 'IHR Number',
      '2c2d02fc-3aae-11ef-91fd-0242ac120003': 'Historic Parks and Gardens Number'
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
      const designationType = ko.observableArray(['None']);
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
          designationType.removeAll()
          typeId.forEach(id => {
            additionalPromises.push($.ajax({
              type: 'GET',
              url: arches.urls.concept_value + `?valueid=${id}`,
              context: self,
              success: function (responseJSON, status, response) {
                designationType.push(responseJSON.value);
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
          
  }}

  ko.components.register('get-selected-monument-details', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
