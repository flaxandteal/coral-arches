describe('Going through the Flag For Enforcement Workflow', function () {

    beforeEach(() => {
        cy.login()
        cy.visit("http://localhost:8000/plugins/init-workflow")
    })

    it('Go through the workflow', function () {
        cy.contains("Workflows");
        cy.contains("Flag for Enforcement").click();
        // Starting the workflow
        cy.contains("Save and Continue").click();
        cy.wait(5000);
        cy.get('[aria-label="Case Reference"]').should('be.visible').click().type('Case Ref');
        // cy.get('#cke_2_contents > .cke_wysiwyg_frame').click().type('test');
        // cy.wait(5000);
        // cy.get('[aria-label="Subtitle"]').should('be.visible').click().type('Subtitle');
        // cy.get('[aria-label="File ID (key)"]').should('be.visible').click().type('File ID (key)');
        // cy.get('#cke_2_contents').click().type('test type ref');
        cy.contains("Save and Continue").click();
        // cy.get('[aria-label="Flagged by"]').should('be.visible').click().type('Case Ref');
        // cy.get('.card_component.full_name > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('Test');
        // cy.get(':nth-child(2) > .card-component > .new-provisional-edit-card-container > .card > .install-buttons > .fa-plus > span').click();
        // cy.get('.close-new-step > .btn > span').click();
    })
})
