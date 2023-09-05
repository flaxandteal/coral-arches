define([
    'underscore',
    'knockout',
    'uuid',
    'arches',
    'viewmodels/alert',
    'templates/views/components/workflows/excavation-workflow/single-widget-with-label.htm',
], function(_, ko, uuid, arches, AlertViewModel, singleWidgetWithLabelTemplate) {
    function viewModel(params) {
        // this.resValue = ko.observable().extend({ deferred: true });
        this.card = params.card
        this.tile = ko.observable()
        this.loading = params.loading;
        this.graphid = params.graphid;
        this.label = params.label
        this.widget_type = params.widget_type ? params.widget_type : 'text-widget'
        
        _.extend(this, params.form);

        params.form.save = function() {
        };
    }
    ko.components.register('single-widget-with-label', {
        viewModel: viewModel,
        template: singleWidgetWithLabelTemplate
    });

    return viewModel;
});