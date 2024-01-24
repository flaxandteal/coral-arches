define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-config.htm'
], function ($, _, ko, koMapping, arches, template) {
  const WorkflowBuilderConfig = function (params) {
    _.extend(this, params);

    this.workflowName = params?.workflowName || '';
    this.showWorkflowInSidebar = params?.showWorkflowInSidebar || false;
    this.workflowSlug = params?.workflowSlug || '';
    this.autoGenerateSlug = ko.observable(true);

    this.setShowWorkflowInSidebar = (show) => {
      this.showWorkflowInSidebar(show);
    };

    this.setAutoGenerateSlug = (show) => {
      this.autoGenerateSlug(show);
      if (show) {
        this.workflowSlug(this.createSlug());
      }
    };

    this.workflowName.subscribe((value) => {
      if (this.autoGenerateSlug()) {
        this.workflowSlug(this.createSlug());
      }
    });

    this.workflowSlug.subscribe(() => {
      this.autoGenerateSlug(this.isAutoGenerateSlugActive());
    });

    this.isAutoGenerateSlugActive = () => {
      return this.workflowSlug() === this.createSlug();
    };

    this.createSlug = () => {
      return this.workflowName().toLowerCase().split(' ').join('-') + '-workflow';
    };

    this.init = () => {
      this.autoGenerateSlug(this.isAutoGenerateSlugActive());
    };

    this.init();
  };

  ko.components.register('workflow-builder-config', {
    template: template,
    viewModel: WorkflowBuilderConfig
  });

  return WorkflowBuilderConfig;
});