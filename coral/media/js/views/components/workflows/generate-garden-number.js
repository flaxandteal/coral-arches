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

    this.ADDRESS_NODEGROUP = '87d39b25-f44f-11eb-95e5-a87eeabdefba';
    this.COUNTY_NODE_ID = '8bfe714e-3ec2-11ef-9023-0242ac140007';
    this.GENERATED_GARDEN_NODE_ID = 'bd85cca2-49a4-11ef-94a5-0242ac120007';

    this.setValue = (value) => {
      const localisedValue = {
        en: {
          direction: 'ltr',
          value: value
        }
      };
      if (ko.isObservable(this.tile.data[this.GENERATED_GARDEN_NODE_ID])) {
        this.tile.data[this.GENERATED_GARDEN_NODE_ID](localisedValue);
      } else {
        this.tile.data[this.GENERATED_GARDEN_NODE_ID] = ko.observable();
        this.tile.data[this.GENERATED_GARDEN_NODE_ID](localisedValue);
      }
    };

    this.getValue = () => {
      return (
        ko.unwrap(ko.unwrap(this.tile.data[this.GENERATED_GARDEN_NODE_ID])?.['en']?.['value']) || ''
      );
    };

    this.initialNumber = ko.observable(this.getValue());
    this.selectedCounty = ko.observable();
    this.errorMessage = 'No county has been selected';

    this.fetchCountyTile = async () => {
      try {
        const response = await window.fetch(
          arches.urls.resource_tiles.replace(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            this.tile.resourceinstance_id
          ) + `?nodeid=${this.ADDRESS_NODEGROUP}`
        );
        const data = await response.json();
        return data.tiles[0];
      } catch (error) {
        console.error(error);
        return null;
      }
    };

    this.getCountyID = async () => {
      const tile = await this.fetchCountyTile();
      if (tile) {
        const countyName = tile.data[this.COUNTY_NODE_ID];
        if (countyName) {
          this.selectedCounty(countyName);
        } else {
          this.selectedCounty(null);

          this.setValue('');
        }
      }
    };

    this.generateGardenNumber = async () => {
      if (!this.selectedCounty) return;

      params.pageVm.loading(true);
      const data = {
        resourceInstanceId: this.tile.resourceinstance_id,
        selectedCountyId: this.selectedCounty()
      };
      const response = await $.ajax({
        type: 'POST',
        url: '/generate-garden-number',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      this.setValue(response.gardenNumber);
      params.pageVm.loading(false);
    };

    this.hasSelectedCounty = ko.computed(() => {
      return !!this.selectedCounty();
    }, this);

    this.hasRemovedCounty = ko.computed(() => {
      console.log('t1 ', this.selectedCounty(), this.initialNumber());
      return !this.selectedCounty() && this.initialNumber();
    }, this);

    this.getCountyID();
  }

  ko.components.register('generate-garden-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
