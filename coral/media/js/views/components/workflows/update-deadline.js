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
    const DEADLINE_NODE = '9bcf2ec2-018a-4ccc-a895-f45ffc22239e';
    
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

        if (!dateTiles) return false;

        const responseDate = new Date(dateTiles.data[RESPONSE_DATE_NODE]);
        const dueDate = new Date(dateTiles.data[DUE_DATE_NODE]);

        if (RESPONSE_DATE_NODE in dateTiles.data && dateTiles.data[RESPONSE_DATE_NODE] === null) {
          return false;
        }

        if (responseDate < dueDate) {
            return true;   
        }

          return false
      }

      this.init = async() => {
        const bool = await this.withinDeadline();
        this.tile.data[DEADLINE_NODE](bool);
      }
      
      this.init();

    }

    ko.components.register('update-deadline', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
