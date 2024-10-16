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
      FunctionViewModel.apply(this, arguments);
      var self = this;
      this.nodesGeoJSON = ko.observableArray();
      this.nodesBNG = ko.observableArray();
      this.geojson_input_node = params.config.geojson_input_node;
      this.tm65_output_node = params.config.tm65_output_node;
      this.triggering_nodegroups = params.config.triggering_nodegroups;
      const _ = underscore._;

      // Subscription.
      // Single node subscription. (They may want point/line/polygon in which case we'll need two more.)
      this.geojson_input_node.subscribe(function (ng) {
        _.each(self.nodesGeoJSON(), function (node) {
          if (node.datatype !== 'semantic') {
            if (ng === node.nodeid) {
              self.triggering_nodegroups.push(node.nodegroup_id);
              params.config.geojson_input_nodegroup = node.nodegroup_id;
            }
          }
        });
      });

      this.tm65_output_node.subscribe(function (o_n) {
        _.each(self.nodesBNG(), function (node) {
          if (node.datatype !== 'semantic') {
            if (o_n === node.nodeid) {
              params.config.tm65_output_nodegroup = node.nodegroup_id;
            }
          }
        });
      });

      this.graph.nodes.forEach(function (node) {
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
