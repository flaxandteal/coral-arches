describe('Logging in', function () {
    it('Log in', function () {
        cy.login(); // Sanity check
    })
})

describe('Working With The Archive Source Workflow', function () {
    it('Test Page 1: Makes an Archive Source', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("A workflow for Archive Sources and Cataloguing").click();
        cy.contains("Start New").click();
        // Starting the workflow
        // Initial Step
        cy.contains("Save and Continue").click();
        // Initial Step
        // cy.contains("Next Step").click();
        // cy.get('[aria-label="Archive Source Name"]').click().type('Hello World');
    })
    it.only('Test Page 2: Archive Source Details', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("A workflow for Archive Sources and Cataloguing").click();
        cy.contains("Start New").click();
        // Starting the workflow
        // Initial Step
        cy.wait(10000);
        cy.contains("Save and Continue").click();

        // Page 1:
        cy.get('[aria-label="Archive Source Name"]').should('be.visible').click().type('Archive Source Name');
        cy.get('[aria-label="Subtitle"]').should('be.visible').click().type('Subtitle');
        cy.get('[aria-label="File ID (key)"]').should('be.visible').click().type('File ID (key)');
        cy.contains("Save and Continue").click();

    })
})