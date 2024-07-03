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
    CardComponentViewModel.apply(this, [params]);

    this.ASSESSMENT_DONE_BY = '3b267ffe-dbd1-11ee-b0db-0242ac120006';
    this.LOCAL_AUTH_NOTE_DATE = 'cffa2fc8-3797-11ef-a167-0242ac150006';
    this.DIRECTOR_SIGN_OFF_DATE = '59935456-379a-11ef-9263-0242ac150006';
    this.OWNER_NOTIFIED_DATE = 'a20d4124-3795-11ef-9263-0242ac150006';
    this.APPROVED_DATE = '0cd0998c-dbd6-11ee-b0db-0242ac120006';
    this.STATUATORY_CONSULT_NOTE_DATE = 'd70da550-3798-11ef-a167-0242ac150006';
    this.APPROVED_BY = 'ad22dad6-dbd0-11ee-b0db-0242ac120006';
    this.ASSESSMENT_DATE = 'af5fd406-dbd1-11ee-b0db-0242ac120006';

    this.hasAllFields = ko.computed(() => {
      return (
        this.tile.data[this.ASSESSMENT_DONE_BY]() &&
        this.tile.data[this.LOCAL_AUTH_NOTE_DATE]() &&
        this.tile.data[this.DIRECTOR_SIGN_OFF_DATE]() &&
        this.tile.data[this.OWNER_NOTIFIED_DATE]() &&
        this.tile.data[this.APPROVED_DATE]() &&
        this.tile.data[this.STATUATORY_CONSULT_NOTE_DATE]() &&
        this.tile.data[this.APPROVED_BY]() &&
        this.tile.data[this.ASSESSMENT_DATE]()
      );
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
