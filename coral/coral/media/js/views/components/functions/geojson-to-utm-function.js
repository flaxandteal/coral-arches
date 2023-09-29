define(['knockout',
    'knockout-mapping',
    'views/list',
    'viewmodels/function',
    'bindings/chosen',
    'templates/views/components/functions/geojson-to-utm.htm',
], function(ko, koMapping, ListView, FunctionViewModel, chosen, geojsonToUtmFunctionTemplate) {
    return ko.components.register('views/components/functions/geojson-to-utm-function', {
        viewModel: function(params) {
            
            FunctionViewModel.apply(this, arguments);
            var self = this;
            this.nodesGeoJSON = ko.observableArray();
            this.nodesUTM = ko.observableArray();
            this.geojson_input_node = params.config.geojson_input_node;
            this.utm_output_node = params.config.utm_output_node;
            this.triggering_nodegroups = params.config.triggering_nodegroups;

            // Subscription.
            // Single node subscription. (They may want point/line/polygon in which case we'll need two more.)
            this.geojson_input_node.subscribe(function(ng){
                self.nodesGeoJSON().forEach(node => {
                    console.log("node",node)
                    console.log("ng",ng)
                    if (node.datatype !== "semantic"){
                        
                        if (ng === node.nodeid){
                            self.triggering_nodegroups.push(node.nodegroup_id);
                            params.config.geojson_input_nodegroup = node.nodegroup_id;
                            console.log("geojson_input_nodegroup",self.geojson_input_nodegroup);
                        }
                        
                    }
                })
            });

            this.utm_output_node.subscribe(function(o_n){
                console.log('UTM node id:', o_n);
                self.nodesUTM().forEach(node => {
                    if (node.datatype !== "semantic"){
                        
                        if (o_n === node.nodeid){
                            params.config.utm_output_nodegroup = node.nodegroup_id;
                            console.log("utm_output_nodegroup",self.utm_output_nodegroup);
                        }
                    }
                    
                })
                
                
            })


            this.graph.nodes.forEach(function (node) {
                if (node.datatype != 'semantic'){
                    if (node.datatype === "geojson-feature-collection"){
                        this.nodesGeoJSON.push(node);
                    }
                    else if (node.datatype === "string" && node.ontologyclass === "http://www.cidoc-crm.org/cidoc-crm/E94_Space_Primitive") {
                        this.nodesUTM.push(node);
                    }
     
                }
            }, this);


            window.setTimeout(function(){$("select[data-bind^=chosen]").trigger("chosen:updated")}, 300);
        },
        template: geojsonToUtmFunctionTemplate
    });
})
