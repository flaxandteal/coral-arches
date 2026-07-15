import $ from 'jquery';
import ko from 'knockout';
import koMapping from 'knockout-mapping';
import arches from 'arches';
import pageTemplate from 'templates/views/components/plugins/workflow-builder.htm';

const pageViewModel = function (params) {
  this.selectedResource = ko.observable();

  this.resources = ko.observable();
  this.workflows = ko.observable();

  this.openWorkflowBuilderWithGraph = (graphId) => {
    const url = `workflow-builder-editor?graph-id=${graphId}`;
    window.location.href = arches.urls.plugin(url);
  };

  this.openWorkflowBuilderWithWorkflow = (slug) => {
    const url = `workflow-builder-editor?workflow-id=${slug}`;
    window.location.href = arches.urls.plugin(url);
  };

  this.init = async () => {
    const workflows = await (
      await window.fetch(arches.urls.root + `workflow-builder/plugins`)
    ).json();
    this.workflows(workflows.workflows);
    const resources = await (
      await window.fetch(arches.urls.root + `workflow-builder/resources`)
    ).json();
    this.resources(resources.resources);
  };

  this.init();
};

export default ko.components.register('workflow-builder', {
    viewModel: pageViewModel,
    template: pageTemplate
  });
