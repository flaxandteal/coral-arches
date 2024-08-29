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

    this.initialSelected = this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]();
    this.generatedNumber = ko.observable();
    this.wardDistrictTypeValue = ko.observable();

    this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID].subscribe(async (value) => {
      if (!value) {
        this.setValue('');
        return;
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

    this.hasSelected = ko.computed(() => {
      return !!this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]();
    }, this);

    this.hasChanged = ko.computed(() => {
      if (!this.initialSelected) return false;
      return this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]() !== this.initialSelected;
    });

    this.hasGeneratedNew = ko.computed(() => {
      if (!this.generatedNumber() || !this.wardDistrictTypeValue()) return false;
      const wardDistrictId = this.wardDistrictTypeValue().match(/\((\d+\/\d+)\)/)?.[1]; // Parse "Word (51/90)" = "51/90"
      return (
        this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]() &&
        this.generatedNumber().includes(wardDistrictId)
      );
    }, this);

    this.generategeneratedNumber = async () => {
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
      this.generatedNumber(response.generatedNumber);
      this.setValue(response.generatedNumber);
      params.pageVm.loading(false);
    };

    this.setValue = (value) => {
      const localisedValue = {
        en: {
          direction: 'ltr',
          value: value
        }
      };
      if (ko.isObservable(this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID])) {
        this.tile.data[this.GENERATED_HB_NODE_ID](localisedValue);
      } else {
        this.tile.data[this.GENERATED_HB_NODE_ID] = localisedValue;
      }
      params.pageVm.loading(false);
    };

    this.resetChanges = () => {
      this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID](this.initialSelected);
      this.generategeneratedNumber();
    };
  }

  ko.components.register('generate-hb-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
