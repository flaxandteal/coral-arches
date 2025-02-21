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

    const AGRICULTURE_DATE_NODEGROUP_ID = "5d6eecde-e217-11ef-803e-0242ac120003"
    const RESPONSE_DATE_NODE = '798d9d74-e218-11ef-803e-0242ac120003';
    const DUE_DATE_NODE = '5b6a2ede-e218-11ef-803e-0242ac120003';
    const DEADLINE_NODE = 'ff42f8f2-3e93-11ef-9023-0242ac140007';
    
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

        const responseDate = new Date(dateTiles.data[RESPONSE_DATE_NODE]);
        const dueDate = new Date(dateTiles.data[DUE_DATE_NODE]);

        if (responseDate < dueDate) {
            return true;   
        } else {
          return false
        }
      }

      this.getLatestTile = async () => {
        try {
          const tiles = await this.fetchTileData(this.tile.resourceinstance_id);
  
          if (!tiles?.length) return;
  
          const tile = tiles[0];
      
          if (!tile) return;
  
          Object.keys(tile.data).forEach((nodeId) => {
            this.setValue(tile.data[nodeId], nodeId);
          });
  
          this.tile.tileid = tile.tileid;

          const bool = await this.withinDeadline();
          this.tile.data[DEADLINE_NODE](bool)

          // Reset dirty state
          this.tile._tileData(koMapping.toJSON(this.tile.data));
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

    
  
    ko.components.register('update-deadline', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
