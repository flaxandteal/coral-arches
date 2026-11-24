describe('Going through the Evaluation Meeting Workflow', function () {
    const container = Cypress.env('CORAL_CONTAINER');

    // Seeded by seed_test_evaluation_building: the launcher only lists buildings with an HB number.
    const BUILDING = 'HB/TEST/001 Evaluation Test';

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const CALENDAR = '.bootstrap-datetimepicker-widget';
    const HB_NODE = '4b9883ef-9aad-559a-bd84-e4bb7b94a358';

    // Set by the first test and used by the one after it.
    const meeting = {};

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    before(() => {
        // CI seeds the building in the workflow; locally the spec reseeds the stack it runs against.
        if (!container) return;
        cy.exec(
            `docker exec -e CORAL_ALLOW_TEST_SEED=1 ${container} sh -c ` +
            `"[ -f /web_root/ENV/bin/activate ] && . /web_root/ENV/bin/activate; cd /web_root/coral 2>/dev/null || cd /app; ` +
            `python manage.py seed_test_evaluation_building"`,
            { timeout: 180000, failOnNonZeroExit: true }
        );
    });

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
    };
    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 60000 }).should('contain.text', text);
    const rows = (alias) => cy.get(`.widget-wrapper.${alias} .rr-table-row`, { timeout: 15000 });
    const optionTexts = (alias) => {
        cy.get(`.widget-wrapper.${alias}`).scrollIntoView();
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click({ force: true });
        return cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length.greaterThan', 0)
            .then(($options) => $options.toArray().map((o) => o.textContent.trim()));
    };
    // A single-select dropdown: these options are offered, and a second pick replaces the first.
    const singleSelect = (alias, text, expected) => {
        label(alias, text);
        optionTexts(alias).then((texts) => expect(texts).to.include.members(expected));
        cy.get(REAL_OPTIONS).contains(expected[0]).click({ force: true });
        cy.pickCardOption(alias, expected[1]);
        cy.get(`.widget-wrapper.${alias} .select2-selection__rendered`).first()
            .should(($selection) => expect($selection.text().replace('×', '').trim()).to.equal(expected[1]));
    };
    // A people picker: several people, none twice.
    const people = (alias, text) => {
        label(alias, text);
        cy.pickRelationshipSearch(text, 'Test Person');
        cy.pickRelationshipSearch(text, 'Another Person');
        rows(alias).should('have.length', 2);
        // A picked person is greyed out, so it cannot be added twice.
        cy.openRelationship(text);
        cy.select2Search('Test Person');
        cy.contains('.select2-results__option', 'Test Person').should('have.attr', 'aria-disabled', 'true');
        cy.get('.select2-search__field:visible').first().type('{esc}');
        rows(alias).should('have.length', 2);
    };
    const checkDate = (alias, text) => {
        label(alias, text);
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', '').click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get('.workflow-nav-tab.active').click();
        cy.pickCalendarDay(alias, 1);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', firstOfMonth());
    };

    const openLauncher = () => {
        cy.contains('.workflow-select-card', 'Evaluation Meeting', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
    };
    const pickBuilding = () => {
        cy.get('.select2-selection[aria-label^="Select Building"]', { timeout: 60000 }).first().click();
        cy.select2Search(BUILDING);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(BUILDING).click();
    };

    it('Starts a meeting for a building and fills in every step', function () {
        // Open Workflow: only buildings with an HB number, and the buttons wait for one.
        openLauncher();
        cy.contains('Evaluation Meeting');
        cy.contains('button', 'Start New').should('be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.intercept('GET', '/search/resources*').as('buildings');
        pickBuilding();
        cy.wait('@buildings').its('request.url').then(decodeURIComponent).should('include', HB_NODE);
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.contains('button', 'Start New').should('be.enabled').click();

        // Start Meeting: a locked EVM reference, the later tabs locked until it is saved.
        cy.get('[aria-label="Meeting ID"]', { timeout: 90000 }).should('be.disabled')
            .and(($input) => expect($input.val()).to.match(/^EVM\/\d{4}\/\w+$/))
            .invoke('val').then((id) => { meeting.id = id; });
        cy.get('.workflow-nav-tab.disabled').should('have.length', 3);
        cy.contains('button', 'Save and Continue').click();

        // Details
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Details');
        label('listing_query', 'LQ');
        cy.typeInCard('listing_query', 'LQ-TEST-1');
        // The checklist's Existing Grade list moved to the Evaluation step's grade panel in v8.
        singleSelect('evaluation_meeting_type', 'Meeting Type', ['Scoping Evaluation', 'Listing Query']);
        singleSelect('full_survey_requirement_type', 'Full Survey', ['Needed', 'Not Needed']);
        checkDate('log_date', 'Meeting Date');
        people('cwt_area_supervisor', 'CWT Area Supervisor');
        people('archaeologist', 'Archaeologist');
        people('cwt_area_manager', 'CWT Area Manager');
        people('historian', 'Historian Present');
        people('architect', 'Architect Present');
        people('hed_staff_value', 'HED Staff');
        label('consultation_description', 'Reason');
        cy.typeRichText('consultation_description', 'Test evaluation reason');
        footer({ save: true });
        cy.contains('button', 'Save and Continue').click();

        // Location Details: the building's address, read-only in v8.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Location Details');
        ['Building Name', 'Street', 'Town or City', 'County', 'Postcode', 'Townland']
            .forEach((text) => cy.contains(text, { timeout: 60000 }));
        footer({ next: true });
        cy.workflowNext();

        // Evaluation
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Evaluation');
        cy.contains('span', 'Exisiting Grade', { timeout: 60000 }).next().should('not.have.text', 'Loading...');
        label('proposed_grade_type', 'Proposed Grade');
        cy.pickCardOption('proposed_grade_type', 0);
        singleSelect('har_consideration', 'HAR for Consideration', ['No', 'Yes']);
        singleSelect('propose_type', 'Propose', ['N/A', 'Delist', 'New Listing']);
        singleSelect('enforcement_type', 'Enforcement', ['Minor', 'Major', 'Delist']);
        label('description', 'Notes');
        cy.typeRichText('description', 'Test evaluation notes');
        checkDate('follow_up_meeting_date_value', 'Follow Up Meeting Date');
        people('senior_conservation_architect', 'Senior Conservation Architect');

        cy.get(FOOTER).find('button:not([disabled])').contains(/^\s*Save\s*$/).click();
        cy.get(FOOTER, { timeout: 30000 }).should('not.contain.text', 'Save');
        cy.contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });

    it('Lists the meeting under its building and reopens it', function () {
        openLauncher();
        cy.intercept('GET', '/search/resources?paging-filter=*58a2b98f-a255-11e9-9a30-00224800b26d*').as('meetings');
        pickBuilding();
        // The launcher reads every page of meetings before it fills the list.
        cy.wait('@meetings');
        cy.wait(3000);
        cy.then(() => {
            cy.get('.select2-selection[aria-label^="Selected Evaluation Meeting"]', { timeout: 30000 }).first().click();
            cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(meeting.id).click();
        });
        cy.contains('button', 'Open Selected').should('be.enabled').click();
        cy.then(() => cy.get('[aria-label="Meeting ID"]', { timeout: 90000 }).should('have.value', meeting.id));
        cy.get('.workflow-nav-tab').contains('Details').click();
        cy.get('.widget-wrapper.listing_query input.form-control', { timeout: 60000 }).should('have.value', 'LQ-TEST-1');
        rows('hed_staff_value').should('have.length', 2);
    });
});
