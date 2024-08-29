describe('Going through the Incident Report', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Incident Report').click();
        cy.wait(2000);
        cy.get('.card-component').contains('Please select a Monument').click();
        cy.get('.select2-results__option');
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.get('.card-component').contains('Select an Incident Report or start new').click();
        cy.get('[style="display: flex"] > .fa').contains('Start New').click();
        
        // Inital Step tab
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();

        // Incident Reference tab
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer').scrollIntoView();
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Record of the incident
        cy.wait(4000)
        cy.get('[aria-label="Name"]').click(); // Name textfield should be disabled and prefilled

        cy.get('.card_component.damage_type').contains('Select an option').click(); // Damage type dropdown
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.material_fabric_damage_type').contains('Select an option').click(); // Material/ fabric damage type dropdown
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.component_damage_type').contains('Select an option').click(); // Component damage type
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('[aria-label="CM Reference"]').click(); // CM Reference textfield should be prefilled and disbaled

        /*
            section for notes rich text editor
        */

        cy.get('.card_component.issue_identifier').contains('Add new Relationship').scrollIntoView().click() // Issue identified by dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.card_component.area_archaeologist').contains('Add new Relationship').scrollIntoView().click(); // Area Archaeologist dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.card_component.cwt_area_supervisor').contains('Add new Relationship').scrollIntoView().click(); // CWT Area Supervisor dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click(); // Occupier dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.card_component.field_worker').contains('Add new Relationship').scrollIntoView().click(); // Field worker dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.card_component.owner').contains('Add new Relationship').scrollIntoView().click(); // Owner dropdown
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

        // Location details tab
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step');
        cy.get('[style="display: flex;"').contains('Help').click();
        cy.get('#card-help-panel');

        cy.get('.card_component.full_address').contains('Full Address');
        cy.get('[aria-label="Full Address"]').click().type('123 Bubble Street');

        cy.get('.card_component.street_value').contains('Street');
        cy.get('[aria-label="Street"]').click().type('123 Bubble Street');

        cy.get('.card_component.town_or_city_value').contains('Town or City');
        cy.get('[aria-label="Town or City"]').click().type('Bubble Land');

        cy.get('.card_component.postcode_value').contains('Postcode').scrollIntoView();
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control')
        .click({force: true}).type('BL12457')

        cy.get('.card_component.county_selected').contains('County').scrollIntoView();
        cy.get('.card_component.county_selected').contains('Select an option').click();

        cy.get('.card_component.townland').contains('Townland');
        cy.get('.card_component.townland').contains('Select an option').click();

        cy.get('.card_component.area_type').contains('Area Type').scrollIntoView();
        cy.get('.card_component.area_type').contains('Select an option').click();

        cy.get('.card_component.area_name').contains('Area Name').scrollIntoView();
        cy.get('.card_component.area_name').contains('Select an option').click();

        /* 
        
        Location Description rich text editor

        */

        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Map tab

        cy.get('.mapboxgl-canvas');
        cy.get('.workbench-card-sidebar');
        cy.get('#toggle-basemap-panel-button').contains('Basemap').click();
        cy.get('[aria-label="Dark"]').click();
        cy.get('[aria-label="ESRI World"]').click();
        cy.get('[aria-label="ESRI World Topo"]').click();
        cy.get('[aria-label="Light"]').click();
        cy.get('[aria-label="Open Street Map"]').click();
        cy.get('[aria-label="Satellite Streets"]').click();
        cy.get('[aria-label="Stamen Terrain"]').click();
        cy.get('[aria-label="TC-copy"]').click();
        cy.get('[aria-label="satellite"]').click();
        cy.get('.active-basemap').click();
        
        cy.get('#toggle-overlays-panel-button').contains('Overlays').click();
        cy.get('#toggle-legend-panel-button').contains('Legend').click();

        // Maps tab
        cy.wait(6000);
        cy.get('.card_component.feature_shape').contains('Feature Shape').scrollIntoView();
        cy.get('.select2-selection__rendered').contains('Select an option').click();

        cy.get('.select2-results__option').contains('Approx').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Archaeological Event').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Area').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Dispersed Event').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Linear').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Locality').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Named Loc').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Unknown').click();

        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Work Proposed tab
        cy.get('.card_component.action_type').contains('Action Type');
        cy.get('.select2-selection--multiple').click();
        cy.get('.select2-results__option').contains('Resolve with Owner');
        cy.get('.select2-results__option').contains('Resolve with Occupier');
        cy.get('.select2-results__option').contains('Refer to Enforcement');
        cy.get('.select2-results__option').contains('Contact PSNI');
        cy.get('.select2-results__option').contains('Resolve with Owner').click();

        cy.get('.card_component.work_carried_out_by_value').contains('Work Carried Out By')
        cy.get('[aria-label="Work Carried Out By"]').click().type('Testing');

        cy.get('.card_component.contact_details_value').contains('Contact Details');
        cy.get('[aria-label="Contact Details"]').click().type('Testing');

        cy.get('.card_component.intended_start_date').contains('Intended Start Date');
        cy.get('[aria-label="Intended Start Date"]').click();
        cy.get('.card_component.intended_start_date > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.card_component.intended_end_date').contains('Intended End Date');
        cy.get('[aria-label="Intended End Date"]').scrollIntoView().click();


        cy.get('.card_component.approved_by').contains('Approved By').scrollIntoView();
        cy.get('.select2-selection').contains('Add new Relationship').click();
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.proposal_date_value').contains('Proposal Date');
        cy.get('[aria-label="Proposal Date"]').click();

        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click()

        // Sign Off tab
        cy.get('.card_component.status_type').contains('Status');
        cy.get('.select2-selection__rendered').contains('Select an option').click();
        cy.get('.select2-dropdown').contains('Enforcement actioned');
        cy.get('.select2-dropdown').contains('Not completed');
        cy.get('.select2-dropdown').contains('Finished');
        cy.get('.select2-dropdown').contains('In progress');
        cy.get('.select2-dropdown').contains('Finished').click();

        cy.get('.card_component.work_finish_date_value').contains('Work Finish Date');
        cy.get('[aria-label="Work Finish Date"]').click();
        cy.get('.card_component.work_finish_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        
        cy.get('.card_component.signed_off_by').contains('Signed Off By');
        cy.get('.select2-selection__rendered').contains('Add new Relationship').click();
        cy.get('.select2-dropdown').first().click();
        cy.get('.card_component.sign_off_date_value').contains('Sign Off Date').scrollIntoView();
        cy.get('[aria-label="Sign Off Date"]').click();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save');
        cy.get('.workflow-top-control').contains('Save and complete Workflow').scrollIntoView().click();
    });

    // it('Open workflow steps', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Incident Report').click();

    //     cy.wait(2000);
    //     cy.get('.card-component').contains('Please select a Monument').click();
    //     cy.get('.select2-results__option').first().click();
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('[style="display: flex"] > .fa').contains('Start New').click();
    //     cy.get('.btn-primary').contains('Open Selected').click();
    //     cy.get('.btn-danger').contains('Clear Recents').click();
    // });

    // it('Record of Incident select and unselect', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Incident Report').click();
    //     cy.wait(2000);
    //     cy.get('.card-component').contains('Please select a Monument').click();
    //     cy.get('.select2-results__option');
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').contains('HA/01').click();
    //     cy.get('.card-component').contains('Select an Incident Report or start new').click();
    //     cy.get('[style="display: flex"] > .fa').contains('Start New').click();
        
    //     // Inital Step tab
    //     cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();

    //     // Incident Reference tab
    //     cy.get('.tabbed-workflow-footer').scrollIntoView();
    //     cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

    //     // Record of Incident
    //     cy.wait(4000)
    //     cy.get('.card_component.damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').first().click();
    //     cy.wait(2000)
    //     cy.get('.card_component.damage_type');
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('.card_component.material_fabric_damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.card_component.material_fabric_damage_type').contains('.select2-results__option').first().click();
    //     cy.wait(2000);
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('.card_component.component_damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').first().click();
    //     cy.wait(2000)
    //     cy.get('.select2-selection__clear').click();
    // });

    // it('Map feature dropdown select and unselect', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Incident Report').click();
    //     cy.wait(2000);
    //     cy.get('.card-component').contains('Please select a Monument').click();
    //     cy.get('.select2-results__option');
    //     cy.get('.select2-results__option').contains('HA/01').click();
    //     cy.get('.card-component').contains('Select an Incident Report or start new').click();
    //     cy.get('[style="display: flex"] > .fa').contains('Start New').click();
        
    //     // Inital Step tab
    //     cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();

    //     // Incident Reference tab
    //     cy.wait(2000);
    //     cy.get('.tabbed-workflow-footer').scrollIntoView();
    //     cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

    //     // Record of incident tab
    //     cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

    //     // Locations details tab
    //     cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

    //     // Maps tab
    //     cy.wait(6000);
    //     cy.get('.card_component.feature_shape').contains('Feature Shape');
    //     cy.get('.select2-selection__rendered').contains('Select an option').click();

    //     cy.get('.select2-results__option').contains('Approx').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Archaeological Event').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Area').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Dispersed Event').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Linear').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Locality').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Named Loc').scrollIntoView().click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Unknown').click();

    //     cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

    // })
});

