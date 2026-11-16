import $ from 'jquery';
import _ from 'underscore';
import ko from 'knockout';
import arches from 'arches';
import resourceUtils from 'utils/resource';
import reportUtils from 'utils/report';
import historicLandscapeCharacterizationReportTemplate from 'templates/views/components/reports/state-care-condition-survey.htm';
import name from 'views/components/reports/scenes/name';
import json from 'views/components/reports/scenes/json';

export default ko.components.register('state-care-condition-survey-report', {
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
              id: 'state-care-condition-survey',
              label: 'State Care Condition Survey',
              ignoreNodes: []
          }
      },
      template: historicLandscapeCharacterizationReportTemplate
  });
