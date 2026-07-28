describe('Going through the Incident Report', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Issue Report').click();
        cy.wait(2000);
        cy.get('[aria-label="Select Licence, Please select a Heritage Asset"]').click();
        cy.wait(3000);
        // Skip the loading placeholder — selecting it leaves the launcher without
        // a licence, so "Start New" never opens the workflow and there is no
        // footer for the next step to click.
        cy.get('.select2-results__option')
            .not('.loading-results')
            .not('.select2-results__option--load-more')
            .not('.select2-results__message')
            .first()
            .click();
        cy.wait(2000);
        cy.get('[style="display: flex"] > .fa').contains('Start New').click();

        // Inital Step tab. This workflow initialises eight tabs server-side and
        // can take ~45s (longer under load) before its footer renders, so give
        // it well past the default 12s timeout.
        cy.get('.tabbed-workflow-footer-button-container', { timeout: 150000 }).should('exist');
        cy.wait(3000);
        cy.workflowNext();

        // Incident Reference tab
        cy.wait(8000);
        cy.get('.tabbed-workflow-footer').scrollIntoView();
        cy.workflowNext();

        // Record of the incident
        cy.wait(4000)

        // cy.get('aria-label="Damage Type"').contains('Select an option').click({force: true}); // Damage type dropdown
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();

        // cy.get('.card_component.material_fabric_damage_type').contains('Select an option').click({force: true}); // Material/ fabric damage type dropdown
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click({force: true});

        // cy.get('.card_component.component_damage_type').contains('Select an option').click({force: true}); // Component damage type
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click({force: true});

        /*
            section for notes rich text editor
        */

        // cy.get('[aria-label="Issue Identified By, Add new Relationship"]').click();
        // cy.wait(2000);
        // cy.get('.select2-search__field').clear('John Smith');
        // cy.get('.select2-search__field').type('John Smith');
        // cy.get('.select2-results__option').contains('John Smith').click();

        // cy.get('[aria-label="Area Archaeologist(s), Add new Relationship"]').contains('Add new Relationship').scrollIntoView().click(); // Area Archaeologist dropdown
        // cy.wait(4000);
        // cy.get('.select2-search__field').clear('John Smith');
        // cy.get('.select2-search__field').type('John Smith');
        // cy.get('.select2-results__option').contains('John Smith').click();
        // cy.wait(4000);

        // cy.wait(4000);
        // cy.get('[aria-label="CWT Area Supervisor(s), Add new Relationship"]').click(); // CWT Area Supervisor dropdown
        // cy.wait(4000);
        // cy.get('.select2-results__option').first().click();
        // cy.wait(4000);

        // cy.get('[aria-label="Occupier(s), Add new Relationship"]').contains('Add new Relationship').scrollIntoView().click(); // Occupier dropdown
        // cy.wait(4000);
        // cy.get('.select2-results__option').first().click();
        // cy.wait(4000);

        // cy.get('[aria-label="Field Worker(s), Add new Relationship"]').contains('Add new Relationship').scrollIntoView().click(); // Field worker dropdown
        // cy.wait(4000);
        // cy.get('.select2-results__option').first().click();
        // cy.wait(4000);

        // cy.get('[aria-label="Owner(s), Add new Relationship"]').contains('Add new Relationship').scrollIntoView().click(); // Owner dropdown
        // cy.wait(4000);
        // cy.get('.select2-results__option').first().click();
        // cy.wait(4000);

        cy.workflowNext();

        // Location details tab
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');

        // The Location Details on an Issue Report are inherited (read-only) from
        // the linked Heritage Asset — Building Name / Street / Town or City /
        // Postcode / Townland are all disabled here — so there is nothing to fill;
        // just confirm the tab rendered and continue.
        cy.get('[aria-label="Building Name"]').should('be.disabled');

        /*

        Location Description rich text editor

        */

        cy.workflowNext();

        // // Map tab
        // cy.get('.mapboxgl-canvas');
        // cy.get('.workbench-card-sidebar');
        // cy.get('#toggle-basemap-panel-button').contains('Basemap').click();
        // cy.get('[aria-label="Dark"]').click();
        // cy.get('[aria-label="ESRI World"]').click();
        // cy.get('[aria-label="ESRI World Topo"]').click();
        // cy.get('[aria-label="Light"]').click();
        // cy.get('[aria-label="Open Street Map"]').click();
        // cy.get('[aria-label="Satellite Streets"]').click();
        // cy.get('[aria-label="Stamen Terrain"]').click();
        // cy.get('[aria-label="TC-copy"]').click();
        // cy.get('[aria-label="satellite"]').click();
        // cy.get('.active-basemap').click();
        
        // cy.get('#toggle-overlays-panel-button').contains('Overlays').click();
        // cy.get('#toggle-legend-panel-button').contains('Legend').click();

        // cy.wait(6000);
        // cy.get('.card_component.feature_shape').contains('Feature Shape').scrollIntoView();
        // cy.get('.select2-selection__rendered').contains('Select an option').click();

        // cy.get('.select2-results__option').contains('Approx').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Archaeological Event').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Area').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Dispersed Event').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Linear').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Locality').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Named Loc').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Unknown').click();

        cy.workflowNext();

        // Work Proposed tab. Action Type is a domain multi-select; pick one of
        // its fixed options. Work Carried Out By is a required resource-instance
        // dropdown, so select the first available resource to allow the save.
        cy.get('.card_component.action_type').contains('Action Type');
        cy.get('.card_component.action_type .select2-selection--multiple').click();
        cy.get('.select2-results__option').contains('Resolve with Owner');
        cy.get('.select2-results__option').contains('Resolve with Occupier');
        cy.get('.select2-results__option').contains('Refer to Enforcement');
        cy.get('.select2-results__option').contains('Contact PSNI');
        cy.get('.select2-results__option').contains('Resolve with Owner').click();
        cy.wait(1000);

        cy.get('.card_component.work_carried_out_by_value').contains('Work Carried Out By');
        cy.pickCardOption('work_carried_out_by_value');
        cy.wait(1000);

        cy.workflowNext();

        // Documentation tab. Only assert the upload control is present — clicking
        // it opens a native file dialog that Cypress cannot drive (spec 05 does
        // the same). The tab renders lazily, so allow time for it.
        cy.wait(4000);
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.workflowNext();

        // Sign Off tab
        cy.get('.card_component.status_type').contains('Status');
        cy.get('.card_component.status_type .select2-selection').click();
        cy.get('.select2-dropdown').contains('Enforcement actioned');
        cy.get('.select2-dropdown').contains('Not completed');
        cy.get('.select2-dropdown').contains('Finished');
        cy.get('.select2-dropdown').contains('In progress');
        cy.get('.select2-dropdown').contains('Finished').click();

        cy.get('.card_component.work_finish_date_value').contains('Work Finish Date');
        cy.get('[aria-label="Work Finish Date"]').click();
        cy.get('.card_component.work_finish_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        
        // The admin test user has no sign-off permission, so the Signed Off By
        // widget renders a "You do not have permission to sign off" message
        // instead of a picker; just confirm the card is present.
        cy.get('.card_component.signed_off_by').contains('Signed Off By');
        cy.get('.card_component.sign_off_date_value').contains('Sign Off Date').scrollIntoView();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save');
        cy.get('.workflow-top-control').contains(/Save and [Cc]omplete Workflow/).scrollIntoView().click();
    });
});
