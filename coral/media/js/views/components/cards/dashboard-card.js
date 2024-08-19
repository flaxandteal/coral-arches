define([
    'knockout',
    'underscore',
    'knockout-mapping',
    'arches',
    'templates/views/components/cards/dashboard-card.htm',
  ], function (ko, _, koMapping, arches, dashboardCardTemplate,) {
    function DashboardCardViewModel(params) {
        self = this
        self.data = params.data
        self.state = params.data.state

        this.openFlagged = (resourceId, responseSlug) => {
                localStorage.setItem('workflow-open-mode', JSON.stringify(true));
                let url = arches.urls.plugin(
                `${responseSlug}?resource-id=${resourceId}`
                );
                window.window.location = url;
            };
        }

    ko.components.register('dashboard-card', {
        viewModel: DashboardCardViewModel,
        template: dashboardCardTemplate
    })
})