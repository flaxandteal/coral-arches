import $ from 'jquery';
import ko from 'knockout';
import FunctionViewModel from 'viewmodels/function-view-model';
import chosen from 'bindings/chosen';
import sampleFunctionTemplate from 'templates/views/components/functions/sample-function.htm';

export default ko.components.register('views/components/functions/sample-function', {
        viewModel: function(params) {
             
            FunctionViewModel.apply(this, arguments);
            var nodegroups = {};
            this.triggeringNodegroups = params.config.triggering_nodegroups;
            this.cards = ko.observableArray();
            this.graph.cards.forEach(function(card){
                this.cards.push(card);
                nodegroups[card.nodegroup_id] = true;
            }, this);

            window.setTimeout(function(){$("select[data-bind^=chosen]").trigger("chosen:updated");}, 300);
        },
        template: sampleFunctionTemplate
    });
