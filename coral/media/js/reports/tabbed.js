import ko from 'knockout';
import TabbedReportViewModel from 'viewmodels/tabbed-report';
import tabbedReportTemplate from 'templates/views/report-templates/tabbed.htm';
import mapHeader from 'reports/map-header';
import consultationsStatus from 'reports/consultations-status';
import consultationsSiteVisitEmpty from 'reports/consultations-site-visit-empty';
import consultationsConditionsMitigations from 'reports/consultations-conditions-mitigations';
import consultationsSiteVisitsSummary from 'reports/consultations-site-visits-summary';
import consultationsCommunicationsSummary from 'reports/consultations-communications-summary';
import consultationsSiteVisitMain from 'reports/consultations-site-visit-main';

export default ko.components.register('tabbed-report', {
        viewModel: TabbedReportViewModel,
        template: tabbedReportTemplate
    });
