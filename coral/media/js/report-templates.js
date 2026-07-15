import 'reports/default';
import 'reports/tabbed';

import 'views/components/reports/activity';
import 'views/components/reports/application-area';
import 'views/components/reports/archive-source';
import 'views/components/reports/area';
import 'views/components/reports/artefact';
import 'views/components/reports/bibliographic-source';
import 'views/components/reports/consultation';
import 'views/components/reports/digital-object';
import 'views/components/reports/heritage-area';
import 'views/components/reports/heritage-asset';
import 'views/components/reports/heritage-asset-merge';
import 'views/components/reports/heritage-story';
import 'views/components/reports/historic-aircraft';
import 'views/components/reports/historic-landscape-characterization';
import 'views/components/reports/licence';
import 'views/components/reports/maritime-vessel';
import 'views/components/reports/monument';
import 'views/components/reports/organization';
import 'views/components/reports/period';
import 'views/components/reports/person';
import 'views/components/reports/place';
import 'views/components/reports/state-care-condition-survey';

import 'views/components/reports/scenes/all';
import 'views/components/reports/scenes/archive';
import 'views/components/reports/scenes/assessments';
import 'views/components/reports/scenes/audit';
import 'views/components/reports/scenes/classifications';
import 'views/components/reports/scenes/contact';
import 'views/components/reports/scenes/copyright';
import 'views/components/reports/scenes/default';
import 'views/components/reports/scenes/description';
import 'views/components/reports/scenes/django-group';
import 'views/components/reports/scenes/enforcements';
import 'views/components/reports/scenes/images';
import 'views/components/reports/scenes/json';
import 'views/components/reports/scenes/keyvalue';
import 'views/components/reports/scenes/location';
import 'views/components/reports/scenes/map';
import 'views/components/reports/scenes/name';
import 'views/components/reports/scenes/people';
import 'views/components/reports/scenes/protection';
import 'views/components/reports/scenes/resources';
import 'views/components/reports/scenes/user-account';

function removeTrailingCommaFromObject(string) {
    return string.replace(/,\s*}*$/, "}");
}

let reportTemplates;
try {
    const reportTemplateDataHTML = document.querySelector('#reportTemplateData');
    const reportTemplateData = reportTemplateDataHTML.getAttribute('reportTemplates');
    reportTemplates = JSON.parse(removeTrailingCommaFromObject(reportTemplateData));
} catch (error) {
    console.error(error);
}

export default reportTemplates;
