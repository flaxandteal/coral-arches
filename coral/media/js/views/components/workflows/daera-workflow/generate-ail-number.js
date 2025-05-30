define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'views/components/workflows/workflow-builder-initial-step',
  'viewmodels/card-component',
  'templates/views/components/workflows/generate-ail-number.htm'
], function (_, ko, koMapping, uuid, arches, WorkflowBuilderInitialStep, CardComponentViewModel, template) {
  function viewModel(params) {
    WorkflowBuilderInitialStep.apply(this, [params]);
    this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = 'b37552be-9527-11ea-9213-f875a44e0e11';
    this.ailValue = ko.observable()
    if (ko.isObservable(this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID])) {
      this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID].subscribe((val) => {
        if (val.en.value.startsWith("CON")) {
          this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID]({en: { direction: 'ltr', value: this.ailValue()}})
        }
      })
    }
    
    this.setValue = (value) => {
      this.ailValue(value)
      const localisedValue = {
        en: {
          direction: 'ltr',
          value: value
        }
      };
      if (ko.isObservable(this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID])) {
        this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID](localisedValue);
      } else {
        this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID] = ko.observable();
        this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID](localisedValue);
      }
    };

    this.getValue = () => {
      return (
        ko.unwrap(ko.unwrap(this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID])?.['en']?.['value']) || ''
      );
    };

    this.generateId = async () => {
      params.pageVm.loading(true);

      const data = {
        resourceInstanceId: this.tile().resourceinstance_id
      };

      const response = await $.ajax({
        type: 'POST',
        url: '/generate-ail-number',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });

      const existingId = this.getValue();
      this.setValue(response.ailNumber)
      if (existingId) {
        this.tile()._tileData(koMapping.toJSON(this.tile().data));
      }
      params.pageVm.loading(false);
    };

    this.generateId();
  }

  ko.components.register('generate-ail-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
