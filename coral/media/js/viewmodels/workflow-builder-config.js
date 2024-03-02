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

    this.workflowName = ko.observable(params?.workflowName || 'Basic');
    this.showOnSidebar = ko.observable(params?.showOnSidebar || false);

    this.workflowSlug = ko.observable(params?.workflowSlug || 'basic-workflow');
    this.autoGenerateSlug = ko.observable(true);

    this.showOnInitWorkflow = ko.observable(params?.initWorkflow?.show || false);
    this.initWorkflowName = ko.observable(params?.initWorkflow?.name || this.workflowName());
    this.initDescription = ko.observable(params?.initWorkflow?.desc || '');
    this.initIcon = ko.observable(params?.initWorkflow?.icon || 'fa fa-file-text');
    this.initBackgroundColour = ko.observable(params?.initWorkflow?.bgColor || '#617099');
    this.initCircleColour = ko.observable(params?.initWorkflow?.circleColor || '#4a5e94');

    this.iconData = ko.observableArray(params?.iconData || []);
    this.iconFilter = ko.observable('');

    this.iconList = ko.computed(() => {
      return _.filter(this.iconData(), (icon) => {
        return icon.name.indexOf(this.iconFilter()) >= 0;
      });
    });

    this.workflowName.subscribe(() => {
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

    this.getInitWorkflowConfig = () => {
      return {
        show: this.showOnInitWorkflow(),
        name: this.initWorkflowName(),
        desc: this.initDescription(),
        icon: this.initIcon(),
        bgColor: this.initBackgroundColour(),
        circleColor: this.initCircleColour()
      };
    };

    this.init = () => {
      this.autoGenerateSlug(this.isAutoGenerateSlugActive());
    };

    this.init();
  };

  ko.components.register('workflow-builder-config', {
    template: template
  });

  return WorkflowBuilderConfig;
});
