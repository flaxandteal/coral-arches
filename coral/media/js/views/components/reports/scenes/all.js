import _ from 'underscore';
import ko from 'knockout';
import arches from 'arches';
import reportUtils from 'utils/report';
import SummaryStep from 'views/components/workflows/summary-step';
import resourceReportAbstract from 'views/components/resource-report-abstract';
import ReportViewModel from 'viewmodels/report';
import allReportTemplate from 'templates/views/components/reports/scenes/all.htm';
import datatable from 'bindings/datatable';
import renderNodes from 'views/components/workflows/render-nodes';

export default ko.components.register('views/components/reports/scenes/all', {
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
