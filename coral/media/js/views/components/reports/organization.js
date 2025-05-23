define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'templates/views/components/reports/organization.htm',
    'views/components/reports/scenes/name',
    'views/components/reports/scenes/contact',
    'views/components/reports/scenes/json'
], function($, _, ko, arches, resourceUtils, reportUtils, organizationReportTemplate) {
    return ko.components.register('organization-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            this.configForm = params.configForm || false;
            this.configType = params.configType || 'header';
            this.report = params.report;
            this.summary = params.summary;

            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names and Classifications'},
                {id: 'description', title: 'Description'},
                {id: 'classifications', title: 'Classifications and Dating'},
                {id: 'location', title: 'Location Data'},
                {id: 'people', title: 'Associated People and Organizations'},
                {id: 'contact', title: 'Biography and Contact Details'},
                {id: 'resources', title: 'Associated Resources'},
                {id: 'all', title: 'Full Report'},
                {id: 'json', title: 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');

            self.fullReportConfig = {
                id: 'organization',
                label: 'Organization',
                summaryNodeGroups: [
                    "e8431c5d-8098-11ea-8348-f875a44e0e11",
                    "af3b0116-29a9-11eb-8333-f875a44e0e11",
                    "1b6f9cb4-51ae-11eb-a1fe-f875a44e0e11"
                ],
                ignoreNodes: []
            };

            self.nameDataConfig = {
                name: 'names',
                nameChildren: 'organization',
                parent: 'parent organization'
            };

            self.descriptionDataConfig = {
                citation: 'bibliographic source citation'
            };

            self.classificationDataConfig = {
                organizationFormation: 'organization formation'
            };

            self.locationDataConfig = {
                administrativeAreas: undefined,
                nationalGrid: undefined,
                locationDescription: undefined,
                geometry: undefined,
                namedLocations: undefined
            };

            self.resourceDataConfig = {
                consultations: undefined,
                files: undefined,
                archive: undefined,
                actors: undefined
            };

            self.nameCards = {};
            self.classificationCards = {};
            self.locationCards = {};
            self.descriptionCards = {};
            self.resourcesCards = {};
            self.contactCards = {};
            self.summary = params.summary;
            self.cards = {};
            self.peopleCards = {};
            self.currencyData = {};

            if(params.report.cards){
                const cards = params.report.cards;

                self.cards = self.createCardDictionary(cards);

                self.nameCards = {
                    name: self.cards?.names,
                    externalCrossReferences: self.cards?.['external cross references'],
                    systemReferenceNumbers: self.cards?.['system reference numbers'],
                    parent: self.cards?.['parent organization']
                };

                self.descriptionCards = {
                    descriptions: self.cards?.descriptions,
                    citation: self.cards?.['bibliographic source citation']
                };

                self.resourcesCards = {
                    activities: self.cards?.['associated activities'],
                    assets: self.cards?.['associated monuments, areas and artefacts']
                };

                self.classificationCards = {
                    organizationFormation: self.cards?.['organization formation']
                };

                self.peopleCards = {
                    people: 'associated people and organizations'
                };

                self.contactCards = {
                    contact: self.cards?.['contact details']
                };

                self.locationCards = {
                    cards: self.cards,
                    location: {
                        card: null,
                        subCards: {
                            addresses: 'addresses'
                        }
                    }
                };

            }

            self.currencyData = ko.observable({
                sections:
                    [
                        {
                            title: "Organization Currency",
                            data: [{
                                key: 'Currency Type',
                                value: self.getNodeValue(self.resource(), 'organization currency type'),
                                card: self.cards?.['organization currency'],
                                type: 'kv'
                            }]
                        }
                    ]
            });

            self.peopleData = ko.observable({
                sections:
                    [
                        {
                            title: "Associated People and Organizations",
                            data: [{
                                key: 'Associates',
                                value: self.getRawNodeValue(self.resource(), 'associated actors'),
                                card: self.cards?.['associated people and organizations'],
                                type: 'resource'
                            }]
                        }
                    ]
            });

        },
        template: organizationReportTemplate
    });
});
