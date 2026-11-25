describe('Going through the State Care Condition Survey Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const MANY_BUTTONS = '.btn-workflow-tile';
    const TILE_CARDS = '.wf-multi-tile-step-card';
    const CALENDAR = '.bootstrap-datetimepicker-widget';

    // Seeded Heritage Assets with an SMR number (cypress/seed).
    const ASSET = 'SMR-TEST-004 Testing';
    const OTHER_ASSET = 'SMR-TEST-005 Testing';

    // Set by the first test and used by the ones after it.
    const survey = {};

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
    };

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('contain.text', text);
    const selection = (alias) => cy.get(`.widget-wrapper.${alias} .select2-selection`).first();
    const manyButton = (text) => cy.contains(MANY_BUTTONS, text);
    const addIsDisabled = () => manyButton('Add').should('have.class', 'disabled');
    // A new selection reaches the tile a moment after select2 shows it; Add straight away keeps the old value.
    const addEntry = () => {
        cy.wait(2000);
        manyButton('Add').should('not.have.class', 'disabled').click();
    };
    const entries = () => cy.get(TILE_CARDS);
    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));

    const firstOption = (alias, expected) => {
        cy.get(`.widget-wrapper.${alias}`).scrollIntoView();
        selection(alias).click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).first().should('have.text', expected);
        cy.get('body').type('{esc}');
    };
    // Picking a second option replaces the first: single-select.
    const pickTwice = (alias, first, second) => {
        cy.pickCardOption(alias, first);
        selection(alias).should('contain.text', first);
        selection(alias).find('.select2-selection__clear').should('exist');
        cy.pickCardOption(alias, second);
        selection(alias).should('contain.text', second).and('not.contain.text', first);
    };

    // A maxDate:today datepicker starts empty, puts today in when opened, and greys out every later day.
    const checkDate = (alias, text) => {
        label(alias, text);
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', '').and('be.enabled').click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get(`${CALENDAR} td.day.active:visible`).nextAll('td.day').each(($day) => expect($day).to.have.class('disabled'));
        cy.get('.workflow-nav-tab.active').click();
        notShown(CALENDAR);
        cy.pickCalendarDay(alias, 1);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', firstOfMonth());
    };

    const openLauncher = () => {
        cy.contains('.workflow-select-card', 'State Care Condition Survey', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
    };
    const pickHeritageAsset = (name) => {
        cy.get('.select2-selection[aria-label^="Select Heritage Asset"]', { timeout: 60000 }).first().click();
        cy.select2Search(name);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(name).click();
    };

    const termFilter = (value) => encodeURIComponent(JSON.stringify([{ context: '', context_label: '', id: `string${value}`,
        text: value, type: 'string', value, inverted: false, selected: true }]));

    // The survey is indexed a moment after its tiles save, so search again until it shows.
    const findSurvey = (attemptsLeft = 6) => {
        cy.request(`/search/resources?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(survey.reference)}`).then((response) => {
            const hit = response.body.results.hits.hits.find((h) => h._source.displayname.includes(survey.reference));
            if (hit) {
                survey.resourceId = hit._id;
                return;
            }
            expect(attemptsLeft, `${survey.reference} in the search results`).to.be.greaterThan(0);
            cy.wait(5000);
            findSurvey(attemptsLeft - 1);
        });
    };

    it('Start new and go through the workflow and populate all fields', function () {
        // Open Workflow: both buttons wait for a Heritage Asset; the survey list needs one first.
        openLauncher();
        cy.get('.select2-selection[aria-label^="Select Heritage Asset"]').should('exist');
        cy.get('.select2-selection[aria-label^="Selected State Care Condition Survey"]').should('exist');
        cy.contains('button', 'Start New').should('be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');

        // Only Heritage Assets with an SMR number are offered.
        cy.intercept('GET', '/search/resources*').as('assets');
        pickHeritageAsset(OTHER_ASSET);
        cy.get('@assets').its('request.url').then(decodeURIComponent)
            .should('include', 'd146451b-9140-5f81-b3de-9005acc01e28').and('include', 'not_null');
        pickHeritageAsset(ASSET);
        cy.get('.select2-selection[aria-label^="Select Heritage Asset"]').first()
            .should('contain.text', ASSET).and('not.contain.text', OTHER_ASSET);
        cy.contains('button', 'Start New').should('be.enabled');
        cy.contains('button', 'Open Selected').should('be.disabled');

        cy.intercept('POST', '/orm/resources').as('smr');
        cy.contains('button', 'Start New').click();

        // Initial Step: the SMR number of the chosen asset, locked.
        cy.contains('Associated Heritage Asset', { timeout: 90000 });
        cy.contains('Please select the Heritage Asset being surveyed');
        cy.wait('@smr', { timeout: 90000 }).then(({ response }) => {
            survey.smr = Object.values(response.body)[0].smr_number[0];
            cy.get('input[aria-label="SMR Number"]', { timeout: 30000 }).should('be.disabled').and('have.value', survey.smr);
        });
        cy.get(FOOTER).should('contain.text', 'Next Step').and('not.contain.text', 'Previous Step').and('not.contain.text', 'Save');
        cy.workflowNext();

        // Survey Reference: generated into a locked box, later tabs locked until it is saved.
        label('resourceid', 'Survey Reference');
        cy.get('[aria-label="Survey Reference"]', { timeout: 60000 }).should('be.disabled')
            // The checklist shows SCCS/2024/0000; the v8 generator ends in a random code, as the other workflows' IDs do.
            .and(($input) => expect($input.val()).to.match(/^SCCS\/\d{4}\/\w+$/))
            .invoke('val').then((reference) => { survey.reference = reference; });
        cy.get('.workflow-nav-tab.disabled').should('have.length', 3);
        footer({ save: true });
        cy.workflowNext();

        // Overall Scored Assessment: an empty list, and Add waits for all four fields.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Overall Scored Assessment');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 0);
        footer({ next: true });
        entries().should('not.exist');
        label('assessment_type', 'Assessment Type');
        label('works_required', 'Works Required');
        label('condition_score', 'Condition Score');
        label('priority', 'Priority');

        firstOption('assessment_type', '1. Access arrangements & conditions');
        firstOption('condition_score', '1 - Optimal');
        firstOption('priority', '1 - Low');

        pickTwice('assessment_type', '2. Visitor facilities and physical accessibility', '1. Access arrangements & conditions');
        addIsDisabled();
        pickTwice('works_required', 'no', 'yes');
        addIsDisabled();
        pickTwice('condition_score', '2 - Generally satisfactory', '1 - Optimal');
        addIsDisabled();
        pickTwice('priority', '2 - Medium', '1 - Low');
        addEntry();
        entries().should('have.length', 1)
            .and('contain.text', '1. Access arrangements & conditions').and('contain.text', 'yes')
            .and('contain.text', '1 - Optimal').and('contain.text', '1 - Low')
            .and('contain.text', 'Remove').and('contain.text', 'Edit');
        // The checklist's Undo button is gone in v8.
        footer({ save: true });

        entries().first().contains('Remove').click();
        entries().should('not.exist');
        footer({ next: true });

        cy.pickCardOption('assessment_type', '1. Access arrangements & conditions');
        cy.pickCardOption('works_required', 'yes');
        cy.pickCardOption('condition_score', '1 - Optimal');
        cy.pickCardOption('priority', '1 - Low');
        addEntry();
        cy.pickCardOption('assessment_type', '8. Archaeological overview');
        cy.pickCardOption('works_required', 'no');
        cy.pickCardOption('condition_score', '3 - Generally satisfactory');
        cy.pickCardOption('priority', '3 - High');
        addEntry();
        entries().should('have.length', 2);

        label('notes', 'Notes');
        cy.get('.widget-wrapper.notes .cke_wysiwyg_frame', { timeout: 60000 }).should('exist');
        cy.typeRichText('notes', 'Notes for automated testing.');
        footer({ save: true });
        cy.workflowNext();

        // Documentation: uploads are covered by the workflow upload specs, so only the empty widget here.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Documentation');
        cy.contains('Upload Documents', { timeout: 60000 });
        cy.contains('Drag & Drop your files onto this panel');
        cy.contains('button', 'Select Files').should('be.enabled');
        cy.contains('the maximum size of any single file is 200MB');
        footer({ next: true });
        cy.workflowNext();

        // Sign Off
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Sign Off');
        cy.get(FOOTER).should('not.contain.text', 'Save and Continue');
        checkDate('completed_on', 'Completed On');
        cy.get(FOOTER).should('contain.text', 'Save');
        cy.get('.widget-wrapper.completed_on').contains('button', 'Clear').click();
        cy.get('.widget-wrapper.completed_on input.form-control').first().should('have.value', '');
        cy.get(FOOTER).should('contain.text', 'Previous Step').and('not.contain.text', 'Save');
        cy.pickCalendarDay('completed_on', 1);
        checkDate('signed_off_date', 'Signed Off Date');
        // The admin user has no Person in a sign-off group.
        cy.contains('You do not have permission to sign off').should('exist');

        cy.get(FOOTER).find('button:not([disabled])').contains(/^\s*Save\s*$/).click();
        cy.get(FOOTER, { timeout: 30000 }).should('not.contain.text', 'Save');
        cy.get('.widget-wrapper.completed_on input.form-control').first().should('have.value', firstOfMonth());
        cy.contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });

    it('Finds the survey and shows what was entered on its report', function () {
        cy.then(() => {
            findSurvey();
            cy.visit(`/search?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(survey.reference)}`, { timeout: 180000 });
            cy.contains(survey.reference, { timeout: 60000 });
        });
        cy.then(() => {
            cy.visit(`/report/${survey.resourceId}`, { timeout: 180000 });
            cy.contains(survey.reference, { timeout: 60000 });
            cy.get('body').should(($body) => {
                const text = $body.text();
                const expected = [survey.reference, '1. Access arrangements & conditions', '8. Archaeological overview',
                    '1 - Optimal', '3 - High', 'Notes for automated testing.', firstOfMonth()];
                expect(expected.filter((value) => !text.includes(value)), 'values missing from the report').to.deep.equal([]);
            });
        });
    });

    it('Lists the survey under its Heritage Asset and clears it when the asset changes', function () {
        openLauncher();
        cy.then(() => {
            cy.intercept('GET', '/search/resources?paging-filter=*07428674-5020-11ef-b77e-0242ac120006*').as('surveys');
            pickHeritageAsset(ASSET);
            cy.wait('@surveys');
            cy.wait(3000);
            cy.get('.select2-selection[aria-label^="Selected State Care Condition Survey"]', { timeout: 30000 }).first().click();
            cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(survey.reference).click();
        });
        cy.contains('button', 'Open Selected').should('be.enabled');

        pickHeritageAsset(OTHER_ASSET);
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.then(() => cy.get('.select2-selection[aria-label^="Selected State Care Condition Survey"]').first().should('not.contain.text', survey.reference));
    });
});
