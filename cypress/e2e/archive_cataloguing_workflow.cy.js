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
    it('Test Page 2: Archive Source Details', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("A workflow for Archive Sources and Cataloguing").click();
        cy.contains("Start New").click();
        // Starting the workflow
        // Initial Step
        cy.wait(10000);
        cy.contains("Save and Continue").click();

        // Page 2
        cy.get('[aria-label="Archive Source Name"]').should('be.visible').click().type('Archive Source Name');
        cy.get('[aria-label="Subtitle"]').should('be.visible').click().type('Subtitle');
        cy.get('[aria-label="File ID (key)"]').should('be.visible').click().type('File ID (key)');
        cy.contains("Save and Continue").click();

    })
    it.only('Test Page 3: Archive Source Details', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("A workflow for Archive Sources and Cataloguing").click();
        cy.contains("Start New").click();
        // Starting the workflow
        // Initial Step
        cy.wait(10000);
        cy.contains("Save and Continue").click();

        // Page 2
        cy.wait(10000);
        cy.contains('Next Step').should('be.visible').click();

        // Page 3
        cy.get('[aria-label="Author Name"]').should('be.visible').click().type('Author Name');
        cy.get('[aria-label="Editor Name"]').should('be.visible').click().type('Editor Name');
        cy.get('[aria-label="Start Date"]').should('be.visible').click();
        cy.contains('11').click();
        cy.get('[aria-label="End Date"]').should('be.visible').click();
        cy.contains('11').click();
        cy.contains("Save and Continue").click();
    })
})