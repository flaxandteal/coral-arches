define([
  'underscore',
  'knockout',
  'knockout-mapping',
  'uuid',
  'arches',
  'viewmodels/card-component',
  'viewmodels/alert',
  'templates/views/components/workflows/heritage-asset-designation-workflow/start-remap-and-merge.htm'
], function (_, ko, koMapping, uuid, arches, CardComponentViewModel, AlertViewModel, template) {
  function viewModel(params) {
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

    this.applyRevision = async () => {
      const data = {
        targetResourceId: this.tile.resourceinstance_id
      };
      params.pageVm.alert(
        new AlertViewModel(
          'ep-alert-blue',
          `Are you sure?`,
          `This process cannot be undone. Once the apply revision process has started it will begin moving all changes made in this workflow back into the original Heritage Asset. This will result in this revision being deleted and stored as a historical change on a merge tracker.`,
          () => null,
          async () => {
            params.pageVm.loading(true);
            try {
              const response = await $.ajax({
                type: 'POST',
                url: '/remap-revision-to-monument',
                dataType: 'json',
                data: JSON.stringify(data),
                context: this,
                error: (response, status, error) => {
                  console.log(response, status, error);
                }
              });
              window.window.location = arches.urls.plugin('init-workflow');
            } catch (error) {
              console.error(error);
            }
            params.pageVm.loading(false);
          }
        )
      );
    };
  }

  ko.components.register('start-remap-and-merge', {
    viewModel: viewModel,
    template: template
  });

  return viewModel;
});
