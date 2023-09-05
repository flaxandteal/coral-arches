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
        console.log("PARAMA", params)
        console.log(params.form.card())
        this.card = params.card
        this.tile = ko.observable()
        this.loading = params.loading;
        this.graphid = params.graphid;
        this.labels = params.labels
        console.log("CARD", this.card)
        console.log("CARD", this.card.widgets())
        console.log("CARD", this.card.widgets()[0].widgetList()[0].name)
        this.widget_group = this.card.widgets()
        this.labelled_group = this.widget_group.filter((widg) => widg.visible())
        this.widget_group.forEach((widg, idx) => {
            widg['selected_label'] = this.labels[idx]
        });
        console.log("widg group", this.widget_group)
        console.log("group with labels", this.labelled_group)

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