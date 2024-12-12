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
    'views/components/reports/scenes/all',
], function($, _, ko, arches, resourceUtils, reportUtils, heritageAssetReportTemplate) {
    return ko.components.register('heritage-asset-report', {
        viewModel: function(params) {
            var self = this;
            params.configKeys = ['tabs', 'activeTabIndex'];
            this.configForm = params.configForm || false;
            this.configType = params.configType || 'header';
            this.report = params.report;

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
                ignoreNodes: []
            }

            

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
