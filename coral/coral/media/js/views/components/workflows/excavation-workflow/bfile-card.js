define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/bfile-card.htm',
], function(_, ko, uuid, arches, AlertViewModel, bFileCardTemplate) {
    function viewModel(params) {
        // this.resValue = ko.observable().extend({ deferred: true });
        this.card = params.card
        this.tile = ko.observable()
        this.loading = params.loading;
        this.graphid = params.graphid;
        
        _.extend(this, params.form);

        params.form.save = function() {
        };
    }
    ko.components.register('bfile-card', {
        viewModel: viewModel,
        template: bFileCardTemplate
    });

    return viewModel;
});