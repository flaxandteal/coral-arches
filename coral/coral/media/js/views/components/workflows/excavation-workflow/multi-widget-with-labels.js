define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/multi-widget-with-labels.htm',
], function(_, ko, uuid, arches, AlertViewModel, singleWidgetWithLabelTemplate) {
    function viewModel(params) {
        // this.resValue = ko.observable().extend({ deferred: true });
        this.card = params.card
        this.tile = ko.observable()
        this.loading = params.loading;
        this.graphid = params.graphid;
        this.labels = params.labels
        this.widget_types = params.widget_types ? params.widget_types : 'text-widget'
        console.log(this.card)
        _.extend(this, params.form);

        params.form.save = function() {
        };
    }
    ko.components.register('multi-widget-with-labels', {
        viewModel: viewModel,
        template: singleWidgetWithLabelTemplate
    });

    return viewModel;
});