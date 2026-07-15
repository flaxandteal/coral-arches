import _ from 'underscore';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import uuid from 'uuid';
import arches from 'arches';
import CardComponentViewModel from 'viewmodels/card-component';
import AlertViewModel from 'viewmodels/alert';
import template from 'templates/views/components/workflows/merge-workflow/submit-merge.htm';

function viewModel(params) {
  console.log('submit-merge params: ', params);

  this.configKeys = ko.observable({ placeholder: 0 });

  this.checkboxOptions = ko.observable([
    {
      text: '',
      id: 'acknowledged'
    }
  ]);

  this.selectedCheckboxOptions = ko.observableArray();

  this.hasAcknowledgedProcess = ko.computed(() => {
    return !!this.selectedCheckboxOptions().includes('acknowledged');
  }, this);

  this.submitMerge = async () => {
    console.log('submitting merge');

    const data = {
      baseResourceId: params.baseResourceId,
      mergeResourceId: params.mergeResourceId,
      mergeTrackerResourceId: params.mergeTrackerResourceId
    };
    params.pageVm.loading(true);
    try {
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
      params.pageVm.alert(
        new AlertViewModel(
          'ep-alert-blue',
          'Merge process has STARTED',
          'You can now safely save and exit the workflow. Be aware that these two resources are in the process of merging which can take up to 5 minutes to complete.',
          null,
          function () {
            window.window.location = arches.urls.plugin('init-workflow');
          }
        )
      );
    } catch (e) {
      params.pageVm.alert(
        new AlertViewModel(
          'ep-alert-red',
          'Resources failed to merge',
          'Please contact an administrator and report the incident.',
          null,
          function () {}
        )
      );
    }
    params.pageVm.loading(false);
  };
}

ko.components.register('submit-merge', {
  viewModel: viewModel,
  template: template
});

export default viewModel;
