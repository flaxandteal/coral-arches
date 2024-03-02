define([
  'jquery',
  'underscore',
  'knockout',
  'knockout-mapping',
  'arches',
  'templates/views/viewmodels/workflow-builder-config.htm',
  'bindings/color-picker',
  'views/components/icon-selector'
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

    this.backgroundColour = params?.backgroundColour || ko.observable('#289c87');
    this.circleColour = params?.circleColour || ko.observable('#32a893');

    this.initIcon = params?.initIcon || ko.observable('');
    this.iconData = ko.observableArray();
    this.iconFilter = ko.observable('');

    this.iconList = ko.computed(() => {
      return _.filter(this.iconData(), (icon) => {
        return icon.name.indexOf(this.iconFilter()) >= 0;
      });
    });

    this.getIconData = async () => {
      const data = await $.getJSON(arches.urls.icons);
      console.log('data: ', data);
      this.iconData(data.icons);
      return data;
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
      this.getIconData();
    };

    this.init();
  };

  ko.components.register('workflow-builder-config', {
    template: template,
    viewModel: WorkflowBuilderConfig
  });

  return WorkflowBuilderConfig;
});
