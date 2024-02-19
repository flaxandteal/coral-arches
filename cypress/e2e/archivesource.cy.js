describe('Working With The Archive Source Workflow', function() {
    it('Makes an Archive Source', function() {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("A workflow for Archive Sources and Cataloguing").click();
        cy.contains("Start New").click();
        // Starting the workflow
        // Initial Step
        cy.contains("Save and Continue").click()
        // Initial Step
        // cy.contains("Next Step").click();
        // cy.get('[aria-label="Archive Source Name"]').click().type('Hello World');
    })
})