define([
    'underscore',
    'knockout',
    'arches',
    'utils/report',
    'views/components/workflows/summary-step',
    'views/components/resource-report-abstract',
    'viewmodels/report', 
    'templates/views/components/reports/scenes/enforcements.htm',
    'bindings/datatable',
    'views/components/workflows/render-nodes',
], function(_, ko, arches, reportUtils, SummaryStep, resourceReportAbstract, ReportViewModel, allReportTemplate) {
    return ko.components.register('views/components/reports/scenes/enforcements', {
        viewModel: function(params) {
            console.log("Enforcement Scene Enforcement", params)
            
            this.nodeGroups = params.nodeGroups ?? null;
            this.hiddenNodes = params.hideNodes ?? null;
            this.showCards = params.showCards ?? true;
            this.showRelated = params.showRelated ?? true;
            this.enforcements = ko.observable()
            
            ReportViewModel.apply(this, [params]);
            console.log("this", this)

            this.resourceinstanceid = this.report.attributes.resourceid

            getEnforcements = async () => {
                const enforcements = await $.ajax({
                    type: 'GET',
                    // advanced-search=[{"op"%3A"and"%2C"a78e548a-b554-11ee-805b-0242ac120006"%3A{"op"%3A""%2C"val"%3A["${this.resourceinstanceid}"]}}]
                    url: `/search/resources?advanced-search=[{"op"%3A"and"%2C"a78e548a-b554-11ee-805b-0242ac120006"%3A{"op"%3A""%2C"val"%3A["${this.resourceinstanceid}"]}}]`,
                    dataType: 'json',
                    context: this,
                    error: (response, status, error) => {
                      console.error(response, status, error);
                    }
                })
                console.log("got the enforcements", enforcements)
                this.enforcements(enforcements.results.hits.hits.map(e => {return {name:e._source.displayname, url: `/report/${e._id}`}}))
            }
            getEnforcements()


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
