import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import template from 'templates/views/components/workflows/generate-smr-number.htm';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);
  this.NISMR_NUMBERING_TYPE_NODE_ID = 'a7742f3d-197d-5fcb-9fde-4179a7e28d5b';
  this.GENERATED_SMR_NODE_ID = '039aaf6d-59d4-57a9-bf87-245ec8913130';

  if (!ko.isObservable(this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID])) {
    this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID] = ko.observable(
      this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID] ?? null
    );
  }
  this.nismrType = this.tile.data[this.NISMR_NUMBERING_TYPE_NODE_ID];

  this.nismrUri = (value) => ko.unwrap(ko.unwrap(value)?.[0]?.uri) || '';

  this.nismrPrefLabel = (value) => {
    const labels = koMapping.toJS(ko.unwrap(ko.unwrap(value)?.[0]?.labels)) || [];
    const preferred = labels.find(
      (label) =>
        label.language_id === arches.activeLanguage && label.valuetype_id === 'prefLabel'
    );
    return (preferred || labels[0])?.value || '';
  };

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
  this.initialSelectedNismr = this.nismrType();
  this.initialSelectedNismrUri = this.nismrUri(this.initialSelectedNismr);

  /* Label of the currently selected list item, e.g. the map sheet "J10". */
  this.nismrTypeValue = ko.pureComputed(() => this.nismrPrefLabel(this.nismrType()));

  this.resetNismrType = () => {
    this.nismrType(this.initialSelectedNismr);
    this.generateSmrNumber();
  };

  this.nismrType.subscribe((value) => {
    if (!value) {
      this.setGeneratedSmrValue('');
      return;
    }
    if (this.nismrUri(value) === this.initialSelectedNismrUri) {
      this.setGeneratedSmrValue(this.smrNumber());
      return;
    }
    this.setGeneratedSmrValue('');
  }, this);

  this.generateSmrNumber = async () => {
    if (!this.nismrType()) return;
    params.pageVm.loading(true);
    const data = {
      resourceInstanceId: this.tile.resourceinstance_id,
      selectedNismrLabel: this.nismrTypeValue()
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

  this.setGeneratedSmrValue(this.getValue());

  this.hasSelectedNismr = ko.computed(() => {
    return !!this.nismrType();
  }, this);

  this.hasChangedNismrType = ko.computed(() => {
    if (!this.initialSelectedNismrUri) return false;
    return this.nismrUri(this.nismrType()) !== this.initialSelectedNismrUri;
  }, this);

  this.hasGeneratedNew = ko.computed(() => {
    if (!this.getValue() || !this.nismrTypeValue()) return false;
    return !!this.nismrType() && this.getValue().startsWith(this.nismrTypeValue());
  }, this);
}

ko.components.register('generate-smr-number', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
