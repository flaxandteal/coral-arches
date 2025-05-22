define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'templates/views/components/reports/heritage-asset-merge.htm',
    'views/components/reports/scenes/all',
], function($, _, ko, arches, resourceUtils, reportUtils, heritageAssetMergeReportTemplate) {
    return ko.components.register('heritage-asset-merge', {
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

            self.issueNodeGroups = ['d3ff3fe6-d62b-11ee-9454-0242ac180006'];

            self.nameDataConfig = {
                name: 'heritage asset Merge Tracker',
                nameChildren: 'asset',
                parent: 'parent asset'
            };

            self.nameCards = {};
            self.descriptionCards = {};
            self.summary = params.summary;
            self.cards = {};

            self.resource = ko.observable(self.resource());

            self.fullReportConfig = {
                id: 'heritage-asset',
                label: 'Heritage Asset',
                ignoreNodes: []
            };

            if(params.report.cards){
                const cards = params.report.cards;

                self.cards = self.createCardDictionary(cards);
                
                const baseResourceData = JSON.parse(self.cards?.['Base Resource Data']['params']['tiles'][3]['data']['07cf7760-f197-11ee-9b0c-0242ac170006']['en']['value']);
                const mergeResourceData = JSON.parse(self.cards?.['Merged Resource Data']['params']['tiles'][4]['data']['3d1a1858-f197-11ee-9b0c-0242ac170006']['en']['value']);

                const baseResourceDetails = 'Base Resource Details: ' +  baseResourceData['business_data']['resources'][0]['resourceinstance']['name'] + ' id: ' + baseResourceData['business_data']['resources'][0]['resourceinstance']['resourceinstanceid'];
                const mergeResourceDetails = 'Merged Resource Details: ' +  mergeResourceData['business_data']['resources'][1]['resourceinstance']['name'] + ' id: ' + mergeResourceData['business_data']['resources'][1]['resourceinstance']['resourceinstanceid'];

                self.descriptionCards = {
                    descriptions: self.cards?.['descriptions'],
                    baseResource: self.cards?.['Base Resource Data'],
                    mergeResource: self.cards?.['Merged Resource Data'],
                    baseResourceDetails: baseResourceDetails,
                    mergeResourceDetails: mergeResourceDetails
                };
            }
        },
        template: heritageAssetMergeReportTemplate
    });
});
