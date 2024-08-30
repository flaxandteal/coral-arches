describe('Going through the FWM Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('FMW Inspection').click();
        cy.contains('Start New').click();
        
        // Initial step tab
        cy.get('.workflow-nav-tab').contains('Report').click();
        cy.get('.workflow-nav-tab').contains('Map').click();
        cy.get('.workflow-nav-tab').contains('Documentation').click();
        cy.get('.workflow-nav-tab').contains('Sign Off').click();
        cy.contains('Save and Continue').click();

        //Report Tab
        cy.wait(8000);
        // SMR number dropdown
        cy.get(':nth-child(1) > .workflow-component').contains('Add new Relationship').click();
        cy.wait(3000);
        cy.get('.select2-results__option').first().click();

        // B File Reference text field
        cy.get('[aria-label="B File Reference"]').scrollIntoView().should('be.visible').type('Testing');

        // Land use dropdown
        cy.get('[aria-label="Land Use"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Date of vist date selector
        cy.get('[aria-label="Date of Visit"]').scrollIntoView().should('be.visible').click();

        // Condition score dropdown
        cy.get('[aria-label="Condition Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Risk score dropdwon
        cy.get('[aria-label="Risk Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Owner dropdown
        cy.get('.card_component.owner').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().click();

        // Occupier dropdown
        cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().click();

        // fm warden dropdown
        cy.get('.card_component.fm_warden').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click()

        //Map Tab
        cy.wait(2000);

        // Edit tab - Add new feature... dropdown
        cy.get('.chosen-single').scrollIntoView().click();
        cy.wait(2000);
        cy.get('.chosen-results').contains('Add point').click();

        // Closing panel to make search appear 
        cy.get('#toggle-editor-panel-button').contains('Edit').click();
        cy.get('.mapboxgl-ctrl-geocoder--input').type('Belfast'); // Search bar for map
        cy.get('.suggestions').first().click();
        cy.get('.mapboxgl-canvas').click();
        cy.get('#toggle-editor-panel-button').contains('Edit').click();
        cy.get('.chosen-single').scrollIntoView().click();
        cy.get('.chosen-results').contains('Add line').click();

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

        // Documentation tab
        cy.wait(2000);
        cy.get('.bord-top > .btn').contains('Select Files')
        //cy.get('.media-block').selectFile('cypress/e2e/04_curatorial_inspection_workflow/testFileForUpload.txt');
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign Off tab
        cy.wait(2000);
        cy.get('.widget-input-label').contains('Signed Off On');
        cy.get('[aria-label="Signed Off On"]').click();
        cy.get('.date-icon').first().click();

        cy.get('.report_submitted_by_value').contains('Report Submitted By');
        cy.get('.report_submitted_by_value').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-dropdown').contains('Test Person').click();

        cy.get('.reviewed_by_value').contains('Reviewed By');
        cy.get('.reviewed_by_value').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-dropdown').contains('Test Person').click();

        cy.get('.send_papers').contains('Send Papers');
        cy.get('.send_papers').contains('Yes').click(); 

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });

   //   it('SMR number field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      cy.get(':nth-child(1) > .workflow-component').contains('Add new Relationship').click();
   //      cy.wait(3000);
   //      cy.get('.select2-results__option').first().click();
   //      cy.contains('Save and Continue').click();
   //   })

   //   it('B file Reference field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      cy.get('[aria-label="B File Reference"]').scrollIntoView().should('be.visible').type('Testing');
   //   })

   //   it('Land use field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      cy.get('[aria-label="Land Use"]').scrollIntoView().should('be.visible').click();
   //      cy.get('.select2-results__option').first().click();
   //   })

   //   it('Date of visit field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      cy.get('[aria-label="Date of Visit"]').scrollIntoView().should('be.visible').click();
   //   })

   //   it('Score field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      // Condition score dropdown
   //      cy.get('[aria-label="Condition Score, 1"]').scrollIntoView().should('be.visible').click();
   //      cy.get('.select2-results__option').first().click();

   //      // Risk score dropdwon
   //      cy.get('[aria-label="Risk Score, 1"]').scrollIntoView().should('be.visible').click();
   //      cy.get('.select2-results__option').first().click();
   //   })

   //   it('Owner field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      // Owner dropdown
   //      cy.get('.card_component.owner').contains('Add new Relationship').scrollIntoView().click();
   //      cy.get('.select2-dropdown').first().contains('Create a new Organization').click();
   //      // Return from create organization screen
   //      cy.get('.close-new-step').contains('Return').click();

   //      // Occupier dropdown
   //      cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click();
   //      cy.get('.select2-dropdown').first().contains('Create a new Person').click();
   //      // Return from create organization screen
   //      cy.get('.close-new-step').contains('Return').click();

   //      // fm warden dropdown
   //      cy.get('.card_component.fm_warden').contains('Add new Relationship').scrollIntoView().click();
   //      cy.get('.select2-dropdown').first().contains('Create a new Person').click();
   //      // Return from create organization screen
   //      cy.get('.close-new-step').contains('Return').click();
   //      cy.wait(2000);
   //      cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click()
   //   })

   //   it('Occuiper field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      // Occupier dropdown
   //      cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click();
   //      cy.get('.select2-dropdown').first().contains('Create a new Person').click();
   //      // Return from create organization screen
   //      cy.get('.close-new-step').contains('Return').click();
   //   })

   //   it('FM warden field only', function () {
   //      cy.contains('Workflows');
   //      cy.contains('FMW Inspection').click();
   //      cy.contains('Start New').click();
        
   //      // Initial step tab
   //      cy.get('.workflow-nav-tab').contains('Report').click();
   //      cy.get('.workflow-nav-tab').contains('Map').click();
   //      cy.get('.workflow-nav-tab').contains('Documentation').click();
   //      cy.get('.workflow-nav-tab').contains('Sign Off').click();
   //      cy.contains('Save and Continue').click();

   //      //Report Tab
   //      cy.wait(8000);
   //      // fm warden dropdown
   //      cy.get('.card_component.fm_warden').contains('Add new Relationship').scrollIntoView().click();
   //      cy.get('.select2-dropdown').first().contains('Create a new Person').click();
   //      // Return from create organization screen
   //      cy.get('.close-new-step').contains('Return').click();
   //      cy.wait(2000);
   //      cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click()
   //   })
});
