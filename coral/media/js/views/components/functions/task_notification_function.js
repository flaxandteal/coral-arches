define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'viewmodels/function',
    'bindings/chosen',
    'templates/views/components/functions/task_notification_function.htm',
    "views/components/widgets/domain-select",
    "views/components/widgets/domain-multiselect",
    "views/components/widgets/resource-instance-multiselect"
], function($, _, ko, koMapping, arches, FunctionViewModel, chosen, taskNotificationFunctionTemplate, domainSelect, domainMultiselect, resourceInstanceSelect) {
    const viewModel =  function(params) {
         
        FunctionViewModel.apply(this, arguments);

        this.cards = ko.observableArray();
        this.selectedNodeGroup = ko.observable();
        this.selectedNode = ko.observable(params.config.nodeId);
        this.nodes = ko.observableArray();
        this.loading = ko.observable(false);
        this.configKeys = ko.observable({ placeholder: 0 });
        this.groups = ko.observableArray();

        this.buildCardOptions = function() {
            let id = 0;
            this.graph.cards.forEach(function(card){
                cardOption = {
                    id: id,
                    nodegroupId: card.nodegroup_id,
                    text: card.name
                }
                this.cards.push(cardOption);
                id++;
            }, this);
        }

        this.buildCardOptions();

        console.log("graph", this.graph)

        this.selectedNodeGroup.subscribe(function() {
            let selectedCard = this.cards().find((card) => card.id === Number(this.selectedNodeGroup()));
            let id = 0;
            this.graph.nodes.forEach(function(node){
                if (node.nodegroup_id === selectedCard.nodegroupId) {
                    cardOption = {
                        nodeId: node.nodeid,
                        id: id,
                        text: node.name
                    }
                    this.nodes.push(cardOption);
                    id++;
                }
            }, this);
            params.config.nodeGroupId = selectedCard.nodegroupId;
            params.config.triggering_nodegroup.push(selectedCard.nodegroupId);
        },this) 

        this.selectedNode.subscribe(function() {
            let selectedNode = this.nodes().find((node) => node.id === Number(this.selectedNode()));
            this.nodeId(selectedNode.nodeId);
            params.config.nodeId = selectedNode.nodeId;
        },this)
    }
        
    return ko.components.register('views/components/functions/task_notification_function', {
        viewModel: viewModel,
        template: taskNotificationFunctionTemplate,
    });
});
