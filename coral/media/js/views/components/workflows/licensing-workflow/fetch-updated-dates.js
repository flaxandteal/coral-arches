define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'templates/views/components/cards/default.htm',
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, componentTemplate) {
    function viewModel(params) {

    DATES_NODEGROUP_ID = "05f6b846-5d49-11ee-911e-0242ac130003"
    ACTUAL_START_DATE_NODE = "97f6c776-5d4a-11ee-9b75-0242ac130003"
    VALID_UNTIL_NODE = "1887fc86-c42d-11ee-bc4b-0242ac180006"

    CardComponentViewModel.apply(this, [params]);

      this.fetchTileData = async (resourceId, nodeId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
            (nodeId ? `?nodeid=${nodeId}` : '')
        );

        const data = await tilesResponse.json();
        return data.tiles;
      };
      
      this.fetchDatesTile = async () => {
        const tiles = await this.fetchTileData(this.tile.resourceinstance_id, DATES_NODEGROUP_ID);

        if (tiles.length === 1){
          return tiles[0];
        }
      };
      
      this.getActualStartDate = async () => {
        const validUntilTile = await this.fetchDatesTile()

        if (!validUntilTile) {
          return
        }
        const validUntil = validUntilTile.data[ACTUAL_START_DATE_NODE];
        return validUntil;
      }

      this.updateValidUntilDate = async () => {
        if(this.tile.data[VALID_UNTIL_NODE]()){
          return
        }
        const validUntil = await this.getActualStartDate();
        if (!validUntil) {
          return
        }
        const futureDate = this.addSixMonths(validUntil);
        if (ko.isObservable(this.tile.data[VALID_UNTIL_NODE])) {
          this.tile.data[VALID_UNTIL_NODE](futureDate);
        } else {
          this.tile.data[VALID_UNTIL_NODE] = futureDate;
        }
      }

      this.addSixMonths = (dateString) => {
        const date = new Date(dateString);

        date.setMonth(date.getMonth() + 6);
      
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      this.updateValidUntilDate()
    }
  
    ko.components.register('fetch-updated-dates', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
  