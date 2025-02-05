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
    const ISSUE_DATE_NODE = "ea5bb474-e217-11ef-803e-0242ac120003"
    const VALID_UNTIL_NODE = "2b82c62c-e218-11ef-803e-0242ac120003"

    console.log("Hello from date component ", AGRICULTURE_DATE_NODEGROUP_ID);
    
    CardComponentViewModel.apply(this, [params]);

      if (this.tile.data[ISSUE_DATE_NODE] && ko.isObservable(this.tile.data[ISSUE_DATE_NODE])) {
        this.tile.data[ISSUE_DATE_NODE].subscribe(issueDate => {
          const validUntilDate = this.addTwoWeeks(issueDate)
          this.tile.data[VALID_UNTIL_NODE](validUntilDate)
        })
      }

      this.fetchTileData = async () => {

        console.log("Fetching tiles params ", params.baseResourceId + " " + ISSUE_DATE_NODE);

        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', params.baseResourceId) +
            (ISSUE_DATE_NODE ? `?nodeid=${ISSUE_DATE_NODE}` : '')
        );

        const data = await tilesResponse.json();

        console.log("Response data ", data);

        return data.tiles;
      };
      
      
      this.addTwoWeeks = (dateString) => {
        const date = new Date(dateString);

        date.setDate(date.getDate() + 14);
      
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      this.getLatestTile = async () => {
        try {
          const tiles = await this.fetchTileData(this.tile.resourceinstance_id, params.nodegroupid);
  
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
  