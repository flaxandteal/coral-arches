define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'templates/views/components/reports/scenes/assessments.htm',
    'bindings/datatable'
], function(_, ko, arches, reportUtils, assessmentsReportTemplate) {
    return ko.components.register('views/components/reports/scenes/assessments', {
        viewModel: function (params) {
            const self = this;
            Object.assign(self, reportUtils);

            // Scientific Dates table configuration
            self.scientificDatesTableConfig = {
                ...this.defaultTableConfig,
                columns: Array(13).fill(null)
            };

            // Artefact Condition table configuration
            self.artefactConditionConfig = {
                ...this.defaultTableConfig,
                columns: Array(5).fill(null)
            };


            self.dataConfig = {
                scientificDate: 'scientific date assignment',
                issueReports: 'issue report',
                artefactConditin: undefined
            }


            self.issueReports = ko.observableArray();

            this.issueReportsTableConfig = {
                ...this.defaultTableConfig,
                "columns": [
                    { "width": "20%" },
                    { "width": "20%" },
                    { "width": "20%" },
                    { "width": "20%" },
                    { "width": "20%" },
                   null,
                ]
            };

            self.cards = Object.assign({}, params.cards);
            self.edit = params.editTile || self.editTile;
            self.delete = params.deleteTile || self.deleteTile;
            self.add = params.addTile || self.addNewTile;
            self.scientificDate = ko.observable();
            self.artefactCondition = ko.observableArray();
            self.visible = {
                scientificDate: ko.observable(true),
                artefactCondition: ko.observable(true),
                issueReports: ko.observable(true)

            }
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            if (params?.compiled) {
            } else {
                const scientificDate = self.getRawNodeValue(params.data(), self.dataConfig.scientificDate)
                if (Array.isArray(scientificDate)) {
                    self.scientificDate(scientificDate.map(x => {
                        const constructionPhase = self.getNodeValue(x, 'associated construction phase');
                        const dateDeterminationQualifier = self.getNodeValue(x, 'when determined', 'when determined date qualifier');
                        const dateQualifier = self.getNodeValue(x, 'scientific date timespan', 'scientific date qualifier');
                        const datingMethod = self.getNodeValue(x, 'dating method');
                        const earliestDate = self.getNodeValue(x, 'scientific date timespan', 'scientific date start date');
                        const endDateOfDetermination = self.getNodeValue(x, 'when determined', 'when determined end date');
                        const generalNote = self.getRawNodeValue(x, 'notes', 'note', '@display_value');
                        const laboratoryNote = self.getNodeValue(x, 'laboratory references', 'laboratory reference');
                        const latestDate = self.getNodeValue(x, 'scientific date timespan', 'scientific date end date');
                        const standardDeviation = self.getNodeValue(x, 'standard deviation', 'standard deviation value');
                        const standardDeviationComment = self.getRawNodeValue(x, 'standard deviation', 'standard deviation notes', 'standard deviation note', '@display_value');
                        const startDateOfDetermination = self.getNodeValue(x, 'when determined', 'when determined start date');
                        const tileid = self.getTileId(x);
                        return {
                            constructionPhase,
                            dateDeterminationQualifier,
                            dateQualifier,
                            datingMethod,
                            earliestDate,
                            endDateOfDetermination,
                            generalNote,
                            laboratoryNote,
                            latestDate,
                            standardDeviation,
                            standardDeviationComment,
                            startDateOfDetermination,
                            tileid
                        };
                    }));
                }

                const artefactConditionNode = self.getRawNodeValue(params.data(), self.dataConfig.artefactCondition)
                if (Array.isArray(artefactConditionNode)) {
                    self.artefactCondition(artefactConditionNode.map(x => {
                        const type = self.getNodeValue(x, 'condition state', 'condition type');
                        const file = self.getNodeValue(x, 'condition state', 'digital file(s)');
                        const startDate = self.getNodeValue(x, 'condition timespan', 'date of assessment start');
                        const endDate = self.getNodeValue(x, 'condition timespan', 'date of assessment end');
                        const tileid = self.getTileId(x);

                        return {
                            type,
                            file,
                            endDate,
                            startDate,
                            tileid
                        };
                    }));
                }
                
                console.log('params.data(): ', params.data())
                const issueReportsData = self.getRawNodeValue(params.data(), {
                    testPaths: [
                        ["issue report"]
                    ]
                });
                console.log('issueReportsData: ', issueReportsData)
                
                if(issueReportsData) {
                    issueReportsData.forEach((report) => {
                      const issueReport = {};
                      issueReport.componentDamageType = self.getNodeValue(
                        report,
                        'component damage type'
                      );
                      issueReport.damageType = self.getNodeValue(report, 'damage type');
                      issueReport.notes = self.getNodeValue(
                        report,
                        'issue notes',
                        'issue note'
                      );
                      issueReport.proposalActionType = self.getNodeValue(
                        report,
                        'issue proposal',
                        'action type'
                      );
                      issueReport.proposalApprover = self.getNodeValue(
                        report,
                        'issue proposal',
                        'approver',
                        'approved by'
                      );
                      issueReport.proposalContactDetails = self.getNodeValue(
                        report,
                        'issue proposal',
                        'contact details',
                        'contact details value'
                      );
                      issueReport.proposalIntendedDateStart = self.getNodeValue(
                        report,
                        'issue proposal',
                        'intended dates',
                        'intended start date'
                      );
                      issueReport.proposalIntendedDateEnd = self.getNodeValue(
                        report,
                        'issue proposal',
                        'intended dates',
                        'intended end date'
                      );
                      issueReport.proposalDate = self.getNodeValue(
                        report,
                        'issue proposal',
                        'proposal date',
                        'proposal date value'
                      );
                      issueReport.proposalDescriptionType = self.getNodeValue(
                        report,
                        'issue proposal',
                        'proposal description type',
                        '@display_value'
                      );
                      issueReport.proposalText = self.getNodeValue(
                        report,
                        'issue proposal',
                        'proposal text'
                      );
                      issueReport.reference = self.getNodeValue(report, 'issue reference', 'reference number');
                      issueReport.materialFabricDamage = self.getNodeValue(
                        report,
                        'material/fabric damage type'
                      );
                      issueReport.signOffDate = self.getNodeValue(report, 'sign off date', 'sign off date value');
                      issueReport.statusType = self.getNodeValue(report, 'status type');
                      issueReport.workFinishDate = self.getNodeValue(report, 'work finish date', 'work finish date value');
                      self.issueReports.push(issueReport);
                    });
                    console.log('self.issueReports: ', self.issueReports());
                }



            }
        },
        template: assessmentsReportTemplate
    });
});