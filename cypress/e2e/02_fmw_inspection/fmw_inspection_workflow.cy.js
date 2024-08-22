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
        cy.get(':nth-child(1) > .workflow-component').contains('Add new Relationship').click();
        cy.wait(3000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="B File Reference"]').scrollIntoView().should('be.visible').type('Testing');
        cy.get('[aria-label="Land Use"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Date of Visit"]').scrollIntoView().should('be.visible').click();
        cy.get('[aria-label="Condition Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Risk Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();
        cy.get('.card_component.owner').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().contains('Create a new Organization').click();
        // Return from create organization screen
        cy.get('.close-new-step').contains('Return').click();
        cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().contains('Create a new Person').click();
        // Return from create organization screen
        cy.get('.close-new-step').contains('Return').click();
        cy.get('.card_component.fm_warden').contains('Add new Relationship').scrollIntoView().click();
        cy.get('.select2-dropdown').first().contains('Create a new Person').click();
        // Return from create organization screen
        cy.get('.close-new-step').contains('Return').click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click()

        //Map Tab
        cy.wait(2000);
        cy.get('.chosen-single').scrollIntoView().click();
        cy.wait(2000);
        cy.get('.chosen-results').contains('Add point').click();
        cy.get('#toggle-editor-panel-button').contains('Edit').click();
        cy.get('.mapboxgl-ctrl-geocoder--input').type('Belfast');
        cy.get('.suggestions').first().click();
        cy.get('.mapboxgl-canvas').click();
        cy.get('#toggle-editor-panel-button').contains('Edit').click();
        cy.get('.chosen-single').scrollIntoView().click();
        cy.get('.chosen-results').contains('Add line').click();
    });
});
