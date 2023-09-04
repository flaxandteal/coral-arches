define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/protection-of-wrecks-card.htm',
], function(_, ko, uuid, arches, AlertViewModel, protectionOfWrecksCardTemplate) {
    function viewModel(params) {
        // this.resValue = ko.observable().extend({ deferred: true });
        this.card = params.card
        this.widget_cache = this.card.widgets()
        this.tile = ko.observable()
        this.loading = params.loading;
        this.graphid = params.graphid;
        this.form = params.form
        console.log(this.form)
        console.log(this.widget_cache)
        self = this
        _.extend(this, params.form);

        params.form.save = function() {
        };
    }
    ko.components.register('protection-of-wrecks-card', {
        viewModel: viewModel,
        template: protectionOfWrecksCardTemplate
    });

    return viewModel;
});