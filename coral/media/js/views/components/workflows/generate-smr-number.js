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
    this.NISMR_NUMBERING_TYPE_NODE_ID = '86c19e92-3ea7-11ef-818b-0242ac140006';
    this.GENERATED_SMR_NODE_ID = 'b46b5bba-3ec2-11ef-bb61-0242ac140006';

    this.setGeneratedSmrValue = (value) => {
      const localisedValue = {
        en: {
          direction: 'ltr',
          value: value
        }
      };
      if (ko.isObservable(this.tile.data[this.GENERATED_SMR_NODE_ID])) {
        this.tile.data[this.GENERATED_SMR_NODE_ID](localisedValue);
      } else {
        this.tile.data[this.GENERATED_SMR_NODE_ID] = ko.observable();
        this.tile.data[this.GENERATED_SMR_NODE_ID](localisedValue);
      }
    };

    this.getValue = () => {
      return (
        ko.unwrap(ko.unwrap(this.tile.data[this.GENERATED_SMR_NODE_ID])?.['en']?.['value']) || ''
      );
    };

    this.smrNumber = ko.observable(this.getValue());
    this.nismrTypeValue = ko.observable();
    this.initialSelectedNismr = null;

    this.resetNismrType = () => {
      this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID](this.initialSelectedNismr);
      this.generateSmrNumber();
    };

    this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID].subscribe(async (value) => {
      if (!value) {
        this.setGeneratedSmrValue('');
        return;
      }
      if (value === this.initialSelectedNismr) {
        this.setGeneratedSmrValue(this.smrNumber());
        return;
      }
      if (value !== this.initialSelectedNismr) {
        this.setGeneratedSmrValue('');
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
      this.nismrTypeValue(response.value);
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
      this.setGeneratedSmrValue(response.smrNumber);
      params.pageVm.loading(false);
    };

    this.initialSelectedNismr = this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]();
    this.setGeneratedSmrValue(this.getValue());

    this.hasSelectedNismr = ko.computed(() => {
      return !!this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]();
    }, this);

    this.hasChangedNismrType = ko.computed(() => {
      if (!this.initialSelectedNismr) return false;
      return this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]() !== this.initialSelectedNismr;
    });

    this.hasGeneratedNew = ko.computed(() => {
      if (!this.getValue() || !this.nismrTypeValue()) return false;
      return (
        this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID]() &&
        this.getValue().startsWith(this.nismrTypeValue())
      );
    }, this);
  }

  ko.components.register('generate-smr-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
