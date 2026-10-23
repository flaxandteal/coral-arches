describe('Issue Report workflow', () => {
    const container = Cypress.env('CORAL_CONTAINER');
    const entered = {};
    const SEEDED_REFERENCE = 'ISSUE-TEST-001';
    const SEEDED_CONTACT = 'E2E Issue Contact';

    const options = () => cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .not('.select2-results__message');

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const STEP_BODY = '.tabbed-workflow-step-body';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const FIRST_PERSON = 'Test Person';
    const SECOND_PERSON = 'Another Person';
    const calendar = '.bootstrap-datetimepicker-widget';

    // Which footer buttons are showing. Undo is hidden in every step of this workflow.
    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
        has('Undo', false);
    };

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`).should('contain.text', text);
    const rows = (alias) => cy.get(`.widget-wrapper.${alias} .rr-table-row`, { timeout: 15000 });
    const personRow = (alias, name) => rows(alias).filter(`:contains("${name}")`);
    const choices = (alias) => cy.get(`.widget-wrapper.${alias} .select2-selection__choice`);
    const dateInput = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).first();

    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));

    // Clearing or removing a select2 value can leave its list open over the next widget.
    // The list opens a moment after the click and an Escape sent before it opens is lost, so retry.
    const closeDropdown = (attemptsLeft = 5) => {
        cy.wait(400);
        cy.get('body').then(($body) => {
            if (!$body.find('.select2-dropdown').length) return;
            expect(attemptsLeft, 'select2 list closes').to.be.greaterThan(0);
            cy.get('body').type('{esc}');
            closeDropdown(attemptsLeft - 1);
        });
        cy.document().then((doc) => doc.activeElement?.blur());
    };

    const openList = (alias) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        return cy.get(REAL_OPTIONS, { timeout: 15000 });
    };

    // The list holds exactly these options.
    const hasOptions = (alias, expected) => {
        openList(alias).should('have.length', expected.length).then(($options) => {
            expect([...$options].map((option) => option.textContent.trim())).to.have.members(expected);
        });
        closeDropdown();
    };

    // Multi-value picker: the list offers both, picking adds, each choice has an x, removing all
    // goes back to the untouched footer. Leaves the field empty.
    const checkMultiPicker = (alias, text, first, second) => {
        label(alias, text);
        openList(alias).contains(first);
        cy.get(REAL_OPTIONS).contains(second);
        closeDropdown();
        cy.pickCardOption(alias, first);
        choices(alias).should('have.length', 1).and('contain.text', first)
            .find('.select2-selection__choice__remove').should('exist');
        footer({ save: true });
        cy.pickCardOption(alias, second);
        choices(alias).should('have.length', 2);
        choices(alias).last().find('.select2-selection__choice__remove').click();
        closeDropdown();
        choices(alias).should('have.length', 1);
        choices(alias).first().find('.select2-selection__choice__remove').click();
        closeDropdown();
        choices(alias).should('have.length', 0);
        footer({ next: true });
    };

    const fillMultiPicker = (alias, first, second) => {
        cy.pickCardOption(alias, first);
        cy.pickCardOption(alias, second);
        choices(alias).should('have.length', 2);
    };

    // Resource picker: lists people, a picked person gets a row with delete and info (no edit),
    // info opens a summary that Return leaves, a second pick adds, rows can be removed.
    // `base` is how many rows the workflow prefilled; the field is left as it started.
    const checkPersonPicker = (alias, text, base = 0) => {
        label(alias, text);
        cy.openRelationship(text);
        closeDropdown();
        cy.pickCardOption(alias, FIRST_PERSON);
        rows(alias).should('have.length', base + 1);
        personRow(alias, FIRST_PERSON).find('.rr-table-instance-label .fa-user').should('exist');
        // Delete and info only: this version has no edit button on a picked row.
        personRow(alias, FIRST_PERSON).find('button').should('have.length', 2);
        personRow(alias, FIRST_PERSON).find('button:has(.fa-info-circle)').click();
        // The summary keeps loading related resources under a mask, so the button is clicked through it.
        cy.contains('button', 'Return', { timeout: 30000 }).click({ force: true });
        cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('exist');
        rows(alias).should('have.length', base + 1);
        if (base === 0) footer({ save: true });
        cy.pickCardOption(alias, SECOND_PERSON);
        rows(alias).should('have.length', base + 2);
        personRow(alias, SECOND_PERSON).find('button:has(.fa-trash)').click();
        personRow(alias, FIRST_PERSON).find('button:has(.fa-trash)').click();
        if (base === 0) {
            rows(alias).should('not.exist');
            footer({ next: true });
        } else {
            rows(alias).should('have.length', base);
        }
    };

    const today = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    };

    // Empty by default; opening the calendar fills today and leaving it closes the calendar.
    const todayOnOpen = (alias, elsewhere, footerShows = () => footer({ save: true })) => {
        cy.scrollToWidget(alias);
        dateInput(alias).should('have.value', '');
        dateInput(alias).click({ force: true });
        cy.get(`${calendar}:visible`).should('exist');
        dateInput(alias).should('have.value', today());
        cy.get(`.widget-wrapper.${elsewhere}`).click({ force: true, position: 'topLeft' });
        notShown(calendar);
        footerShows();
    };

    // Clear button, or deleting the text, empties the date and the footer reverts.
    const clearDateButton = (alias) => {
        cy.get(`.widget-wrapper.${alias}`).contains('button', 'Clear').click();
        dateInput(alias).should('have.value', '');
        footer({ next: true });
    };
    const clearDateByDelete = (alias) => {
        dateInput(alias).type('{selectall}{backspace}', { force: true });
        dateInput(alias).should('have.value', '').blur({ force: true });
        footer({ next: true });
    };

    // The editor builds after the step renders; the 4s default is too short for the first one.
    const richTextReady = (alias) => cy.window({ timeout: 60000 }).should((win) => {
        const ready = Object.values(win.CKEDITOR?.instances ?? {}).some((inst) =>
            inst.status === 'ready' && inst.container?.$?.closest(`.widget-wrapper.${alias}`));
        expect(ready, `editor ready in ${alias}`).to.equal(true);
    });

    // Rich text starts empty, typing offers Save, emptying it again goes back to Next.
    const checkRichText = (alias, text) => {
        label(alias, text);
        richTextReady(alias);
        cy.richTextValue(alias).should('match', /^\s*$/);
        cy.typeRichText(alias, 'abc');
        footer({ save: true });
        cy.typeRichText(alias, '');
        footer({ next: true });
    };

    before(() => {
        // CI seeds the record in the workflow; locally the spec reseeds the stack it runs against.
        if (!container) return;
        // `python`/manage.py only run from this container's venv, and the seed
        // guard refuses to run without CORAL_ALLOW_TEST_SEED set.
        cy.exec(
            `docker exec -e CORAL_ALLOW_TEST_SEED=1 ${container} sh -c ` +
            `"[ -f /web_root/ENV/bin/activate ] && . /web_root/ENV/bin/activate; cd /web_root/coral 2>/dev/null || cd /app; ` +
            `python manage.py seed_test_issue_report --reset"`,
            { timeout: 180000, failOnNonZeroExit: true }
        );
    });

    beforeEach(() => {
        // Cypress's `:visible` filter treats an element outside a scrolled
        // container's clipped bounds as not visible, even after
        // scrollIntoView() -- the default 1000x660 viewport clips widgets
        // further down Record of the Issue, so widen it instead.
        cy.viewport(1400, 1000);
        cy.login();
        cy.watchTileSaves();
    });

    describe('Launcher', () => {
        it('gates Start New/Open Selected on a single Heritage Asset selection', () => {
            cy.visit('/plugins/init-workflow', { timeout: 180000 });
            cy.contains('Issue Report', { timeout: 60000 }).click();

            cy.contains('.btn', 'Start New').should('be.disabled');
            cy.contains('.btn', 'Open Selected').should('be.disabled');
            cy.contains('Selected Issue Report').should('be.visible');
            cy.contains('Please select a Heritage Asset').should('be.visible');
            cy.contains('Select an Issue Report or start new').should('be.visible');
            cy.contains('Clear Recents').should('not.exist');
            cy.get('.select2-selection[aria-label^="Selected Issue Report,"]').click();
            options().should('have.length', 0);
            cy.get('body').type('{esc}');

            cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]', { timeout: 60000 }).click();
            cy.select2Search('HA/03');
            options().contains('HA/03').click();

            cy.contains('.btn', 'Start New').should('not.be.disabled');
            cy.contains('.btn', 'Open Selected').should('be.disabled');
            cy.get('.select2-selection__rendered').first().find('li, .select2-selection__clear').should('have.length', 1);

            // The combobox's aria-label is only present while empty, so target
            // it by position once a value is already selected.
            cy.get('.select2-selection').first().click();
            cy.select2Search('HB12/09/013');
            options().contains('HB12/09/013').click();
            cy.get('.select2-selection__rendered').first()
                .should('contain.text', 'HB12/09/013')
                .should('not.contain.text', 'HA/03');

            cy.get('.select2-selection__clear').first().click({ force: true });
            cy.contains('.btn', 'Start New').should('be.disabled');
        });
    });

    const startNewReport = () => {
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
        cy.contains('Issue Report', { timeout: 60000 }).click();
        cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]', { timeout: 60000 }).click();
        cy.select2Search('HA/03');
        options().contains('HA/03').click();
        cy.contains('.btn', 'Start New').click();
        cy.get('.tabbed-workflow-footer-button-container', { timeout: 150000 }).should('exist');
    };

    const openReport = (reference) => {
        cy.intercept('GET', '**/tiles?nodeid=b075893b-848d-5520-9d52-3c3dfbecde16').as('issueReports');
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
        cy.contains('Issue Report', { timeout: 60000 }).click();
        cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]', { timeout: 60000 }).click();
        cy.select2Search('HA/03');
        options().contains('HA/03').click();
        cy.wait('@issueReports');
        cy.wait(500);
        cy.pickDomainByLabel('Selected Issue Report', reference);
        cy.contains('.btn', 'Open Selected').should('not.be.disabled').click();
        cy.get('.tabbed-workflow-footer-button-container', { timeout: 150000 }).should('exist');
    };

    describe('Start New and fill the workflow', () => {
        it('walks Initial Step through Sign Off and completes the workflow', () => {
            startNewReport();

            cy.get('.workflow-nav-tab.active').should('contain.text', 'Initial step');
            cy.get('.widget-wrapper.resourceid', { timeout: 60000 }).should('exist');
            label('resourceid', 'HA Number');
            cy.get('[aria-label="HA Number"]').should('be.disabled').should('have.value', 'HA/03');
            footer({ previous: false, next: true });
            cy.workflowNext();

            // Issue Reference: the reference is generated into a locked input.
            cy.get('[aria-label="Reference Number"]', { timeout: 60000 })
                .should('be.disabled')
                .invoke('val')
                .should('match', /^INC\/\d{4}\/[A-Za-z0-9]{6}$/)
                .then((value) => { entered.reference = value; });
            cy.location('search').then((search) => { entered.resourceId = new URLSearchParams(search).get('resource-id'); });
            label('reference_number', 'Reference Number');
            footer({ save: true });
            // Later steps stay locked until the reference is saved.
            cy.get('.workflow-nav-tab').contains('Record of the Issue').closest('.workflow-nav-tab').should('have.class', 'disabled');
            cy.workflowNext();

            // Record of the Issue
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            footer({ next: true });
            label('monument_name', 'Name');
            cy.get('[aria-label="Name"]').should('be.disabled').should('have.value', 'Testing');
            label('cm_reference_n1', 'CM Reference');
            cy.get('.widget-wrapper.cm_reference_n1 input').first().should('be.disabled');
            checkRichText('issue_note', 'Notes');
            checkMultiPicker('damage_type', 'Damage Type', 'Arable Clipping', 'Forestry');
            checkMultiPicker('material_fabric_damage_type', 'Material/Fabric Damage Type', 'Bone', 'Clay');
            checkMultiPicker('component_damage_type', 'Component Damage Type', 'Apse Chapel', 'Chantry Chapel');
            checkPersonPicker('issue_identifier', 'Issue Identified By');
            checkPersonPicker('area_archaeologist', 'Area Archaeologist(s)');
            checkPersonPicker('cwt_area_supervisor', 'CWT Area Supervisor(s)');
            // Field Worker(s), Occupier(s) and Owner(s) start with the heritage asset's contact.
            checkPersonPicker('field_worker', 'Field Worker(s)', 1);
            checkPersonPicker('occupier', 'Occupier(s)', 1);
            checkPersonPicker('owner', 'Owner(s)', 1);
            cy.get('.widget-wrapper.occupier').contains(SEEDED_CONTACT);
            cy.get('.widget-wrapper.owner').contains(SEEDED_CONTACT);

            fillMultiPicker('damage_type', 'Arable Clipping', 'Forestry');
            entered.damageType = 'Arable Clipping';
            fillMultiPicker('material_fabric_damage_type', 'Bone', 'Clay');
            entered.materialFabricDamageType = 'Bone';
            fillMultiPicker('component_damage_type', 'Apse Chapel', 'Chantry Chapel');
            entered.componentDamageType = 'Apse Chapel';
            cy.typeRichText('issue_note', 'Cypress issue note.');
            entered.notes = 'Cypress issue note.';
            ['issue_identifier', 'area_archaeologist', 'cwt_area_supervisor'].forEach((alias) =>
                cy.pickCardOption(alias, FIRST_PERSON));
            entered.issueIdentifiedBy = FIRST_PERSON;
            entered.areaArchaeologist = FIRST_PERSON;
            entered.cwtAreaSupervisor = FIRST_PERSON;
            cy.pickCardOption('field_worker', FIRST_PERSON);
            cy.pickCardOption('field_worker', SECOND_PERSON);
            rows('field_worker').should('have.length', 3);
            entered.fieldWorker = FIRST_PERSON;
            cy.pickCardOption('owner', FIRST_PERSON);
            rows('owner').should('have.length', 2);
            entered.occupier = SEEDED_CONTACT;
            entered.owner = SEEDED_CONTACT;
            footer({ save: true });

            cy.waitForTileSaves(1);
            cy.workflowNext();

            // Location details: the heritage asset's address is shown locked.
            cy.get('.widget-wrapper.building_name_value', { timeout: 60000 }).should('exist');
            footer({ next: true });
            cy.get('.fa-question-circle').first().click({ force: true });
            cy.contains('.card-help-panel:visible', 'Addresses', { timeout: 15000 })
                .find('.help-close').click({ force: true });
            label('building_name_value', 'Building Name');
            cy.get('.widget-wrapper.building_name_value input').should('be.disabled');
            label('street_value', 'Street');
            cy.get('.widget-wrapper.street_value input').should('be.disabled').and('not.have.value', '');
            label('town_or_city_value', 'Town or City');
            cy.get('.widget-wrapper.town_or_city_value input').should('be.disabled').and('not.have.value', '');
            label('postcode_value', 'Postcode');
            cy.get('.widget-wrapper.postcode_value input').should('be.disabled').and('not.have.value', '');
            label('county_value', 'County');
            cy.get('.widget-wrapper.county_value .select2-container').should('have.class', 'select2-container--disabled');
            cy.get('.widget-wrapper.county_value .select2-selection__clear').should('exist');
            cy.get('.widget-wrapper.county_value .select2-selection__rendered').invoke('text').should('match', /\w/);
            label('townland', 'Townland');
            cy.get('.widget-wrapper.townland .select2-selection__choice').should('have.length', 1);
            label('area_type', 'Area Type');
            cy.get('.widget-wrapper.area_type .select2-container').should('have.class', 'select2-container--disabled');
            ['Irish Grid Reference (TM65)', 'Select A Format', 'Alphanumeric TM65'].forEach((text) =>
                cy.get(STEP_BODY).should(($body) => expect($body.text().replace(/\s+/g, ' ')).to.include(text)));
            cy.get('input[placeholder="Enter the centre point map reference of the resource."]').should('be.disabled');
            label('location_description', 'Location Description');
            richTextReady('location_description');
            entered.locationDescription = `Cypress location description ${Date.now()}`;
            cy.typeRichText('location_description', entered.locationDescription);
            footer({ save: true });
            cy.waitForTileSaves(1);
            cy.workflowNext();

            // Map: the sidebar offers Basemap, Overlays and Legend, with no edit panel.
            cy.get('.mapboxgl-canvas', { timeout: 60000 }).should('be.visible');
            label('geospatial_coordinates', 'Geospatial Coordinates');
            cy.get('.workbench-card-sidebar').should('contain.text', 'Basemap')
                .and('contain.text', 'Overlays').and('contain.text', 'Legend').and('not.contain.text', 'Edit');
            cy.get('.workbench-card-sidebar-tab').contains('Basemap').click();
            ['Dark', 'Light', 'Open Street Map'].forEach((style) =>
                cy.get('.basemap-listing-container').should('contain.text', style));
            // Excluded: the style change, zoom, feature and overlay features are drawn on the canvas and cannot be read from the DOM.
            cy.get('.workbench-card-sidebar-tab').contains('Overlays').click();
            cy.get('.overlays-listing-container').should('contain.text', 'Heritage Asset - Geospatial Coordinates');
            cy.get('.workbench-card-sidebar-tab').contains('Legend').click();
            cy.get('.workbench-card-sidepanel-header').should('contain.text', 'Legend');
            cy.get('.legend-listing-container').should('contain.text', 'Heritage Asset - Geospatial Coordinates');
            label('feature_shape', 'Feature Shape');
            hasOptions('feature_shape', ['Approx', 'Archaeological Event', 'Area', 'Dispersed Event', 'Linear', 'Locality', 'Named Loc', 'Point', 'Unknown']);
            cy.pickCardOption('feature_shape', 'Dispersed Event');
            cy.get('.widget-wrapper.feature_shape .select2-selection__rendered')
                .should('contain.text', 'Dispersed Event').and('not.contain.text', 'Area');
            cy.get('.widget-wrapper.feature_shape .select2-selection__clear').should('exist');
            footer({ next: true });
            cy.workflowNext();

            // Work Proposed
            cy.get('.widget-wrapper.action_type', { timeout: 60000 }).should('exist');
            footer({ next: true });
            label('contact_details_value', 'Contact Details');
            cy.get('.widget-wrapper.contact_details_value input').first().type('abc', { force: true });
            footer({ save: true });
            cy.get('.widget-wrapper.contact_details_value input').first().clear({ force: true });
            footer({ next: true });
            label('intended_start_date', 'Intended Start Date');
            todayOnOpen('intended_start_date', 'action_type');
            clearDateButton('intended_start_date');
            label('intended_end_date', 'Intended End Date');
            todayOnOpen('intended_end_date', 'action_type');
            clearDateByDelete('intended_end_date');
            label('proposal_date_value', 'Proposal Date');
            todayOnOpen('proposal_date_value', 'action_type');
            clearDateButton('proposal_date_value');
            checkRichText('proposal_text_n1', 'Notes');
            // Approved By is the logged-in user's sign-off, and admin has no Person to sign with.
            cy.get(STEP_BODY).should('contain.text', 'Approved By').and('contain.text', 'You do not have permission to sign off');
            label('action_type', 'Action Type');
            hasOptions('action_type', ['Resolve with Owner', 'Resolve with Occupier', 'Refer to Enforcement', 'Contact PSNI']);
            checkMultiPicker('action_type', 'Action Type', 'Resolve with Owner', 'Contact PSNI');
            label('work_carried_out_by_value', 'Work Carried Out By');
            // The graph marks neither Work Carried Out By nor Contact Details required, so no asterisk.
            cy.get('.widget-wrapper.work_carried_out_by_value .widget-label-required').should('not.exist');
            cy.get('.widget-wrapper.contact_details_value .widget-label-required').should('not.exist');

            fillMultiPicker('action_type', 'Resolve with Owner', 'Contact PSNI');
            entered.actionType = 'Resolve with Owner';
            cy.pickCardOption('work_carried_out_by_value');
            entered.workCarriedOutBy = true;
            cy.get('.widget-wrapper.contact_details_value input').first().type('Cypress contact details', { force: true });
            entered.contactDetails = 'Cypress contact details';
            cy.fillDate('intended_start_date');
            entered.intendedStartDate = true;
            cy.fillDate('intended_end_date');
            entered.intendedEndDate = true;
            cy.fillDate('proposal_date_value');
            cy.typeRichText('proposal_text_n1', 'Cypress work proposed note.');
            entered.proposalNotes = 'Cypress work proposed note.';
            footer({ save: true });

            cy.waitForTileSaves(1);
            cy.workflowNext();

            // Documentation: file upload depends on per-environment storage, so it stays out.
            // cy.get('input.dz-hidden-input').selectFile('cypress/fixtures/test-upload.txt', { force: true });
            // cy.contains('test-upload.txt', { timeout: 20000 });
            cy.contains('.bord-top > .btn', 'Select Files', { timeout: 60000 }).should('be.enabled');
            footer({ next: true });
            cy.workflowNext();

            // Sign Off: the last step, so Previous Step and, once something changed, Save.
            cy.get('.widget-wrapper.status_type', { timeout: 60000 }).should('exist');
            const signOffFooter = (save) => {
                cy.get(FOOTER, { timeout: 30000 }).should('contain.text', 'Previous Step').and('not.contain.text', 'Next Step');
                cy.get(FOOTER).should(save ? 'contain.text' : 'not.contain.text', 'Save');
            };
            signOffFooter(false);
            label('status_type', 'Status');
            hasOptions('status_type', ['Enforcement actioned', 'Finished', 'In progress', 'Not completed']);
            cy.pickCardOption('status_type', 'In progress');
            cy.get('.widget-wrapper.status_type .select2-selection__clear').should('exist');
            cy.pickCardOption('status_type', 'Not completed');
            cy.get('.widget-wrapper.status_type .select2-selection__rendered')
                .should('contain.text', 'Not completed').and('not.contain.text', 'In progress');
            signOffFooter(true);
            cy.get('.widget-wrapper.status_type .select2-selection__clear').click();
            closeDropdown();
            cy.get('.widget-wrapper.status_type .select2-selection__placeholder').should('exist');
            signOffFooter(false);
            label('work_finish_date_value', 'Work Finish Date');
            todayOnOpen('work_finish_date_value', 'status_type', () => signOffFooter(true));
            cy.get('.widget-wrapper.work_finish_date_value').contains('button', 'Clear').click();
            dateInput('work_finish_date_value').should('have.value', '');
            signOffFooter(false);
            cy.contains('Signed Off By');
            cy.contains('You do not have permission to sign off');
            label('sign_off_date_value', 'Sign Off Date');
            todayOnOpen('sign_off_date_value', 'status_type', () => signOffFooter(true));
            cy.get('.widget-wrapper.sign_off_date_value').contains('button', 'Clear').click();
            dateInput('sign_off_date_value').should('have.value', '');
            signOffFooter(false);

            cy.pickCardOption('status_type', 'Finished');
            entered.status = 'Finished';
            cy.fillDate('work_finish_date_value');
            entered.workFinishDate = true;
            signOffFooter(true);
            cy.get(FOOTER).contains('button', 'Save').click();
            cy.get('.widget-wrapper.status_type').should('contain.text', 'Finished');
            dateInput('work_finish_date_value').should('not.have.value', '');

            cy.waitForTileSaves(2);
            cy.get('.workflow-top-control').contains(/Save and [Cc]omplete Workflow/).scrollIntoView().click();
            cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
            cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
            cy.get('.workflow-select-card').first().click();
            cy.get('.workflow-nav-tab.active', { timeout: 150000 }).should('contain.text', 'Initial step');
        });
    });

    // These reopen the seeded report directly (not the one the test above
    // creates) so they run whether or not that walkthrough gets to the end.
    describe('Record of the Issue', () => {
        it('Name is disabled', () => {
            openReport(SEEDED_REFERENCE);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('[aria-label="Name"]', { timeout: 30000 }).should('be.disabled');
        });

        it('Issue Identified By accepts more than one person', () => {
            openReport(SEEDED_REFERENCE);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.issue_identifier').scrollIntoView();
            cy.openRelationship('Issue Identified By');
            options().first().click();
            cy.get('.widget-wrapper.issue_identifier').scrollIntoView();
            cy.openRelationship('Issue Identified By');
            options().eq(1).click();
            cy.get('.widget-wrapper.issue_identifier .rr-table-row').should('have.length.greaterThan', 1);
        });

        it('Area Archaeologist accepts more than one person', () => {
            openReport(SEEDED_REFERENCE);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.area_archaeologist').scrollIntoView();
            cy.openRelationship('Area Archaeologist(s)');
            options().first().click();
            cy.get('.widget-wrapper.area_archaeologist').scrollIntoView();
            cy.openRelationship('Area Archaeologist(s)');
            options().eq(1).click();
            cy.get('.widget-wrapper.area_archaeologist .rr-table-row').should('have.length.greaterThan', 1);
        });

        it('CWT Area Supervisor accepts more than one person', () => {
            openReport(SEEDED_REFERENCE);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.cwt_area_supervisor').scrollIntoView();
            cy.openRelationship('CWT Area Supervisor(s)');
            options().first().click();
            cy.get('.widget-wrapper.cwt_area_supervisor').scrollIntoView();
            cy.openRelationship('CWT Area Supervisor(s)');
            options().eq(1).click();
            cy.get('.widget-wrapper.cwt_area_supervisor .rr-table-row').should('have.length.greaterThan', 1);
        });

        it('Occupier accepts more than one person', () => {
            openReport(SEEDED_REFERENCE);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.occupier').scrollIntoView();
            cy.openRelationship('Occupier(s)');
            options().first().click();
            cy.get('.widget-wrapper.occupier').scrollIntoView();
            cy.openRelationship('Occupier(s)');
            options().eq(1).click();
            cy.get('.widget-wrapper.occupier .rr-table-row').should('have.length.greaterThan', 1);
        });
    });

    describe('Work Proposed', () => {
        it('Proposal Date rejects future dates', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Work Proposed').click();
            cy.get('.widget-wrapper.proposal_date_value', { timeout: 30000 }).should('exist');
            cy.fillDate('proposal_date_value', '28-07-2099');
            cy.get('.widget-wrapper.proposal_date_value input.form-control').first()
                .should('not.have.value', '28-07-2099');
        });
    });

    describe('Sign Off', () => {
        it('Work Finish Date rejects future dates', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Sign Off').click();
            cy.get('.widget-wrapper.work_finish_date_value', { timeout: 30000 }).should('exist');
            cy.fillDate('work_finish_date_value', '28-07-2099');
            cy.get('.widget-wrapper.work_finish_date_value input.form-control').first()
                .should('not.have.value', '28-07-2099');
        });

        it('Sign Off Date rejects future dates', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Sign Off').click();
            cy.get('.widget-wrapper.sign_off_date_value', { timeout: 30000 }).should('exist');
            cy.fillDate('sign_off_date_value', '28-07-2099');
            cy.get('.widget-wrapper.sign_off_date_value input.form-control').first()
                .should('not.have.value', '28-07-2099');
        });
    });

    describe('Search', () => {
        it('finds the new Issue Report by its reference', function () {
            if (!entered.reference) { this.skip(); return; }
            const term = [{ context: '', context_label: '', id: `string${entered.reference}`, text: entered.reference,
                type: 'string', value: entered.reference, inverted: false, selected: true }];
            cy.visit(`/search?paging-filter=1&tiles=true&language=*&term-filter=${encodeURIComponent(JSON.stringify(term))}`);
            cy.contains(entered.reference, { timeout: 20000 });
        });

        it('shows the new Issue Report on the report page and the resource editor', function () {
            if (!entered.reference) { this.skip(); return; }
            cy.visit(`/report/${entered.resourceId}`, { timeout: 180000 });
            [entered.reference, entered.notes].forEach((text) => cy.contains(text, { timeout: 60000 }));
            cy.visit(`/resource/${entered.resourceId}`, { timeout: 180000 });
            cy.location('pathname').should('include', '/resource/');
            cy.contains(entered.reference, { timeout: 60000 });
        });
    });

    describe('Open Selected reopens the same report with its values intact', () => {
        it('rehydrates the reference, Record of the Issue, Location, Map, Work Proposed, Documentation and Sign Off', function () {
            if (!entered.reference) { this.skip(); return; }
            cy.reload();
            openReport(entered.reference);

            cy.get('.workflow-nav-tab-container').contains('Issue Reference').click();
            cy.get('[aria-label="Reference Number"]').should('have.value', entered.reference);

            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.damage_type').contains(entered.damageType, { timeout: 30000 });
            cy.get('.widget-wrapper.material_fabric_damage_type').contains(entered.materialFabricDamageType, { timeout: 30000 });
            cy.get('.widget-wrapper.component_damage_type').contains(entered.componentDamageType, { timeout: 30000 });
            cy.get('.widget-wrapper.occupier').contains(entered.occupier, { timeout: 30000 });
            cy.get('.widget-wrapper.owner').contains(entered.owner, { timeout: 30000 });

            cy.get('.widget-wrapper.damage_type .select2-selection__choice').should('have.length', 2);
            cy.richTextValue('issue_note').should('contain', entered.notes);

            cy.get('.workflow-nav-tab-container').contains('Location details').click();
            cy.get('.widget-wrapper.location_description', { timeout: 60000 }).should('exist');
            cy.richTextValue('location_description').should('contain', entered.locationDescription);

            cy.get('.workflow-nav-tab-container').contains('Map').click();
            cy.get('.widget-wrapper.feature_shape .select2-selection__rendered').invoke('text').should('match', /\S/).and('not.contain', 'Select an option');

            cy.get('.workflow-nav-tab-container').contains('Work Proposed').click();
            cy.get('.widget-wrapper.action_type .select2-selection__choice').should('have.length', 2);
            cy.get('.widget-wrapper.action_type').contains(entered.actionType, { timeout: 30000 });
            cy.get('.widget-wrapper.work_carried_out_by_value .rr-table-row', { timeout: 30000 }).should('have.length.greaterThan', 0);
            cy.get('.widget-wrapper.intended_start_date input.form-control').first().should('not.have.value', '');
            cy.get('.widget-wrapper.intended_end_date input.form-control').first().should('not.have.value', '');
            cy.richTextValue('proposal_text_n1').should('contain', entered.proposalNotes);
            cy.get('.widget-wrapper.contact_details_value input').first().should('have.value', entered.contactDetails);

            cy.get('.workflow-nav-tab-container').contains('Sign Off').click();
            cy.get('.widget-wrapper.status_type').contains(entered.status, { timeout: 30000 });
            cy.get('.widget-wrapper.work_finish_date_value input.form-control').first().should('not.have.value', '');
        });

        it('the six contact pickers rehydrate on reopen', function () {
            if (!entered.reference) { this.skip(); return; }
            openReport(entered.reference);
            // Tabs unlock once the reopened report's steps have loaded.
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue', { timeout: 60000 })
                .closest('.workflow-nav-tab', { timeout: 60000 }).should('not.have.class', 'disabled').click();
            cy.get('.widget-wrapper.damage_type', { timeout: 60000 }).should('exist');
            cy.get('.widget-wrapper.issue_identifier').contains(entered.issueIdentifiedBy, { timeout: 30000 });
            cy.get('.widget-wrapper.area_archaeologist').contains(entered.areaArchaeologist, { timeout: 30000 });
            cy.get('.widget-wrapper.cwt_area_supervisor').contains(entered.cwtAreaSupervisor, { timeout: 30000 });
            cy.get('.widget-wrapper.field_worker').contains(entered.fieldWorker, { timeout: 30000 });
        });
    });
});
