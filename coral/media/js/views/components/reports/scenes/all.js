define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'templates/views/components/reports/scenes/all.htm',
    'bindings/datatable',
    'views/components/reports/scenes/all'
], function(_, ko, arches, reportUtils, allReportTemplate) {
    return ko.components.register('views/components/reports/scenes/all', {
        viewModel: function(params) {
            var self = this;
            self.table = ko.observable(params.table)
            self.margin = ko.observable(params.margin && !params.table ? params.margin : 0)
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
            this.resource = params.data
            this.cards = Object.keys(this.resource)
            this.cards.forEach(label => {
                if (label.indexOf("@") !== -1 || label.indexOf("_") !== -1) {
                    delete this.resource[label]
                }
            })

            this.filterValues = (valueObject) => {
                let values = {}
                let metaless = Object.keys(valueObject)
                .filter(vo => vo.indexOf("@") === -1 && vo.indexOf("_") === -1)

                metaless
                .map(key => {
                    values[key] = {}
                    if (Array.isArray(valueObject[key])) {
                        values[key].cardinality = "m"
                        values[key].data = []
                        valueObject[key].forEach(row => {
                            if (Object.keys(row).includes("@display_value")) {
                                values[key].data.push(row["@display_value"])
                            } else {
                                values[key].data.push(row)
                            }
                        })
                        
                    } else {
                        values[key].cardinality = "1"
                        if (Object.keys(valueObject[key]).includes("@display_value")) {
                            values[key].data = valueObject[key]["@display_value"]
                        } else {
                            values[key].data = valueObject[key]
                        }
                    }
                })
                return values
            }

            this.sections = {}
            this.cards.forEach(title => {
                this.sections[title] = {}
                if (Array.isArray(this.resource[title])) {
                    this.sections[title].cardinality = "m"
                    this.sections[title].data = []
                    this.resource[title].forEach(row => {
                        if (row) {
                            if (Object.keys(row).includes("@display_value")) {
                                this.sections[title].data.push(row["@display_value"])
                            } else {
                                this.sections[title].data.push(row)
                            }
                        }
                    })
                } else {
                    this.sections[title].cardinality = "1"
                    if (this.resource[title]) {
                        if (Object.keys(this.resource[title]).includes("@display_value")) {
                            this.sections[title].data = this.resource[title]["@display_value"]
                        } else {
                            this.sections[title].data = this.resource[title]
                        }
                    }
                }
            })



            self.dataConfig = {
            }
            Object.assign(self.dataConfig, params.dataConfig || {});

            // if params.compiled is set and true, the user has compiled their own data.  Use as is.
            

        },
        template: allReportTemplate
    });
});