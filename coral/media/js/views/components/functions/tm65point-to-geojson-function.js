define([
  'knockout',
  'knockout-mapping',
  'underscore',
  'views/list',
  'viewmodels/function',
  'bindings/chosen',
  'templates/views/components/functions/irishgridpoint-to-geojson-function.htm'
], function (
  ko,
  koMapping,
  underscore,
  ListView,
  FunctionViewModel,
  chosen,
  tm65pointToGeojsonFunctionTemplate
) {
  return ko.components.register('views/components/functions/tm65point-to-geojson-function', {
    viewModel: function (params) {
      FunctionViewModel.apply(this, arguments);
      console.log('Running a sample function');
      var self = this;
      this.nodesTM65 = ko.observableArray();
      this.nodesGeoJSON = ko.observableArray();
      this.tm65_node = params.config.tm65_node;
      this.geojson_node = params.config.geojson_node;
      this.triggering_nodegroups = params.config.triggering_nodegroups;
      const _ = underscore._;

      this.tm65_node.subscribe(function (ng) {
        _.each(self.nodesTM65(), function (node) {
          if (node.datatype !== 'semantic') {
            if (ng === node.nodeid) {
              self.triggering_nodegroups.push(node.nodegroup_id);
              params.config.tm65_nodegroup = node.nodegroup_id;
              console.log('tm65_nodegroup', self.tm65_nodegroup);
            }
          }
        });
      });

      this.geojson_node.subscribe(function (o_n) {
        console.log('GeoJSON node id:', o_n);
        _.each(self.nodesGeoJSON(), function (node) {
          if (node.datatype !== 'semantic') {
            if (o_n === node.nodeid) {
              params.config.geojson_nodegroup = node.nodegroup_id;
              console.log('geojson_nodegroup', self.geojson_nodegroup);
            }
          }
        });
      });

      this.graph.nodes.forEach(function (node) {
        if (node.datatype != 'semantic') {
          if (node.datatype === 'geojson-feature-collection') {
            this.nodesGeoJSON.push(node);
          } else if (node.datatype === 'tm65centrepoint') {
            this.nodesTM65.push(node);
          }
        }
      }, this);

      window.setTimeout(function () {
        $('select[data-bind^=chosen]').trigger('chosen:updated');
      }, 300);
    },
    template: tm65pointToGeojsonFunctionTemplate
  });
});
