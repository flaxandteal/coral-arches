describe('Issue Report workflow', () => {
    const container = Cypress.env('CORAL_CONTAINER') || 'coral-arches-1';
    const entered = {};
    const SEEDED_REFERENCE = 'ISSUE-TEST-001';
    const SEEDED_CONTACT = 'E2E Issue Contact';

    const options = () => cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .not('.select2-results__message');

    before(() => {
        // `python`/manage.py only run from this container's venv, and the seed
        // guard refuses to run without CORAL_ALLOW_TEST_SEED set.
        cy.exec(
            `docker exec -e CORAL_ALLOW_TEST_SEED=1 ${container} sh -c ` +
            `". /web_root/ENV/bin/activate && cd /web_root/coral && ` +
            `python manage.py seed_test_issue_report --reset"`,
            { timeout: 60000, failOnNonZeroExit: true }
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
            cy.visit('/plugins/init-workflow');
            cy.contains('Issue Report').click();

            cy.contains('.btn', 'Start New').should('be.disabled');
            cy.contains('.btn', 'Open Selected').should('be.disabled');
            cy.get('.select2-selection[aria-label^="Selected Issue Report,"]').click();
            options().should('have.length', 0);
            cy.get('body').type('{esc}');

            cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]').click();
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
        cy.visit('/plugins/init-workflow');
        cy.contains('Issue Report').click();
        cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]').click();
        cy.select2Search('HA/03');
        options().contains('HA/03').click();
        cy.contains('.btn', 'Start New').click();
        cy.get('.tabbed-workflow-footer-button-container', { timeout: 150000 }).should('exist');
    };

    const openReport = (reference) => {
        cy.intercept('GET', '**/tiles?nodeid=b075893b-848d-5520-9d52-3c3dfbecde16').as('issueReports');
        cy.visit('/plugins/init-workflow');
        cy.contains('Issue Report').click();
        cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]').click();
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

            cy.contains('.workflow-nav-tab-container', 'Initial step');
            cy.get('[aria-label="HA Number"]').should('be.disabled').should('have.value', 'HA/03');
            cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').should('not.be.disabled');
            cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('not.exist');
            cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

            cy.get('[aria-label="Reference Number"]', { timeout: 20000 })
                .should('be.disabled')
                .invoke('val')
                .should('match', /^INC\/\d{4}\/[A-Za-z0-9]{6}$/)
                .then((value) => { entered.reference = value; });
            cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
            cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue');
            cy.workflowNext();

            cy.get('.widget-wrapper.damage_type .widget-input-label').contains('Damage Type');
            cy.pickCardOption('damage_type', 'Arable Clipping');
            entered.damageType = 'Arable Clipping';
            cy.get('.widget-wrapper.damage_type .select2-selection__choice').should('have.length', 1);
            cy.pickCardOption('damage_type', 'Forestry');
            cy.get('.widget-wrapper.damage_type .select2-selection__choice').should('have.length', 2);

            cy.get('.widget-wrapper.material_fabric_damage_type .widget-input-label').contains('Material/Fabric Damage Type');
            cy.pickCardOption('material_fabric_damage_type', 'Bone');
            entered.materialFabricDamageType = 'Bone';

            cy.get('.widget-wrapper.component_damage_type .widget-input-label').contains('Component Damage Type');
            cy.pickCardOption('component_damage_type', 'Apse Chapel');
            entered.componentDamageType = 'Apse Chapel';

            cy.typeRichText('issue_note', 'Cypress issue note.');
            entered.notes = 'Cypress issue note.';

            cy.get('.widget-wrapper.issue_identifier').scrollIntoView();
            cy.openRelationship('Issue Identified By');
            options().first().invoke('text').then((name) => { entered.issueIdentifiedBy = name.trim(); });
            options().first().click();

            cy.get('.widget-wrapper.area_archaeologist').scrollIntoView();
            cy.openRelationship('Area Archaeologist(s)');
            options().first().invoke('text').then((name) => { entered.areaArchaeologist = name.trim(); });
            options().first().click();

            cy.get('.widget-wrapper.cwt_area_supervisor').scrollIntoView();
            cy.openRelationship('CWT Area Supervisor(s)');
            options().first().invoke('text').then((name) => { entered.cwtAreaSupervisor = name.trim(); });
            options().first().click();

            cy.get('.widget-wrapper.field_worker').scrollIntoView();
            cy.openRelationship('Field Worker(s)');
            options().first().invoke('text').then((name) => { entered.fieldWorker = name.trim(); });
            options().first().click();
            cy.get('.widget-wrapper.field_worker').scrollIntoView();
            cy.openRelationship('Field Worker(s)');
            options().eq(1).click();
            cy.get('.widget-wrapper.field_worker .rr-table-row').should('have.length.greaterThan', 1);

            // Occupier and Owner are prefilled from the HA's Contacts tile.
            cy.get('.widget-wrapper.occupier').contains(SEEDED_CONTACT);
            cy.get('.widget-wrapper.owner').contains(SEEDED_CONTACT);
            entered.occupier = SEEDED_CONTACT;
            entered.owner = SEEDED_CONTACT;
            cy.get('.widget-wrapper.owner').scrollIntoView();
            cy.openRelationship('Owner(s)');
            options().eq(1).click();
            cy.get('.widget-wrapper.owner .rr-table-row').should('have.length.greaterThan', 1);

            cy.waitForTileSaves(1);
            cy.workflowNext();

            cy.get('.widget-wrapper.building_name_value .widget-input-label').contains('Building Name');
            cy.get('.widget-wrapper.building_name_value input').should('be.disabled');
            cy.get('.widget-wrapper.street_value .widget-input-label').contains('Street');
            cy.get('.widget-wrapper.street_value input').should('be.disabled');
            cy.get('.widget-wrapper.town_or_city_value .widget-input-label').contains('Town or City');
            cy.get('.widget-wrapper.town_or_city_value input').should('be.disabled');
            cy.get('.widget-wrapper.postcode_value .widget-input-label').contains('Postcode');
            cy.get('.widget-wrapper.postcode_value input').should('be.disabled');
            cy.get('.widget-wrapper.county_value .widget-input-label').contains('County');
            cy.get('.widget-wrapper.county_value .select2-container').should('have.class', 'select2-container--disabled');
            cy.get('.widget-wrapper.townland .widget-input-label').contains('Townland');
            cy.get('.widget-wrapper.townland .select2-selection__choice').should('have.length', 1);
            cy.get('.widget-wrapper.area_type .widget-input-label').contains('Area Type');
            cy.get('.widget-wrapper.area_type .select2-container').should('have.class', 'select2-container--disabled');

            cy.typeRichText('location_description', 'Cypress location description.');
            entered.locationDescription = 'Cypress location description.';
            cy.waitForTileSaves(1);
            cy.workflowNext();

            cy.get('.mapboxgl-canvas');
            cy.get('.widget-wrapper.feature_shape .widget-input-label').contains('Feature Shape');
            cy.get('.widget-wrapper.feature_shape .select2-selection__rendered').invoke('text').should('match', /\S/).and('not.contain', 'Select an option');
            cy.workflowNext();

            cy.get('.widget-wrapper.action_type .widget-input-label').contains('Action Type');
            cy.get('.widget-wrapper.action_type .select2-selection--multiple').click();
            options().contains('Resolve with Owner');
            options().contains('Resolve with Occupier');
            options().contains('Refer to Enforcement');
            options().contains('Contact PSNI');
            options().contains('Resolve with Owner').click();
            entered.actionType = 'Resolve with Owner';
            cy.get('.widget-wrapper.action_type .select2-selection__choice').should('have.length', 1);
            cy.get('.widget-wrapper.action_type .select2-selection--multiple').click();
            options().contains('Contact PSNI').click();
            cy.get('.widget-wrapper.action_type .select2-selection__choice').should('have.length', 2);

            cy.get('.widget-wrapper.work_carried_out_by_value .widget-input-label').contains('Work Carried Out By');
            cy.pickCardOption('work_carried_out_by_value');
            entered.workCarriedOutBy = true;

            cy.scrollToWidget('proposal_date_value');
            cy.get('.widget-wrapper.proposal_date_value input.form-control').first()
                .should('have.value', '');
            cy.fillDate('intended_start_date');
            entered.intendedStartDate = true;
            cy.fillDate('intended_end_date');
            entered.intendedEndDate = true;

            cy.typeRichText('proposal_text_n1', 'Cypress work proposed note.');
            entered.proposalNotes = 'Cypress work proposed note.';

            cy.waitForTileSaves(1);
            cy.workflowNext();

            cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
            cy.get('input.dz-hidden-input').selectFile('cypress/fixtures/test-upload.txt', { force: true });
            cy.contains('test-upload.txt', { timeout: 20000 });
            entered.uploadedFile = 'test-upload.txt';
            cy.waitForTileSaves(1);
            cy.workflowNext();

            cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
            cy.get('.tabbed-workflow-footer-button-container .btn').should('have.length', 1);

            cy.get('.widget-wrapper.status_type .widget-input-label').contains('Status');
            cy.get('.widget-wrapper.status_type .select2-selection').click();
            cy.get('.select2-dropdown').contains('Enforcement actioned');
            cy.get('.select2-dropdown').contains('Not completed');
            cy.get('.select2-dropdown').contains('Finished');
            cy.get('.select2-dropdown').contains('In progress');
            cy.get('.select2-dropdown').contains('Finished').click();
            entered.status = 'Finished';

            cy.get('.widget-wrapper.work_finish_date_value .widget-input-label').contains('Work Finish Date');
            cy.fillDate('work_finish_date_value');
            entered.workFinishDate = true;

            cy.contains('Signed Off By');
            cy.contains('You do not have permission to sign off');
            cy.get('.widget-wrapper.sign_off_date_value .widget-input-label').contains('Sign Off Date');

            cy.waitForTileSaves(2);
            cy.get('.workflow-top-control').contains(/Save and [Cc]omplete Workflow/).scrollIntoView().click();
            cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
            cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
        });
    });

    // These reopen the seeded report directly (not the one the test above
    // creates) so they run whether or not that walkthrough gets to the end.
    describe('Record of the Issue', () => {
        it('Name is disabled', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
            cy.get('[aria-label="Name"]', { timeout: 30000 }).should('be.disabled');
        });

        it('Issue Identified By accepts more than one person', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
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
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
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
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
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
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
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
            cy.fillDate('work_finish_date_value', '28-07-2099');
            cy.get('.widget-wrapper.work_finish_date_value input.form-control').first()
                .should('not.have.value', '28-07-2099');
        });

        it('Sign Off Date rejects future dates', () => {
            openReport(SEEDED_REFERENCE);
            cy.get('.workflow-nav-tab-container').contains('Sign Off').click();
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
    });

    describe('Open Selected reopens the same report with its values intact', () => {
        it('rehydrates the reference, Record of the Issue, Location, Map, Work Proposed, Documentation and Sign Off', function () {
            if (!entered.reference) { this.skip(); return; }
            cy.reload();
            openReport(entered.reference);

            cy.get('.workflow-nav-tab-container').contains('Issue Reference').click();
            cy.get('[aria-label="Reference Number"]').should('have.value', entered.reference);

            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
            cy.get('.widget-wrapper.damage_type').contains(entered.damageType);
            cy.get('.widget-wrapper.material_fabric_damage_type').contains(entered.materialFabricDamageType);
            cy.get('.widget-wrapper.component_damage_type').contains(entered.componentDamageType);
            cy.get('.widget-wrapper.occupier').contains(entered.occupier);
            cy.get('.widget-wrapper.owner').contains(entered.owner);

            cy.get('.workflow-nav-tab-container').contains('Location details').click();
            cy.richTextValue('location_description').should('contain', entered.locationDescription);

            cy.get('.workflow-nav-tab-container').contains('Map').click();
            cy.get('.widget-wrapper.feature_shape .select2-selection__rendered').invoke('text').should('match', /\S/).and('not.contain', 'Select an option');

            cy.get('.workflow-nav-tab-container').contains('Work Proposed').click();
            cy.get('.widget-wrapper.action_type .select2-selection__choice').should('have.length', 2);
            cy.get('.widget-wrapper.action_type').contains(entered.actionType);
            cy.get('.widget-wrapper.work_carried_out_by_value .rr-table-row').should('have.length.greaterThan', 0);
            cy.get('.widget-wrapper.intended_start_date input.form-control').first().should('not.have.value', '');
            cy.get('.widget-wrapper.intended_end_date input.form-control').first().should('not.have.value', '');
            cy.richTextValue('proposal_text_n1').should('contain', entered.proposalNotes);

            cy.get('.workflow-nav-tab-container').contains('Documentation').click();
            cy.contains(entered.uploadedFile, { timeout: 20000 });

            cy.get('.workflow-nav-tab-container').contains('Sign Off').click();
            cy.get('.widget-wrapper.status_type').contains(entered.status);
            cy.get('.widget-wrapper.work_finish_date_value input.form-control').first().should('not.have.value', '');
        });

        it('the six contact pickers rehydrate on reopen', function () {
            if (!entered.reference) { this.skip(); return; }
            openReport(entered.reference);
            cy.get('.workflow-nav-tab-container').contains('Record of the Issue').click();
            cy.get('.widget-wrapper.issue_identifier').contains(entered.issueIdentifiedBy);
            cy.get('.widget-wrapper.area_archaeologist').contains(entered.areaArchaeologist);
            cy.get('.widget-wrapper.cwt_area_supervisor').contains(entered.cwtAreaSupervisor);
            cy.get('.widget-wrapper.field_worker').contains(entered.fieldWorker);
        });
    });
});
