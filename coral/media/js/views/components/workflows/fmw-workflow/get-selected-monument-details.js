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

    this.DESIGNATIONS_NODEGROUP = '6af2a0cb-efc5-11eb-8436-a87eeabdefba';
    this.DESIGNATIONS_TYPE_NODE = '6af2a0ce-efc5-11eb-88d1-a87eeabdefba';

    this.MONUMENT_NAMES_NODEGROUP = '676d47f9-9c1c-11ea-9aa0-f875a44e0e11';
    this.MONUMENT_NAMES_NODE = '676d47ff-9c1c-11ea-b07f-f875a44e0e11';

    this.CM_REFERENCE_NODEGROUP = '3d415e98-d23b-11ee-9373-0242ac180006';
    this.CM_REFERENCE_NODE = '3d419020-d23b-11ee-9373-0242ac180006';

    this.TOWNLAND_NODEGROUP = '87d38725-f44f-11eb-8d4b-a87eeabdefba';
    this.TOWNLAND_NODE = '87d3c3ea-f44f-11eb-b532-a87eeabdefba';

    this.labels = params.labels || [];

    this.selectedMonument = ko.observable();

    this.designationType = ko.observable();
    this.monumentName = ko.observable();
    this.cmNumber = ko.observable();
    this.smrNumber = ko.observable();
    this.townlandValue = ko.observable();

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

    this.tile.data['58a2b98f-a255-11e9-9a30-00224800b26d'].subscribe((value) => {
      if (value && value.length) {
        const resourceId = value[0].resourceId();
        this.selectedMonument(resourceId);
        this.getMonumentDetails(resourceId);
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

      for (const tile of tiles) {
        if (tile.nodegroup === this.SYSTEM_REFERENCE_NODEGROUP) {
          this.smrNumber(tile.data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE].en.value);
        }

        if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
          this.monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
        }

        if (tile.nodegroup === this.CM_REFERENCE_NODEGROUP) {
          this.cmNumber(tile.data[this.CM_REFERENCE_NODE].en.value);
        }

        if (tile.nodegroup === this.DESIGNATIONS_NODEGROUP) {
          const typeId = tile.data[this.DESIGNATIONS_TYPE_NODE];
          const response = await $.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${typeId}`,
            context: self,
            success: function (responseText, status, response) {
              //
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
          });
          this.designationType(response.value);
        }

        if (tile.nodegroup === this.TOWNLAND_NODEGROUP) {
          const typeId = tile.data[this.TOWNLAND_NODE];
          const response = await $.ajax({
            type: 'GET',
            url: arches.urls.concept_value + `?valueid=${typeId}`,
            context: self,
            success: function (responseText, status, response) {
              //
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
          });
          this.townlandValue(response.value);
        }
      }
    };
  }

  ko.components.register('get-selected-monument-details', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
