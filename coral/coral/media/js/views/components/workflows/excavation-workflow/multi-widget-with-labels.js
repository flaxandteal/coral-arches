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

        this.widget_group = this.card.widgets()
        this.labelled_group = this.widget_group.filter((widg) => widg.visible())
        this.widget_group.forEach((widg, idx) => {
            widg['selected_label'] = this.labels[idx]
        });
        console.log("widg group", this.widget_group)
        console.log("group with labels", this.labelled_group)

        this.widget_group.forEach((widget) => {
            if (widget.widgetList()[0].name === 'resource-instance-multiselect-widget') {
                widget.graphids = `graphids: ['${this.graphid}'],`
            } else {
                widget.graphids = ''
            }
            widget.htm_params = `{
                card: ko.unwrap(card),
                // tile: ko.unwrap(tile),
                // provisionalTileViewModel: provisionalTileViewModel,
                // reviewer: reviewer,
                loading: loading,
                visible: widget.visible,
                ${widget.graphids}
                form: $data,
                value: ko.observable(''),
                state: 'form',
                pageVm: $data.pageVm
            }`
            console.log(widget.htm_params)
            console.log(widget.htm_params.slice(1,-1))
        })


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