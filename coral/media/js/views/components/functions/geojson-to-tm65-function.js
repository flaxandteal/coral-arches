define([
  'knockout',
  'knockout-mapping',
  'underscore',
  'views/list',
  'viewmodels/function',
  'bindings/chosen',
  'templates/views/components/functions/geojson-to-irishgridpoint-function.htm'
], function (
  ko,
  koMapping,
  underscore,
  ListView,
  FunctionViewModel,
  chosen,
  geojsonToBngpointFunctionTemplate
) {
  return ko.components.register('views/components/functions/geojson-to-tm65-function', {
    viewModel: function (params) {
      console.log(underscore);
      console.log(params);
      FunctionViewModel.apply(this, arguments);
      var self = this;
      this.nodesGeoJSON = ko.observableArray();
      this.nodesBNG = ko.observableArray();
      this.geojson_input_node = params.config.geojson_input_node;
      this.tm65_output_node = params.config.tm65_output_node;
      this.triggering_nodegroups = params.config.triggering_nodegroups;
      console.log('declaring underscore');
      const _ = underscore._;

      // Subscription.
      // Single node subscription. (They may want point/line/polygon in which case we'll need two more.)
      this.geojson_input_node.subscribe(function (ng) {
        _.each(self.nodesGeoJSON(), function (node) {
          console.log('input NODE', node);
          if (node.datatype !== 'semantic') {
            console.log('geojson_input_nodegroup', self.geojson_input_nodegroup);
            if (ng === node.nodeid) {
              self.triggering_nodegroups.push(node.nodegroup_id);
              params.config.geojson_input_nodegroup = node.nodegroup_id;
              console.log('geojson_input_nodegroup', self.geojson_input_nodegroup);
            }
          }
        });
      });

      this.tm65_output_node.subscribe(function (o_n) {
        console.log('BNG node id:', o_n);
        _.each(self.nodesBNG(), function (node) {
          console.log('OUTPUT NODE', node);
          if (node.datatype !== 'semantic') {
            console.log('no semantics');
            if (o_n === node.nodeid) {
              console.log('node id?', node.nodeid);
              params.config.tm65_output_nodegroup = node.nodegroup_id;
              console.log('tm65_output_nodegroup', self.tm65_output_nodegroup);
            }
          }
        });
      });

      this.graph.nodes.forEach(function (node) {
        // console.log('GRAPH NODE', node);
        if (node.datatype != 'semantic') {
          if (node.datatype === 'geojson-feature-collection') {
            this.nodesGeoJSON.push(node);
          } else if (node.datatype === 'tm65centrepoint') {
            this.nodesBNG.push(node);
          }
        }
      }, this);

      window.setTimeout(function () {
        $('select[data-bind^=chosen]').trigger('chosen:updated');
      }, 300);
    },
    template: geojsonToBngpointFunctionTemplate
  });
});
