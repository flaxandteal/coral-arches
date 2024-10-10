define([
  'underscore',
  'knockout',
  'arches',
  'utils/report',
  'views/components/workflows/summary-step',
  'views/components/resource-report-abstract',
  'viewmodels/report', 
  'templates/views/components/reports/scenes/all.htm',
  'bindings/datatable',
  'views/components/workflows/render-nodes',
], function (_, ko, arches, reportUtils, SummaryStep, resourceReportAbstract, ReportViewModel, allReportTemplate) {
  return ko.components.register('views/components/reports/scenes/all', {
    viewModel: function (params) {
      params.report.template = {
        "component": "reports/default",
        "componentname": "default-report",
        "defaultconfig": {},
        "defaultconfig_json": "{}",
        "description": "Default Template",
        "name": "No Header Template",
        "preload_resource_data": true,
        "templateid": "50000000-0000-0000-0000-000000000001"
      }
      this.nodeGroups = params.nodeGroups ?? null
      this.showRelated = params.showRelated ?? true

      params.report.hideEmptyNodes = true;

      // nodeGroups controls what groups to show. If it is null it will render everything
      if (this.nodeGroups?.length > 0) {
        params.report.cards = params.report.cards.filter(card => {
            return this.nodeGroups.includes(card.nodegroupid);
        });
    }

      ReportViewModel.apply(this, [params])      

      // this.report = ko.observable(params.report);
      // this.configForm = params.configForm;
      // this.configType = params.configType;
      // this.summary = true;

      // this.template = ko.observable({
      //     "component": "reports/default",
      //     "componentname": "default-report",
      //     "defaultconfig": {},
      //     "defaultconfig_json": "{}",
      //     "description": "Default Template",
      //     "name": "No Header Template",
      //     "preload_resource_data": true,
      //     "templateid": "50000000-0000-0000-0000-000000000001"
      // })

      // this.report().template = this.template;


      // params.resourceid = params.resourceInstanceId;
      // params.pageVm = {
      //   plugin: { slug: 'ignore' }
      // };
      // SummaryStep.apply(this, [params]);

      // this.report = params.report;
      // this.reportId = ko.observable(params.fullReportConfig.id);
      // this.reportLabel = ko.observable(params.fullReportConfig.label);

      // this.showReport = ko.observable(false);

      // this.processGroup = (key, group, nodeConfig) => {
      //   const lowerCaseKey = key.toLowerCase();
      //   if (lowerCaseKey in nodeConfig) {
      //     return;
      //   }
      //   if (Array.isArray(group)) {
      //     nodeConfig[lowerCaseKey] = {
      //       label: key,
      //       nodegroupId: group[0]['@node_id'],
      //       renderNodes: this.processNodes(group[0], nodeConfig)
      //     };
      //     return;
      //   }
      //   nodeConfig[lowerCaseKey] = {
      //     label: key,
      //     nodegroupId: group['@node_id'],
      //     renderNodes: this.processNodes(group, nodeConfig)
      //   };
      //   return nodeConfig;
      // };

      // this.processNodes = (nodes, nodeConfig) => {
      //   const renderNodes = [];
      //   Object.entries(nodes).forEach(([key, value]) => {
      //     if (key.startsWith('@')) {
      //       return;
      //     }
      //     if (
      //       Object.prototype.toString.call(value) !== '[object Object]' ||
      //       !('@parent_node_id' in value)
      //     ) {
      //       renderNodes.push(value['@node_id']);
      //       return;
      //     }
      //     this.processGroup(key, value, nodeConfig);
      //   });
      //   return renderNodes;
      // };

      // this.getData = async () => {
      //   const nodeConfig = {
      //     id: this.reportId(),
      //     label: this.reportLabel()
      //   };

      //   Object.entries(params.data).forEach(([key, value]) => {
      //     this.processGroup(key, value, nodeConfig);
      //   });

      //   await this.renderResourceIds(this.resourceid, nodeConfig);

      //   console.log(`${this.reportLabel()} summary config: `, this.renderedNodegroups());
      //   this.showReport(true);
      // };

      // this.loadData();

      // var self = this;
      // self.table = ko.observable(params.table)
      // self.margin = ko.observable(params.margin && !params.table ? params.margin : 0)
      // Object.assign(self, reportUtils);

      // self.nameTableConfig = {
      //     ...self.defaultTableConfig,
      //     "columns": [
      //         { "width": "50%" },
      //         { "width": "20%" },
      //         { "width": "20%" },
      //        null,
      //     ]
      // };

      // this.crossReferenceTableConfig = {
      //     ...this.defaultTableConfig,
      //     "columns": [
      //         { "width": "20%" },
      //         { "width": "20%" },
      //         { "width": "50%" },
      //         { "width": "10%" },
      //        null,
      //     ]
      // };
      //   this.resource = params.data
      //   // console.log('resource: ', this.resource)

      //   this.cards = Object.keys(this.resource)
      //   this.cards.forEach(label => {
      //       if (label.indexOf("@") !== -1 || label.indexOf("_") !== -1) {
      //           delete this.resource[label]
      //       }
      //   })

      // this.filterValues = (valueObject) => {
      //     let values = {}
      //     let metaless = Object.keys(valueObject)
      //     .filter(vo => vo.indexOf("@") === -1 && vo.indexOf("_") === -1)

      //     metaless
      //     .map(key => {
      //         values[key] = {}
      //         if (Array.isArray(valueObject[key])) {
      //             values[key].cardinality = "m"
      //             values[key].data = []
      //             valueObject[key].forEach(row => {
      //                 if (Object.keys(row).includes("@display_value")) {
      //                     values[key].data.push(row["@display_value"])
      //                 } else {
      //                     values[key].data.push(row)
      //                 }
      //             })

      //         } else {
      //             values[key].cardinality = "1"
      //             if (Object.keys(valueObject[key]).includes("@display_value")) {
      //                 values[key].data = valueObject[key]["@display_value"]
      //             } else {
      //                 values[key].data = valueObject[key]
      //             }
      //         }
      //     })
      //     return values
      // }

      //   this.sections = {}
      //   this.cards.forEach(title => {
      //       this.sections[title] = {}
      //       if (Array.isArray(this.resource[title])) {
      //           this.sections[title].cardinality = "m"
      //           this.sections[title].data = []
      //           this.resource[title].forEach(row => {
      //               if (row) {
      //                   if (Object.keys(row).includes("@display_value")) {
      //                       this.sections[title].data.push(row["@display_value"])
      //                   } else {
      //                       this.sections[title].data.push(row)
      //                   }
      //               }
      //           })
      //       } else {
      //           this.sections[title].cardinality = "1"
      //           if (this.resource[title]) {
      //               if (Object.keys(this.resource[title]).includes("@display_value")) {
      //                   this.sections[title].data = this.resource[title]["@display_value"]
      //               } else {
      //                   this.sections[title].data = this.resource[title]
      //               }
      //           }
      //       }
      //   })

      // self.dataConfig = {
      // }
      // Object.assign(self.dataConfig, params.dataConfig || {});

      // if params.compiled is set and true, the user has compiled their own data.  Use as is.
    },
    template: allReportTemplate
  });
});
