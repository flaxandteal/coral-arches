define([
    'underscore',
    'knockout',
    'knockout-mapping',
    'uuid',
    'arches',
    'viewmodels/card-component',
    'templates/views/components/workflows/generate-garden-number.htm'
  ], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, template) {
    function viewModel(params) {
      CardComponentViewModel.apply(this, [params]);
      console.log('generate-garden-number: ', this.tiles());
  
      this.gardenNumber = ko.observable('');
  
      this.ADDRESS_NODEGROUP = "87d39b25-f44f-11eb-95e5-a87eeabdefba"
      this.COUNTY_NODE_ID = '8bfe714e-3ec2-11ef-9023-0242ac140007';
      this.GENERATED_GARDEN_NODE_ID = 'bb3860284-4414-11ef-ac80-0242ac120002';
      console.log("URL TEST", arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', this.tile.resourceinstance_id) + `?nodeid=${this.COUNTY_NODEGROUP}` )
      console.log("tile data", this.tile)

      this.selectedCounty = ko.observable();
      this.errorMessage = "No county has been selected"

      this.fetchCountyTile = async () => {
        try {
          const response = await window.fetch(
            arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', this.tile.resourceinstance_id) + `?nodeid=${this.ADDRESS_NODEGROUP}` 
          )
          const data = await response.json()
          return data.tiles[0];
        } catch (error) {
          console.error(error)
          return null
        }
        
      }

      this.getCountyName = async () => {
        const tile = await this.fetchCountyTile()
        if (tile) {
          const countyName = tile.display_values.find(object => object.nodeid === this.COUNTY_NODE_ID).value
          if (countyName) {
            this.selectedCounty(countyName)
          }
        }
      }

      this.hasSelectedCounty = ko.computed(() => {
        return !!this.selectedCounty();
      }, this);
  
      this.generateGardenNumber = async () => {
        if (!this.selectedCounty) return;
        console.log("I'm working!")
      //   params.pageVm.loading(true);
      //   const data = {
      //     resourceInstanceId: this.tile.resourceinstance_id,
      //     selectedCountyId: this.tile.data[this.COUNTY_NODE_ID]()
      //   };
      //   const response = await $.ajax({
      //     type: 'POST',
      //     url: '/generate-garden-number',
      //     dataType: 'json',
      //     data: JSON.stringify(data),
      //     context: this,
      //     error: (response, status, error) => {
      //       console.log(response, status, error);
      //     }
      //   });
      //   if (ko.isObservable(this.tile.data[this.GENERATED_GARDEN_NODE_ID])) {
      //     this.tile.data[this.GENERATED_GARDEN_NODE_ID]({
      //       en: {
      //         value: response.gardenNumber
      //       }
      //     });
      //   } else {
      //     this.tile.data[this.GENERATED_GARDEN_NODE_ID] = {
      //       en: {
      //         value: response.gardenNumber
      //       }
      //     };
      //   }
      //   params.pageVm.loading(false);
      };

      this.getCountyName()
    }
  
    ko.components.register('generate-garden-number', {
      viewModel: viewModel,
      template: template
    });
  
    return viewModel;
  });
  