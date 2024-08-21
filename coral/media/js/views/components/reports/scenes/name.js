define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'templates/views/components/reports/scenes/name.htm',
    'bindings/datatable',
], function(_, ko, arches, reportUtils, nameReportTemplate) {
    return ko.components.register('views/components/reports/scenes/name', {
        viewModel: function(params) {
            var self = this;
            Object.assign(self, reportUtils);

            self.nameTableConfig = {
                ...self.defaultTableConfig,
                "columns": [
                    { "width": "50%" },
                    { "width": "20%" },
                    { "width": "20%" },
                   null,
                ]
            };

            this.crossReferenceTableConfig = {
                ...this.defaultTableConfig,
                "columns": [
                    { "width": "20%" },
                    { "width": "20%" },
                    { "width": "50%" },
                    { "width": "10%" },
                   null,
                ]
            };

            self.dataConfig = {
                name: 'names',
                xref: 'external cross references',
                systemRef: 'system reference numbers',
                haRef: 'heritage asset references',
                displayName: 'display name',
                parent: undefined,
                recordStatus: undefined
            }

            self.hideNames = ko.observable(params.hideNames ?? false);
            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.names = ko.observableArray();
            self.hideCrossReferences = ko.observable(params.hideCrossReferences ?? false);
            self.crossReferences = ko.observableArray();
            self.systemReferenceNumbers = ko.observable();
            self.haReferences = ko.observable();
            self.displayName = ko.observable();
            self.parentData = ko.observable();
            self.recordStatusData = ko.observable();
            self.summary = params.summary || false;
            self.visible = {
                names: ko.observable(true),
                crossReferences: ko.observable(true),
                systemReferenceNumbers: ko.observable(true),
                haReferences: ko.observable(true),
                displayName: ko.observable(true),
            }
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if(params?.compiled){
                self.names(params.data.names);
                self.crossReferences(params.data.crossReferences);
                self.systemReferenceNumbers(params.data.referenceNumbers);
                self.haReferences(params.data.haReferences);
                self.displayName(params.data.displayName);
            } else {
                const rawNameData = self.getRawNodeValue(params.data(), {
                    testPaths: [
                        ["names"],
                        [self.dataConfig.name], 
                        [`${self.dataConfig.name} names`]
                    ]
                });
                const nameData = rawNameData ? Array.isArray(rawNameData) ? rawNameData : [rawNameData] : undefined;

                if (nameData) {
                    self.names(nameData.map(x => {
                        const nameUseType = self.getNodeValue(x, {
                            testPaths: [
                                ['name use type'],
                                [`${self.dataConfig.name} name use type`],
                                [`${self.dataConfig.nameChildren} name use type`],
                                [`${self.dataConfig.nameChildren} use type`]
                            ]});
                        const name = self.getNodeValue(x, {
                            testPaths: [
                                ['name'],
                                [`${self.dataConfig.name} name`],
                                [`${self.dataConfig.nameChildren} name`],
                                [`${self.dataConfig.nameChildren}`]
                            ]});
                        const currency = self.getNodeValue(x, {
                            testPaths: [
                                ['name currency'],
                                [`${self.dataConfig.name} name currency`],
                                [`${self.dataConfig.nameChildren} name currency`],
                                [`${self.dataConfig.nameChildren} currency`]
                            ]});

                        const tileid = self.getTileId(x);
                        return { name, nameUseType, currency, tileid }
                    }));
                }

                const rawXrefData = self.getRawNodeValue(params.data(), {
                    testPaths: [
                        ["external cross references"]
                    ]
                });
                const xrefData = rawXrefData ? Array.isArray(rawXrefData) ? rawXrefData : [rawXrefData] : undefined;

                if(xrefData) {
                    self.crossReferences(xrefData.map(x => {
                        const name = self.getNodeValue(x,{
                            testPaths: [
                                ['external cross reference', '@display_value'],
                                ['external cross reference']
                            ]});
                        const description = self.getNodeValue(x, {
                            testPaths: [
                                ['external cross reference notes', 'external cross reference description', '@display_value'],
                                ['external cross reference notes', 'external cross reference description']
                            ]});
                        
                        const source = self.getNodeValue(x, {
                            testPaths: [
                                ['external cross reference source', '@display_value'],
                                ['external cross reference source']
                            ]
                        });

                        const urlJson = self.getNodeValue(x, {
                            testPaths: [['url']]
                        });

                        const url = urlJson && urlJson != '--' ? JSON.parse(urlJson) : undefined;

                        const tileid = self.getTileId(x);
                        return { name, description, source, url, tileid }
                    }));
                }
            } 

            const systemRefData = self.getRawNodeValue(params.data(), {
                testPaths: [
                    ["system reference numbers"]
                ]
            });

            if(systemRefData) {
                const systemRef = {};
                systemRef.resourceId = self.getNodeValue(systemRefData, 'uuid', 'resourceid');
                systemRef.legacyId = self.getNodeValue(systemRefData, 'legacyid', 'legacy id');
                systemRef.primaryReferenceNumber = self.getNodeValue(systemRefData, 'primaryreferencenumber', 'primary reference number');
                systemRef.tileid = self.getTileId(systemRefData);
                self.systemReferenceNumbers(systemRef);
            }

            const haReferencesData = self.getRawNodeValue(params.data(), {
                testPaths: [
                    ["heritage asset references"]
                ]
            });
            
            if(haReferencesData) {
                const haReferences = {};
                haReferences.hpgNumber = self.getNodeValue(haReferencesData, 'historic parks and gardens');
                haReferences.ihrNumber = self.getNodeValue(haReferencesData, 'ihr number');
                haReferences.hbNumber = self.getNodeValue(haReferencesData, 'hb number');
                haReferences.smrNumber = self.getNodeValue(haReferencesData, 'smr number');
                haReferences.tileid = self.getTileId(haReferencesData);
                self.haReferences(haReferences);
            }

            const displayNameData = self.getRawNodeValue(params.data(), {
                testPaths: [
                    ["display name"]
                ]
            });
            
            if(displayNameData) {
                const displayName = {};
                displayName.name = displayNameData['@display_value'];
                displayName.showSmr = self.getNodeValue(displayNameData, 'show smr number');
                displayName.showIhr = self.getNodeValue(displayNameData, 'show ihr number');
                displayName.showHb = self.getNodeValue(displayNameData, 'show hb number');
                displayName.showHpg = self.getNodeValue(displayNameData, 'show historic parks and gardens number');
                displayName.tileid = self.getTileId(displayNameData);
                self.displayName(displayName);
            }

            if(self.dataConfig.parent){
                self.parentData = ko.observable({
                    sections:
                        [
                            {
                                title: 'Relationships',
                                tileid: self.getTileId(self.getRawNodeValue(params.data(), self.dataConfig.parent)),
                                data: [{
                                    key: 'Parent Resource',
                                    value: self.getRawNodeValue(params.data(), self.dataConfig.parent),
                                    type: 'resource',
                                    card: self.cards?.parent
                                }]
                            }
                        ]
                });
            }

            if(self.dataConfig.recordStatus){
                self.recordStatusData = ko.observable({
                    sections:
                        [
                            {
                                title: 'Record Status',
                                data: [{
                                    key: 'Status',
                                    value: self.getNodeValue(params.data(), self.dataConfig.recordStatus, 'record status'),
                                    type: 'kv',
                                    card: self.cards?.recordStatus
                                }]
                            }
                        ]
                });
            }

        },
        template: nameReportTemplate
    });
});