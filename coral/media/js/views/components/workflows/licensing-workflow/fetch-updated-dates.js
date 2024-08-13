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

    LICENSE_TIMESPAN_NODEGROUP_ID = "1887f678-c42d-11ee-bc4b-0242ac180006"
    ISSUE_DATE_NODE = "1887faf6-c42d-11ee-bc4b-0242ac180006"
    VALID_UNTIL_NODE = "1887fc86-c42d-11ee-bc4b-0242ac180006"
    
    LICENSE_NUMBER_NODEGROUP = "6de3741e-c502-11ee-86cf-0242ac180006"
    LICENSE_NUMBER_VALUE_NODE = "9a9e198c-c502-11ee-af34-0242ac180006"

    CardComponentViewModel.apply(this, [params]);

      this.hasLicenseNumber = ko.observable(false)

      if (this.tile.data[ISSUE_DATE_NODE] && ko.isObservable(this.tile.data[ISSUE_DATE_NODE])) {
        this.tile.data[ISSUE_DATE_NODE].subscribe(issueDate => {
          if (this.hasLicenseNumber()) return
          const validUntilDate = this.addSixMonths(issueDate)
          this.tile.data[VALID_UNTIL_NODE](validUntilDate)
        })
      }

      this.fetchTileData = async (resourceId, nodeId) => {
        const tilesResponse = await window.fetch(
          arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId) +
            (nodeId ? `?nodeid=${nodeId}` : '')
        );

        const data = await tilesResponse.json();
        return data.tiles;
      };
      
      this.fetchLicenseNumberTile = async () => {
        const tiles = await this.fetchTileData(this.tile.resourceinstance_id, LICENSE_NUMBER_NODEGROUP);

        if (tiles.length === 1){
          return tiles[0];
        }
      };
      
      this.checkForLicenseNumberValue = async () => {
        const licenseNumberTile = await this.fetchLicenseNumberTile()

        if (!licenseNumberTile) {
          return false
        }
        if (licenseNumberTile.data[LICENSE_NUMBER_VALUE_NODE]) {
          return true;
        }
        return false
      }

      this.checkForLicenseNumberValue().then(result => {
        this.hasLicenseNumber(result)
        console.log(result)
      })

      this.addSixMonths = (dateString) => {
        const date = new Date(dateString);

        date.setMonth(date.getMonth() + 6);
      
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  
    ko.components.register('fetch-updated-dates', {
      viewModel: viewModel,
      template: componentTemplate
    });
  
    return viewModel;
  });
  