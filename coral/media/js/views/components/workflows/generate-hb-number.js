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
    console.log('generate-hb-number: ', this);

    this.WARDS_AND_DISTRICTS_TYPE_NODE_ID = 'de6b6af0-44e3-11ef-9114-0242ac120006';
    this.GENERATED_HB_NODE_ID = '19bd9ac4-44e4-11ef-9114-0242ac120006';

    this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID].subscribe((value) => {
      console.log('ward: ', value);
    }, this);

    this.hasSelectedWard = ko.computed(() => {
      return !!this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID]();
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
      if (ko.isObservable(this.tile.data[this.GENERATED_HB_NODE_ID])) {
        this.tile.data[this.GENERATED_HB_NODE_ID]({
          en: {
            value: response.hbNumber
          }
        });
      } else {
        this.tile.data[this.GENERATED_HB_NODE_ID] = {
          en: {
            value: response.hbNumber
          }
        };
      }
      params.pageVm.loading(false);
    };
  }

  ko.components.register('generate-hb-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
