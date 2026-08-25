import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import template from 'templates/views/components/workflows/generate-hb-number.htm';

function viewModel(params) {
  CardComponentViewModel.apply(this, [params]);
  this.WARDS_AND_DISTRICTS_TYPE_NODE_ID = 'dc49f08f-a4c5-5e23-bfa6-0587c085535d';
  this.GENERATED_HB_NODE_ID = '8009174e-67df-51b7-83ee-17db75100a08';

  if (!ko.isObservable(this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID])) {
    this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID] = ko.observable(
      this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID] ?? null
    );
  }
  this.wardDistrictType = this.tile.data[this.WARDS_AND_DISTRICTS_TYPE_NODE_ID];

  this.wardDistrictUri = (value) => ko.unwrap(ko.unwrap(value)?.[0]?.uri) || '';

  this.wardDistrictPrefLabel = (value) => {
    const labels = koMapping.toJS(ko.unwrap(ko.unwrap(value)?.[0]?.labels)) || [];
    const preferred = labels.find(
      (label) =>
        label.language_id === arches.activeLanguage && label.valuetype_id === 'prefLabel'
    );
    return (preferred || labels[0])?.value || '';
  };

  this.generateOption = ko.observable(true)
  this.configKeys = ko.observable({ placeholder: 0 });
  this.loading = ko.observable(false);
  this.existingHBNumbers = ko.observableArray([
    { text: 'No HB numbers available', id: null },
  ]);
  this.selectedHB = ko.observable();

  this.getHBNumbers = async () => {
    try {
      const response = await $.ajax({
        type: 'GET',
        url: '/generate-hb-number',
        dataType: 'json'
      });
      return response.hbNumbers
    }
    catch (error) {
      console.error('Error fetching HB numbers: ', error)
    }
  }

  this.fetchHBNumbers = async() => {
      const hbNumbers = await this.getHBNumbers();
      this.existingHBNumbers(hbNumbers)
  }

  this.fetchHBNumbers()

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
  this.initialSelected = this.wardDistrictType();
  this.initialSelectedUri = this.wardDistrictUri(this.initialSelected);

  /* Label of the currently selected list item, e.g. "Aghanloo (02/11)". */
  this.wardDistrictTypeValue = ko.pureComputed(() =>
    this.wardDistrictPrefLabel(this.wardDistrictType())
  );

  this.resetChanges = () => {
    this.wardDistrictType(this.initialSelected);
    this.newHbNumber();
  };

  this.wardDistrictType.subscribe((value) => {
    if (!value) {
      this.setValue('');
      return;
    }
    if (this.wardDistrictUri(value) === this.initialSelectedUri) {
      this.setValue(this.generatedNumber());
      return;
    }
    this.setValue('');
  }, this);

  this.newHbNumber = async () => {
    if (!this.wardDistrictType()) return;
    params.pageVm.loading(true);
    const data = {
      resourceInstanceId: this.tile.resourceinstance_id,
      selectedWardDistrictLabel: this.wardDistrictTypeValue(),
      method: 'new'
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

  this.appendHbNumber = async () => {
    if (!this.selectedHB()) return;
    params.pageVm.loading(true);
    const data = {
      resourceInstanceId: this.tile.resourceinstance_id,
      selectedHBNumber: this.selectedHB(),
      method: 'append'
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

  this.setValue(this.getValue());

  this.hasSelected = ko.computed(() => {
    if(this.generateOption()){
      return!!this.wardDistrictType()
    }
    else{
      if(!this.selectedHB()){
        return false;
      }
    }
    return true;
  }, this);

  this.hasChanged = ko.computed(() => {
    if (!this.initialSelectedUri) return false;
    return this.wardDistrictUri(this.wardDistrictType()) !== this.initialSelectedUri;
  }, this);

  this.hasGeneratedNew = ko.computed(() => {
    if (!this.getValue() || !this.wardDistrictTypeValue()) return false;
    const wardDistrictId = this.wardDistrictTypeValue().match(/\((\d+\/\d+)\)/)?.[1]; // Parse "Word (51/90)" = "51/90"
    return !!this.wardDistrictType() && !!wardDistrictId && this.getValue().includes(wardDistrictId);
  }, this);
}

ko.components.register('generate-hb-number', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
