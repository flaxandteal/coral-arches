define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/collecting-information-step.htm',
], function(_, ko, uuid, arches, AlertViewModel, excavationInformationStepTemplate) {
    function viewModel(params) {
        // this.resValue = ko.observable().extend({ deferred: true });
        this.loading = params.loading;
        this.graphid = params.graphid;

        // params.form.save = function() {
        // };
    }
    ko.components.register('collecting-information-step', {
        viewModel: viewModel,
        template: excavationInformationStepTemplate
    });

    return viewModel;
});