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
], function(_, ko, arches, reportUtils, SummaryStep, resourceReportAbstract, ReportViewModel, allReportTemplate) {
    return ko.components.register('views/components/reports/scenes/all', {
        viewModel: function(params) {
            params.report.template = {
                "component": "reports/default",
                "componentname": "default-report",
                "defaultconfig": {},
                "defaultconfig_json": "{}",
                "description": "Default Template",
                "name": "No Header Template",
                "preload_resource_data": true,
                "templateid": "50000000-0000-0000-0000-000000000001"
            };

            params.report.hideEmptyNodes = true;

            ReportViewModel.apply(this, [params]);

            this.showCards = params.showCards ?? true;
            this.showRelated = params.showRelated ?? true;
        },
        template: allReportTemplate
    });
});
