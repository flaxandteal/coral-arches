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
    
            this.nodeGroups = params.nodeGroups ?? null;
            this.hiddenNodes = params.hideNodes ?? null;
            this.showCards = params.showCards ?? true;
            this.showRelated = params.showRelated ?? true;

            params.report.hideEmptyNodes = true;
            
            ReportViewModel.apply(this, [params]);

            this.relatedResources = Object.values(this.report.relatedResourcesLookup());
            this.hasRelatedResources = this.relatedResources.some(resource => resource.totalRelatedResources > 0);
            this.viewableCards = ko.observable(this.report.cards);

            if (this.nodeGroups?.length > 0) {
                this.viewableCards = this.report.cards.filter(card => {
                    return this.nodeGroups.includes(card.nodegroupid);
                });
            }
            else {
                this.viewableCards = this.report.cards;
            }
        },
        template: allReportTemplate
    });
});
