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

    this.labels = params.labels || [];

    this.selectedMonuments = ko.observable([]);

    this.cards = ko.observable({})

    const self = this

    console.log("In selected comp");
    console.log("Tile data ", this.tile.data['bc64746e-cf4a-11ef-997c-0242ac120007']());

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

    this.tile.data['bc64746e-cf4a-11ef-997c-0242ac120007'].subscribe((value) => {
      if (value && value.length) {
        console.log("Value ", value);
        currentResources = value.map(t => ko.unwrap(t.resourceId))
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
      console.log("Recource id ", resourceId);
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      return data.tiles;
    };

    this.getMonumentDetails = async (resourceId) => {
      console.log("Recource id ", resourceId);
      const tiles = await this.fetchTileData(resourceId);
      const designationType = ko.observable();
      const monumentName = ko.observable();
      const cmNumber = ko.observable();
      const smrNumber = ko.observable();
      const bFile = ko.observable();
      const townlandValue = ko.observable();

      console.log("TIles ", tiles);

      const additionalPromises = []

      for (const tile of tiles) {
        if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
          smrNumber(tile.data[this.SMR_NUMBER_NODE].en.value);
          console.log(smrNumber());
        }

        if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
          monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
          console.log(monumentName());
        }

        if (tile.nodegroup === this.CM_REFERENCE_NODEGROUP) {
          cmNumber(tile.data[this.CM_REFERENCE_NODE].en.value);
          console.log(cmNumber());
        }

        if (tile.nodegroup === this.BFILE_NODEGROUP) {
          let bfileIds = tile.data[this.BFILE_NODE].map(t => t.resourceId)
          
          for (let id of bfileIds) {
            additionalPromises.push(await $.ajax({
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
          additionalPromises.push(await $.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${typeId}`,
            context: self,
            success: function (responseJSON, status, response) {
              designationType(responseJSON.value);
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

        if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
          const typeId = tile.data[this.TOWNLAND_NODE];
          additionalPromises.push(await $.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${typeId}`,
            context: self,
            success: function (responseJSON, status, response) {
              townlandValue(responseJSON.value);
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
        await Promise.all(additionalPromises)
        .then((p) => {
          //
        })
        .catch(p => {
          //
        })
        .finally(() => {
          this.cards({...this.cards(), [resourceId]: {
            designationType : designationType(),
            monumentName : monumentName(),
            cmNumber : cmNumber(),
            smrNumber : smrNumber(),
            bFile : bFile(),
            townlandValue : townlandValue()
          }})
        })
    };
    if (this.tile.data['bc64746e-cf4a-11ef-997c-0242ac120007']())  {
      const preFilled = this.tile.data['bc64746e-cf4a-11ef-997c-0242ac120007']().map(t => t.resourceId)
      preFilled.forEach(id => {
        this.cards()[id] = {
          designationType : "",
          monumentName : "",
          cmNumber : "",
          smrNumber : "",
          bFile : "",
          townlandValue : ""
        }
        this.getMonumentDetails(id);
      })
      this.selectedMonuments(preFilled);
    }
  }

  ko.components.register('get-selected-heritage-asset-details', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
