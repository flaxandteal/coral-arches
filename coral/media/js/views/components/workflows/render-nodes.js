define([
  'underscore',
  'knockout',
  'templates/views/components/workflows/render-nodes.htm'
], function (_, ko, renderNodesTemplate) {
  function viewModel(params) {
    this.resourceNodes = params.resourceNodes;
  }

  return ko.components.register('render-nodes', {
    viewModel: viewModel,
    template: renderNodesTemplate
  });
});
