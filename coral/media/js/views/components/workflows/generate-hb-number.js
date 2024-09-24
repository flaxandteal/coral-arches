define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'templates/views/components/workflows/generate-hb-number.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);
    this.WARDS_AND_DISTRICTS_TYPE_NODE_ID = 'de6b6af0-44e3-11ef-9114-0242ac120006';
    this.GENERATED_HB_NODE_ID = '19bd9ac4-44e4-11ef-9114-0242ac120006';

    this.setValue = (value) => {
      const localisedValue = {
        en: {
          direction: 'ltr',
          value: value
        }
      };
      if (ko.isObservable(this.tile.data[this.GENERATED_HB_NODE_ID])) {
        this.tile.data[this.GENERATED_HB_NODE_ID](localisedValue);
      } else {
        this.tile.data[this.GENERATED_HB_NODE_ID] = ko.observable();
        this.tile.data[this.GENERATED_HB_NODE_ID](localisedValue);
      }
    };

    this.getValue = () => {
      return (
        ko.unwrap(ko.unwrap(this.tile.data[this.GENERATED_HB_NODE_ID])?.['en']?.['value']) || ''
      );
    };

    this.generatedNumber = ko.observable(this.getValue());
    this.wardDistrictTypeValue = ko.observable();
    this.initialSelected = null;

    this.resetChanges = () => {
      this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID](this.initialSelected);
      this.generateHbNumber();
    };

    this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID].subscribe(async (value) => {
      if (!value) {
        this.setValue('');
        return;
      }
      if (value === this.initialSelected) {
        this.setValue(this.generatedNumber());
        return;
      }
      if (value !== this.initialSelected) {
        this.setValue('');
      }
      const response = await $.ajax({
        type: 'GET',
        url: arches.urls.concept_value + `?valueid=${value}`,
        dataType: 'json',
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      this.wardDistrictTypeValue(response.value);
    }, this);

    this.generateHbNumber = async () => {
      if (!this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]()) return;
      params.pageVm.loading(true);
      const data = {
        resourceInstanceId: this.tile.resourceinstance_id,
        selectedWardDistrictId: this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]()
      };
      const response = await $.ajax({
        type: 'POST',
        url: '/generate-hb-number',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      this.setValue(response.hbNumber);
      params.pageVm.loading(false);
    };

    this.initialSelected = this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]();
    this.setValue(this.getValue());

    this.hasSelected = ko.computed(() => {
      return !!this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]();
    }, this);

    this.hasChanged = ko.computed(() => {
      if (!this.initialSelected) return false;
      return this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]() !== this.initialSelected;
    });

    this.hasGeneratedNew = ko.computed(() => {
      if (!this.getValue() || !this.wardDistrictTypeValue()) return false;
      const wardDistrictId = this.wardDistrictTypeValue().match(/\((\d+\/\d+)\)/)?.[1]; // Parse "Word (51/90)" = "51/90"
      return (
        this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]() &&
        this.getValue().includes(wardDistrictId)
      );
    }, this);
  }

  ko.components.register('generate-hb-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
