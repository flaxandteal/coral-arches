define([
  'jquery',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/components/plugins/workflow-builder.htm',
  'plugins/knockout-select2'
], function ($, ko, koMapping, arches, pageTemplate) {
  const pageViewModel = function (params) {
    this.selectedResource = ko.observable();

    this.selectedResource.subscribe((value) => {
      console.log('selectedResource: ', value);
    });

    this.resources = ko.observable();
    this.workflows = ko.observable();

    this.openWorkflowBuilderWithGraph = (graphId) => {
      console.log('graphId: ', graphId);
      const url = `workflow-builder-editor?graph-id=${graphId}`;
      window.location.href = arches.urls.plugin(url);
    };

    this.openWorkflowBuilderWithWorkflow = (slug) => {
      console.log('workflow-slug: ', slug);
      const url = `workflow-builder-editor?workflow-slug=${slug}`;
      window.location.href = arches.urls.plugin(url);
    };

    this.init = async () => {
      const resources = await (
        await window.fetch(arches.urls.root + `workflow-builder/resources`)
      ).json();
      const workflows = await (
        await window.fetch(arches.urls.root + `workflow-builder/plugins`)
      ).json();
      console.log('resources: ', resources);
      console.log('workflows: ', workflows);
      this.resources(resources.resources);
      this.workflows(workflows.workflows);
    };

    this.init();
  };

  return ko.components.register('workflow-builder', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
});
