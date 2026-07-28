describe('Going through the Agri Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow to completion', function () {
        // Launch the Agriculture and Forestry Consultation workflow
        cy.get('[href="/plugins/open-workflow?workflow-slug=agriculture-and-forestry-consultation-workflow"] > .workflow-select-card').click();
        cy.wait(2000);
        cy.contains('Start New').click();
        cy.wait(3000);

        // Start step: Consultation ID is auto-generated
        cy.get('[aria-label="Consultation ID"]').should('have.attr', 'placeholder');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Consultation step
        cy.wait(6000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Documentation step (file upload is optional)
        cy.wait(5000);
        cy.get('.bord-top > .btn').contains('Select Files');
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Letters step
        cy.wait(5000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign off step
        cy.wait(5000);
        cy.get('.workflow-top-control').contains('Save and Complete Workflow').scrollIntoView().click();

        // Workflow completes and returns to the workflow launcher list.
        // (The launcher shows the workflow cards, not a "Start New" button —
        // that only appears once a specific workflow card is selected.)
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
