import ko from 'knockout';
import koMapping from 'knockout-mapping';
import underscore from 'underscore';
import ListView from 'views/list';
import FunctionViewModel from 'viewmodels/function-view-model';
import chosen from 'bindings/chosen';
import tm65pointToGeojsonFunctionTemplate from 'templates/views/components/functions/irishgridpoint-to-geojson-function.htm';

export default ko.components.register('views/components/functions/tm65point-to-geojson-function', {
    viewModel: function (params) {
      FunctionViewModel.apply(this, arguments);
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
            }
          }
        });
      });

      this.geojson_node.subscribe(function (o_n) {
        _.each(self.nodesGeoJSON(), function (node) {
          if (node.datatype !== 'semantic') {
            if (o_n === node.nodeid) {
              params.config.geojson_nodegroup = node.nodegroup_id;
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
