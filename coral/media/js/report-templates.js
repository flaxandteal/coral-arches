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
