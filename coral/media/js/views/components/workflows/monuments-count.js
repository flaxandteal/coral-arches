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

    const HA_NODEGROUP_ID = params.relatedHANodeGroupID;
    const MONUMENT_COUNT_NODE = params.mounmentNode;
    const SCHEDULED_MONUMENT_COUNT_NODE = params.scheduledMonumentNode;
    const HA_NODE = "2b4cfdac-04ba-11f0-9182-9e7c335817fb";

    CardComponentViewModel.apply(this, [params]);

    if (this.tile.data[HA_NODE] && ko.isObservable(this.tile.data[HA_NODE])) {
      console.log("IN IF");

      this.tile.data[HA_NODE].subscribe(() => {
        console.log("subscribed to HA node");
        const monumentCount = this.tile.data[HA_NODE]().length;
        this.tile.data[MONUMENT_COUNT_NODE](monumentCount);
      });
    };

      this.fetchTileData = async (resourceId) => {

        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId));

        const data = await tilesResponse.json();

        return data.tiles;
      };

      this.returnScheduledMonumentData = async (nodeId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', nodeId));

        const data = await tilesResponse.json();

        return data.tiles;
      };

      const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

      this.returnScheduledMonumentCount = async () => {
        const haTIleData = this.tile.data[HA_NODE]();
        var countItr = 0;

        haTIleData.forEach(async (tile) => {
          const scheduledMonumentData = await this.returnScheduledMonumentData(tile['resourceId']);
          
           scheduledMonumentData.forEach((data) => {
            if (data['nodegroup'] == '6af2a0cb-efc5-11eb-8436-a87eeabdefba') {
              if (data['data']['74ef37e0-37b5-11ef-9263-0242ac150006']) {
                countItr++;
              };
            };
          });
        });

        await sleep(1500); // not ideal but foreach isn't aware of await/async so func was returning before loops were finished
        return countItr;
      };
      
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

          console.log(this.tile.data[HA_NODE](), "HA node");

          const scheduledMonumentCount = await this.returnScheduledMonumentCount();
          this.tile.data[SCHEDULED_MONUMENT_COUNT_NODE](scheduledMonumentCount);

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

    
  
    ko.components.register('monuments-count', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
