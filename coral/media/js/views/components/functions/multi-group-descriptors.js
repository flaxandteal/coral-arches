define([
    'jquery',
    'underscore',
    'knockout',
    'knockout-mapping',
    'arches',
    'viewmodels/function',
    'bindings/chosen',
    'templates/views/components/functions/multi-group-descriptors.htm'
], function($, _, ko, koMapping, arches, FunctionViewModel, chosen, multiGroupDescriptorsFunctionTemplate) {
    const viewModel =  function(params) {
         
        FunctionViewModel.apply(this, arguments);
        var nodegroups = {};
        this.cards = ko.observableArray();
        this.loading = ko.observable(false);
        this.graph.cards.forEach(function(card){
            this.cards.push(card);
            nodegroups[card.nodegroup_id] = true;
        }, this);

        this.initializeObservables = () => {
            [this.name, this.description, this.map_popup].forEach(descriptor => {
                const templateKeys = Object.keys(descriptor).filter(key => key.startsWith('template_'));
                templateKeys.forEach(key => {
                    if (!ko.isObservable(descriptor[key].string_template)) {
                        descriptor[key].string_template = ko.observable(descriptor[key].string_template || "");
                    }
                });
            });
        };

        this.name = params.config.descriptor_types.name;
        this.description = params.config.descriptor_types.description;
        this.map_popup = params.config.descriptor_types.map_popup;

        // this.initializeObservables();

        console.log("THIS", this.name.template_2.string_template)

        this.currentProperty = ko.observable();
        
        this.selectedNodegroups = ko.observableArray([]);
        this.selectedNodes = ko.observableArray([]);
        this.nodeList = ko.observableArray([]);
        this.stringTemplate = ko.observable("");

        this.isUpdating = false;

        this.updateTemplate = (key) => {
            if (!ko.isObservable(this.currentProperty()[key].string_template)) {
                this.currentProperty()[key].string_template = ko.observable(this.currentProperty()[key].string_template || "");
            }
            
            this.currentProperty()[key].nodes = this.selectedNodes();
            this.currentProperty()[key].string_template(this.stringTemplate());
            this.selectedNodes([]);
            this.selectedNodegroups([]);
            this.stringTemplate("");

            console.log("template updated", this.currentProperty()[key]);
        }

        this.deleteTemplate = (key) => {
            let template = this.currentProperty()[key];
            template.string_template("");
            template.nodes = [];
        }

        this.getChangedValue = (newValue, oldValue, key) => {
            // Find the newest value in an array
            const newLen = newValue?.length || 0;
            const oldLen = oldValue?.length || 0;
            
            if (newLen > oldLen) {
                // Adding - find what's in new but not in old
                const addedValue = newValue.find(item => !oldValue.some(oldItem => ko.unwrap(oldItem[key]) === ko.unwrap(item[key])));
                return { add: true, value: addedValue || newValue[0] };
            } else if (newLen < oldLen) {
                // Removing - find what's in old but not in new
                const removedValue = oldValue.find(item => !newValue.some(newItem => ko.unwrap(newItem[key]) === ko.unwrap(item[key])));
                return { add: false, value: removedValue || oldValue[0] };
            }
            
            return null; // No change detected
        };

        this.selectedNodegroups.subscribe((newValue) => {
            if (this.isUpdating) return
            console.log("NG", this.previousNodegroups)
            const selection = this.getChangedValue(newValue, this.previousNodegroups || [], 'nodegroup_id');
            console.log("selection", selection, newValue)
            if (!selection || !selection.value) {
                return;
            }

            var nodes = _.filter(this.graph.nodes, function(node){
                return ko.unwrap(node.nodegroup_id) === ko.unwrap(selection.value.nodegroup_id) && ko.unwrap(node.datatype) !== 'semantic';
            }, this);
            var nodegroupNodes = [];
            _.each(nodes, function(node){
                nodegroupNodes.push({
                    'name': node.name,
                    'nodegroupName': selection.value.name,
                    'nodegroupId': selection.value.nodegroup_id,
                    'nodeId': node.nodeid,
                    'nodeString': '<' + selection.value.name + ':' + node.name + '>'
                });
            }, this);
            console.log("these nodes added", nodegroupNodes)

            if (selection.add){
                this.nodeList.push(...nodegroupNodes);
            } else {
                _.each(nodegroupNodes, function(node){
                    const index = this.nodeList().findIndex(existingNode => 
                        existingNode.nodeId === node.nodeId
                    );
                    if (index > -1){
                        this.nodeList.splice(index, 1);
                    }
                }, this);

                // remove the associated nodes from nodeList
                const filteredSelectedNodes = this.selectedNodes().filter(node => 
                    node.nodegroupId !== selection.value.nodegroup_id
                );
                this.selectedNodes(filteredSelectedNodes);

                // Remove from currentProperty().nodes
                // const currentNodes = this.currentProperty().nodes() || [];
                // const filteredNodes = currentNodes.filter(node => 
                //     ko.unwrap(node.nodegroupId) !== selection.value.nodegroup_id
                // );
                // this.currentProperty().nodes(filteredNodes);
            }
        });

        this.selectedNodegroups.subscribe((oldValue) => {
            this.previousNodegroups = oldValue;
        }, this, 'beforeChange');

        
        this.selectedNodes.subscribe((nodeValue) => {
            if (this.isUpdating) return;
            const dropdown = this.getChangedValue(nodeValue, this.previousNodes, 'nodeId');
            if (!dropdown) return;
            if (dropdown.add){
                if (this.stringTemplate()){
                    const updatedString = this.stringTemplate().concat(' ', dropdown.value.nodeString);
                    this.stringTemplate(updatedString);
                } else {
                    this.stringTemplate(dropdown.value.nodeString);
                }
                // const currentNodes = this.currentProperty().nodes() || [];
                // this.currentProperty().nodes([...currentNodes, dropdown.value]);
                // console.log(this.currentProperty().nodes());
            } else {
                if(this.stringTemplate()){
                    const updatedString = this.stringTemplate().replace(dropdown.value.nodeString, "").trim();
                    this.stringTemplate(updatedString);
                }
                // const index = this.currentProperty().nodes().findIndex(node => node.nodeId === dropdown.value.nodeId);
                // if (index !== -1) {
                //     const currentNodes = this.currentProperty().nodes() || [];
                //     currentNodes.splice(index, 1);
                //     this.currentProperty().nodes([...currentNodes]);
                // }
            }
        });

        // Get the old array value of the selectedNodes
        this.selectedNodes.subscribe((oldValue) => {
            this.previousNodes = oldValue;
        }, this, 'beforeChange');

        // call for the reindex of the db to update the display names
        this.reindexdb = function(){
            this.loading(true);
            $.ajax({
                type: "POST",
                url: arches.urls.reindex,
                context: this,
                data: JSON.stringify({'graphids': [this.graph.graphid]}),
                error: function() {
                    console.log('error');
                },
                complete: function(){
                    this.loading(false);
                }
            });
        };

        // initialise the inputs by updating the current property
        this.currentProperty(this.name);
    };
    
    return ko.components.register('views/components/functions/multi-group-descriptors', {
        viewModel: viewModel,
        template: multiGroupDescriptorsFunctionTemplate,
    });
});
