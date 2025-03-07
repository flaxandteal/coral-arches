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

    const DATE_NODEGROUP_ID = params.dateNodeGroupID;
    const ISSUE_DATE_NODE = params.issueDateNode;
    const DUE_DATE_UNTIL_NODE = params.dueDateNode;
    const DAYS_TO_ADD = params.daysToAdd;
    
    CardComponentViewModel.apply(this, [params]);

      if (this.tile.data[ISSUE_DATE_NODE] && ko.isObservable(this.tile.data[ISSUE_DATE_NODE])) {
        this.tile.data[ISSUE_DATE_NODE].subscribe(issueDate => {
          const dueDate = this.addDays(issueDate)
          this.tile.data[DUE_DATE_UNTIL_NODE](dueDate)
        })
      }

      this.fetchTileData = async (resourceId) => {

        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
            (DATE_NODEGROUP_ID ? `?nodeid=${DATE_NODEGROUP_ID}` : '')
        );

        const data = await tilesResponse.json();

        return data.tiles;
      };
      
      
      this.addDays = (dateString) => {
        const date = new Date(dateString);

        date.setDate(date.getDate() + DAYS_TO_ADD);
      
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    
  
    ko.components.register('update-dates', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
  