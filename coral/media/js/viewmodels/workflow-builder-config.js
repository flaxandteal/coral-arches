define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-config.htm',
  'bindings/color-picker'
], function ($, _, ko, koMapping, arches, template) {
  const WorkflowBuilderConfig = function (params) {
    _.extend(this, params);

    this.workflowName = params?.workflowName || ko.observable('');
    this.showWorkflowOnSidebar = params?.showWorkflowOnSidebar || ko.observable(false);
    this.workflowSlug = params?.workflowSlug || '';
    this.autoGenerateSlug = ko.observable(true);

    this.showWorkflowOnInitWorkflow = params?.showWorkflowOnInitWorkflow || ko.observable(false);
    this.initWorkflowName = params?.initWorkflowName || ko.observable('');
    this.initDescription = params?.initDescription || ko.observable('');

    this.backgroundColour = ko.observable('#289c87');
    this.circleColour = ko.observable('#32a893');

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
