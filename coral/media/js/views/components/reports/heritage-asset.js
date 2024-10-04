define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'utils/resource',
    'utils/report',
    'templates/views/components/reports/heritage-asset.htm',
    'views/components/reports/scenes/name',
    'views/components/reports/scenes/json',
    'views/components/reports/scenes/all'
], function($, _, ko, arches, resourceUtils, reportUtils, heritageAssetReportTemplate) {
    return ko.components.register('heritage-asset-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            this.configForm = params.configForm || false;
            this.configType = params.configType || 'header';

            Object.assign(self, reportUtils);
            self.sections = [
                {id: 'name', title: 'Names and Identifiers'},
                {id: 'description', title: 'Descriptions and Citations'},
                {id: 'classifications', title: 'Classifications and Dating'},
                {id: 'location', title: 'Location Data'},
                {id: 'protection', title: 'Designation and Protection Status'},
                {id: 'assessments', title: 'Assessments'},
                {id: 'images', title: 'Images'},
                {id: 'people', title: 'Associated People and Organizations'},
                {id: 'resources', title: 'Associated Resources'},
                {id: 'all', title: 'Full Report'},
                {id: 'json', title: 'JSON'},
            ];
            self.reportMetadata = ko.observable(params.report?.report_json);
            self.resource = ko.observable(self.reportMetadata()?.resource);
            self.displayname = ko.observable(ko.unwrap(self.reportMetadata)?.displayname);
            self.activeSection = ko.observable('name');
            self.print = ko.observable(window.location.href.indexOf("?print") > -1)


            self.nameDataConfig = {
                name: 'heritage asset',
                nameChildren: 'asset',
                parent: 'parent asset'
            };

            self.classificationDataConfig = {
                production: 'construction phases',
                components: 'components',
                usePhase: 'use phases'
            };

            self.descriptionDataConfig = {
                citation: 'bibliographic source citation'
            };

            self.resourceDataConfig = {
                activities: 'associated activities',
                files: 'digital file(s)',
                actors: undefined
            }

            self.nameCards = {};
            self.descriptionCards = {};
            self.classificationCards = {};
            self.assessmentCards = {};
            self.imagesCards = {};
            self.locationCards = {};
            self.protectionCards = {};
            self.peopleCards = {};
            self.resourcesCards = {};
            self.summary = params.summary;
            self.cards = {};

            self.resource = ko.observable(self.resource())
            console.log(self.resource())

            self.fullReportConfig = {
                id: 'heritage-asset',
                label: 'Heritage Asset',
                ignoreNodes: [
                    "87d39b42-f44f-11eb-9a05-a87eeabdefba",
                    "87d39b3f-f44f-11eb-be51-a87eeabdefba",
                    "87d39b3e-f44f-11eb-bec5-a87eeabdefba",
                    "77e8f297-efdc-11eb-a06e-a87eeabdefba",
                    "77e8f28c-efdc-11eb-b5fc-a87eeabdefba",
                    "77e8f28b-efdc-11eb-b757-a87eeabdefba",
                    "87d3d7e3-f44f-11eb-a725-a87eeabdefba",
                    "87d3d7df-f44f-11eb-8389-a87eeabdefba",
                    "87d3ff33-f44f-11eb-94d4-a87eeabdefba",
                    "87d3ff2c-f44f-11eb-b680-a87eeabdefba",
                    "87d39b50-f44f-11eb-8284-a87eeabdefba",
                    "87d3ff2d-f44f-11eb-b859-a87eeabdefba",
                    "87d3ff2e-f44f-11eb-8319-a87eeabdefba",
                    "87d39b40-f44f-11eb-9828-a87eeabdefba"
                ]
            }
            console.log("full repo", self.fullReportConfig)
            

            if(params.report.cards){
                console.log("report cards")
                const cards = params.report.cards;

                self.cards = self.createCardDictionary(cards)
                console.log("cards", cards)
                console.log("card dict", self.cards)

                self.nameCards = {
                    name: self.cards?.['heritage asset names'],
                    externalCrossReferences: self.cards?.['external cross references'],
                    systemReferenceNumbers: self.cards?.['system reference numbers'],
                    parent: self.cards?.['parent assets'],
                };
                console.log("Heres the cards", self.cards)
                self.descriptionCards = {
                    descriptions: self.cards?.['descriptions'],
                    citation: self.cards?.['bibliographic source citation']
                };

                self.classificationCards = {
                    production: self.cards?.['construction phases'],
                    components: self.cards?.['components'],
                    usePhase: self.cards?.['use phase']
                };

                self.assessmentCards = {
                    scientificDate: self.cards?.['scientific date assignment']
                };

                self.imagesCards = {
                    images: self.cards?.['photographs']
                }

                self.peopleCards = {
                    people: self.cards?.['associated people and organizations']
                };

                self.resourcesCards = {
                    activities: self.cards?.['associated_activities'],
                    consultations: self.cards?.['associated consultations'],
                    files: self.cards?.['associated digital file(s)'],
                    assets: self.cards?.['associated heritage assets, areas and artefacts']
                };

                self.locationCards = {
                    location: {
                        card: self.cards?.['location data'],
                        subCards: {
                            addresses: 'addresses',
                            nationalGrid: 'national grid references',
                            administrativeAreas: 'localities/administrative areas',
                            locationDescriptions: 'location descriptions',
                            areaAssignment: 'area assignments',
                            landUse: 'land use classification assignment',
                            locationGeometry: 'geometry',
                            namedLocations: 'named locations'
                        }
                    }
                }

                self.protectionCards = {
                    designations: self.cards?.['designation and protection assignment']
                };

                Object.assign(self.protectionCards, self.locationCards);
            }

        },
        template: heritageAssetReportTemplate
    });
});
