import ko from 'knockout';
import _ from 'underscore';
import koMapping from 'knockout-mapping';
import arches from 'arches';
import dashboardCardTemplate from 'templates/views/components/cards/dashboard-card.htm';

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
