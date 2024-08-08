define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'templates/views/components/workflows/generate-smr-number.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, template) {
  function viewModel(params) {
    CardComponentViewModel.apply(this, [params]);
    console.log('generate-smr-number: ', this);

    this.smrNumber = ko.observable('');

    this.NISMR_NUMBERING_TYPE_NODE_ID = '86c19e92-3ea7-11ef-818b-0242ac140006';
    this.GENERATED_SMR_NODE_ID = 'b46b5bba-3ec2-11ef-bb61-0242ac140006';

    this.hasSelectedNismr = ko.computed(() => {
      return !!this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]();
    }, this);

    this.generateSmrNumber = async () => {
      if (!this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]()) return;
      params.pageVm.loading(true);
      const data = {
        resourceInstanceId: this.tile.resourceinstance_id,
        selectedNismrId: this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]()
      };
      const response = await $.ajax({
        type: 'POST',
        url: '/generate-smr-number',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      if (ko.isObservable(this.tile.data[this.GENERATED_SMR_NODE_ID])) {
        this.tile.data[this.GENERATED_SMR_NODE_ID]({
          en: {
            direction: 'ltr',
            value: response.smrNumber
          }
        });
      } else {
        this.tile.data[this.GENERATED_SMR_NODE_ID] = {
          en: {
            direction: 'ltr',
            value: response.smrNumber
          }
        };
      }
      params.pageVm.loading(false);
    };
  }

  ko.components.register('generate-smr-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
