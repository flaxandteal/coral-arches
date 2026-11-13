import _ from 'underscore';
import ko from 'knockout';
import renderNodesTemplate from 'templates/views/components/workflows/render-nodes.htm';

function viewModel(params) {
  this.resourceNodes = params.resourceNodes;
}

export default ko.components.register('render-nodes', {
    viewModel: viewModel,
    template: renderNodesTemplate
  });
