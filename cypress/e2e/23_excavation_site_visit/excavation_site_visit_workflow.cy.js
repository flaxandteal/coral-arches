describe('Going through the Excavation Site Visit Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // Seeded by seed_test_licence: a granted licence and the details its panel shows.
    const LICENCE = 'LIC-TEST-001';
    const LICENCE_DETAILS = [['Licence Number', LICENCE], ['Site Name', 'Test Excavation Site'],
        ['CM Number', 'CM-TEST-LIC'], ['Licensee(s)', 'Test Person']];

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const MANY_BUTTONS = '.btn-workflow-tile';
    const TILE_CARDS = '.wf-multi-tile-step-card';
    const CALENDAR = '.bootstrap-datetimepicker-widget';

    // Set by the first test and used by the ones after it.
    const visit = {};

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const todayString = () => `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    const onlyPrevious = () => cy.get(FOOTER, { timeout: 30000 })
        .should('contain.text', 'Previous Step').and('not.contain.text', 'Save').and('not.contain.text', 'Next Step');
    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('contain.text', text);
    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));
    const manyButton = (text) => cy.contains(MANY_BUTTONS, text);
    const entries = () => cy.get(TILE_CARDS);
    // A new selection reaches the tile a moment after select2 shows it; Add straight away keeps the old value.
    const addEntry = () => {
        cy.wait(2000);
        manyButton('Add').should('not.have.class', 'disabled').click();
    };

    // A Yes/No radio: both options offered, and picking one leaves only that one checked.
    const yesNo = (alias, text) => {
        label(alias, text);
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} label[role="radio"]`).filter(':visible')
            .should('have.length', 2).and('contain.text', 'Yes').and('contain.text', 'No');
        cy.get(`.widget-wrapper.${alias} label[role="radio"]`).filter(':visible').contains('No').click({ force: true });
        cy.get(`.widget-wrapper.${alias} label[role="radio"]`).filter(':visible').contains('Yes').click({ force: true });
        cy.get(`.widget-wrapper.${alias} label[aria-checked="true"]`).should('have.length', 1).and('contain.text', 'Yes');
    };

    const openLauncher = () => {
        cy.contains('.workflow-select-card', 'Excavation Site Visit', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
    };
    const pickLicence = () => {
        cy.get('.select2-selection[aria-label^="Select Licence"]', { timeout: 60000 }).first().click();
        cy.select2Search(LICENCE);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(LICENCE).click();
    };

    it('Start new and go through the workflow and populate all fields', function () {
        // Open Workflow: no recently opened panel, both buttons wait for a licence.
        openLauncher();
        cy.contains('Recently opened').should('not.exist');
        cy.get('.select2-selection[aria-label^="Select Licence"]').should('contain.text', 'Please select the Licence');
        cy.contains('button', 'Start New').should('be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');

        pickLicence();
        cy.get('.select2-selection[aria-label^="Select Licence"]').first()
            .should('contain.text', LICENCE).find('.select2-selection__clear').should('exist');
        cy.contains('button', 'Start New').should('be.enabled');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.get('.select2-selection[aria-label^="Select Licence"] .select2-selection__clear').first().click();
        // Clearing opens the dropdown; click away so the next pick opens it afresh.
        cy.contains('h4', 'Excavation Site Visit').click();
        notShown('.select2-dropdown');
        cy.get('.select2-selection[aria-label^="Select Licence"]').first().should('not.contain.text', LICENCE);
        cy.contains('button', 'Start New').should('be.disabled');

        pickLicence();
        cy.contains('button', 'Start New').click();

        // Initial step: a locked ESV reference.
        label('resourceid', 'ResourceID');
        cy.get('[aria-label="ResourceID"]', { timeout: 90000 }).should('be.disabled')
            .and(($input) => expect($input.val()).to.match(/^ESV/))
            .invoke('val').then((id) => { visit.id = id; });
        cy.contains('button', 'Save and Continue').click();

        // Site Visit
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Site Visit');
        onlyPrevious();

        label('start_date', 'Start Date');
        cy.scrollToWidget('start_date');
        cy.get('.widget-wrapper.start_date input.form-control').first().should('have.value', '').click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get('.workflow-nav-tab.active').click();
        notShown(CALENDAR);
        cy.get('.widget-wrapper.start_date input.form-control').first().should('have.value', todayString());
        cy.get('.widget-wrapper.start_date').contains('button', 'Clear').click();
        cy.get('.widget-wrapper.start_date input.form-control').first().should('have.value', '');
        onlyPrevious();
        cy.pickCalendarDay('start_date', 1);
        cy.get('.widget-wrapper.start_date input.form-control').first().should('have.value', firstOfMonth());
        notShown('.widget-wrapper.end_date');

        // The selected licence's details, read-only.
        LICENCE_DETAILS.forEach(([name, value]) => cy.contains('span', name).next().should('have.text', value));

        // HED Inspector: people only, and several of them.
        label('actor', 'HED Inspector');
        cy.pickRelationshipSearch('HED Inspector', 'Test Person');
        cy.pickRelationshipSearch('HED Inspector', 'Another Person');
        cy.get('.widget-wrapper.actor .rr-table-row').should('have.length', 2)
            .and('contain.text', 'Test Person').and('contain.text', 'Another Person');

        yesNo('licence_holder_present', 'Licence Holder Present');
        notShown('.widget-wrapper.hed_inspector_present');

        // Descriptions: both fields are needed before Add.
        cy.contains('.wf-step-multi-tile-container h4', 'Site Visit');
        entries().should('not.exist');
        label('description_type', 'Description Type');
        cy.get('.widget-wrapper.description_type').scrollIntoView();
        cy.get('.widget-wrapper.description_type .select2-selection').first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).then(($options) =>
            expect($options.toArray().map((o) => o.textContent.trim())).to.deep.equal(['Archives', 'Finds', 'General', 'Survey Methods']));
        cy.get(REAL_OPTIONS).contains('General').click();
        manyButton('Add').should('have.class', 'disabled');
        cy.get('.widget-wrapper.description_type .select2-selection__clear').click();
        cy.get('.workflow-nav-tab.active').click();
        notShown('.select2-dropdown');
        cy.typeRichText('activity_description', 'Test general description');
        manyButton('Add').should('have.class', 'disabled');
        cy.pickCardOption('description_type', 'General');
        addEntry();
        ['Finds', 'Archives', 'Survey Methods'].forEach((type) => {
            cy.pickCardOption('description_type', type);
            cy.typeRichText('activity_description', `Test ${type.toLowerCase()} description`);
            addEntry();
        });
        entries().should('have.length', 4);

        // Editing loads the entry back into the inputs. The checklist wants Save alone; v8 keeps Clear beside it.
        entries().last().contains('Edit').click();
        manyButton('Save').should('exist');
        manyButton('Clear').should('exist');
        manyButton('Add').should('not.exist');
        cy.typeRichText('activity_description', 'Changed general description');
        cy.wait(2000);
        manyButton('Save').click();
        entries().should('have.length', 4);
        entries().last().should('contain.text', 'Changed general description');

        label('potential_date_of_remains_value', 'Potential Date of Remains');
        cy.get('.widget-wrapper.potential_date_of_remains_value input.form-control').type('Bronze Age');
        yesNo('finds', 'Finds');
        label('stored_at', 'Stored at');
        cy.get('.widget-wrapper.stored_at input.form-control').type('Test storage location');
        yesNo('archive', 'Archive');
        yesNo('standards_met', 'Standards Met');
        yesNo('survey_methods_discussed_', 'Survey Methods Discussed');
        yesNo('are_they_adequate', 'Are They Adequate');

        // Last step: a plain Save that keeps you here.
        cy.get(FOOTER).should('not.contain.text', 'Save and Continue');
        cy.get(FOOTER).find('button:not([disabled])').contains(/^\s*Save\s*$/).click();
        onlyPrevious();
        cy.get('.workflow-nav-tab.active').should('contain.text', 'Site Visit');

        cy.contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });

    it('Lists the site visit under its licence and reopens it', function () {
        openLauncher();
        cy.intercept('GET', '/search/resources?paging-filter=*ea059ab7-83d7-11ea-a3c4-f875a44e0e11*').as('visits');
        pickLicence();
        cy.wait('@visits');
        cy.wait(3000);
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.then(() => {
            cy.get('.select2-selection[aria-label^="Selected"]', { timeout: 30000 }).first().click();
            cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(visit.id).click();
        });
        cy.contains('button', 'Open Selected').should('be.enabled').click();

        cy.then(() => cy.get('[aria-label="ResourceID"]', { timeout: 90000 }).should('have.value', visit.id));
        cy.get('.workflow-nav-tab').contains('Site Visit').click();
        LICENCE_DETAILS.forEach(([name, value]) => cy.contains('span', name, { timeout: 60000 }).next().should('have.text', value));
        cy.get('.widget-wrapper.stored_at input.form-control').should('have.value', 'Test storage location');
        entries().should('have.length', 4);
    });
});
