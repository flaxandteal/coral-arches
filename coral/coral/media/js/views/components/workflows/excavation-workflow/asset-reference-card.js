define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/asset-reference-card.htm',
], function(_, ko, uuid, arches, AlertViewModel, excavationAssetStepTemplate) {
    function viewModel(params) {
        this.resValue = ko.observable().extend({ deferred: true });
        this.loading = params.loading;
        this.graphid = params.graphid;

        params.form.save = function() {
        };
    }
    ko.components.register('asset-reference-card', {
        viewModel: viewModel,
        template: excavationAssetStepTemplate
    });

    return viewModel;
});