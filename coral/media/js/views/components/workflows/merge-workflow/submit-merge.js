define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/merge-workflow/submit-merge.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
    console.log('submit-merge params: ', params);

    this.submitMerge = async () => {
      console.log('submitting merge');

      const data = {
        baseResourceId: params.baseResourceId,
        mergeResourceId: params.mergeResourceId
      };

      const response = await $.ajax({
        type: 'POST',
        url: '/merge-resources',
        dataType: 'json',
        data: JSON.stringify(data),
        context: this,
        error: (response, status, error) => {
          console.log(response, status, error);
        }
      });

      console.log('response: ', response);
    };
  }

  ko.components.register('submit-merge', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
