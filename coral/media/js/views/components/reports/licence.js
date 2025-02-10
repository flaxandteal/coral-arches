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
                {id: 'name', title: 'Names and Identifiers'},
                {id: 'resources', title: 'Associated Resources'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('all');
            self.historicLandscapeClassificationPhase = ko.observableArray();
            self.print = ko.observable(window.location.href.indexOf("?print") > -1);

            self.nameDataConfig = {
                name: 'licence',
                parent: 'parent_licence',
                recordStatus: 'record_status_assignment'
            };

            self.resourcesDataConfig = {
                archive: 'associated archive objects',
                files: 'digital files',
                assets: 'associated monuments and areas',
                actors: undefined
            };

            self.cards = {};
            self.nameCards = {};

            if(params.report.cards){
                const cards = params.report.cards;

                self.cards = self.createCardDictionary(cards);

                self.nameCards = {
                    name: self.cards?.['licence names'],
                    // externalCrossReferences: self.cards?.['external cross references'],
                    // systemReferenceNumbers: self.cards?.['system reference numbers'],
                    // parent: self.cards?.['parent activities'],
                    // recordStatus: self.cards?.['record status']
                };

                self.resourcesCards = {
                    consultations: self.cards?.['associated consultations'],
                    activities: self.cards?.['associated activities'],
                    archive: self.cards?.['associated archive objects'],
                    assets: self.cards?.['associated monuments and areas'],
                    files: self.cards?.['associated digital files'],
                };
            }
            self.fullReportConfig = {
                id: 'historic-landscape-characterization',
                label: 'Historic Landscape Characterization',
                ignoreNodes: []
            };
        },
        template: historicLandscapeCharacterizationReportTemplate
    });
});
