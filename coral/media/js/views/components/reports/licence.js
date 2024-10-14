define([
  'jquery',
  'underscore',
  'knockout',
  'arches',
  'utils/resource',
  'utils/report',
  'templates/views/components/reports/licence.htm',
  'views/components/reports/scenes/name',
  'views/components/reports/scenes/json'
], function($, _, ko, arches, resourceUtils, reportUtils, historicLandscapeCharacterizationReportTemplate) {
  return ko.components.register('licence-report', {
      viewModel: function(params) {
          var self = this;
          params.configKeys = ['tabs', 'activeTabIndex'];
          this.configForm = params.configForm || false;
          this.configType = params.configType || 'header';
          this.report = params.report;

          Object.assign(self, reportUtils);
          self.sections = [
              {id: 'all', title: 'Full Report'},
          ];
          self.reportMetadata = ko.observable(params.report?.report_json);
          self.resource = ko.observable(self.reportMetadata()?.resource);
          self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
          self.activeSection = ko.observable('all');
          self.historicLandscapeClassificationPhase = ko.observableArray();
          self.print = ko.observable(window.location.href.indexOf("?print") > -1)

          self.fullReportConfig = {
              id: 'historic-landscape-characterization',
              label: 'Historic Landscape Characterization',
              ignoreNodes: []
          }
      },
      template: historicLandscapeCharacterizationReportTemplate
  });
});
