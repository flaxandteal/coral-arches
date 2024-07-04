define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'views/components/workflows/workflow-builder-initial-step',
  'templates/views/components/workflows/generate-ha-number.htm'
], function (_, ko, koMapping, uuid, arches, WorkflowBuilderInitialStep, template) {
  function viewModel(params) {
    WorkflowBuilderInitialStep.apply(this, [params]);

    this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID = '325a430a-efe4-11eb-810b-a87eeabdefba';

    this.generateId = async () => {
      params.pageVm.loading(true);
      const data = {
        resourceInstanceId: this.tile().resourceinstance_id
      };
      const response = await $.ajax({
        type: 'POST',
        url: '/generate-ha-number',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });
      if (ko.isObservable(this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID])) {
        this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID]({
          en: {
            value: response.haNumber
          }
        });
      } else {
        this.tile().data[this.SYSTEM_REFERENCE_RESOURCE_ID_NODE_ID] = {
          en: {
            value: response.haNumber
          }
        };
      }
      params.pageVm.loading(false);
    };

    this.generateId();
  }

  ko.components.register('generate-ha-number', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
