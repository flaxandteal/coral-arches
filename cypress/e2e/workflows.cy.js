describe('Logging in', function () {
    it('Log in', function () {
        cy.login(); // Sanity check
    })
})

describe('Working With The Archive Source Workflow', function () {
    it('Makes an Archive Source', function () {
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
})

describe('Working With The Archive Source Workflow', function () {
    it('Goes through the Excavation Workflow', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Initialize excavation license
        cy.wait(2500);
        cy.contains("Save and Continue").click();

        // Filling the Application Details
        cy.get('[aria-label="Site Name"]').click().type('Site Name test 1');
        cy.get('[aria-label="Planning Reference"]').click().type('Planning Reference test 1');
        cy.get('[aria-label="CM Container Number"]').click().type('CM Container Number World test 1');
        // Handling with the dates
        cy.get('[aria-label="Received Date"]').click();
        cy.contains('11').click();
        cy.get('[aria-label="Acknowledged Date"]').click();
        cy.contains('11').click();
        cy.get('[aria-label="Proposed Start Date"]').click();
        cy.contains('11').click();
        cy.get('[aria-label="Proposed End Date"]').click();
        cy.contains('11').click();
        cy.get('[aria-label="Actual Start Date"]').click();
        cy.contains('11').click();
        cy.get('[aria-label="Actual End Date"]').click();
        cy.contains('11').click();
        // Textbox
        cy.findByRole('textbox').click().type('Testing the Notes textbox');
        // Choosing stage if application in Application Details
        cy.get('#select2-chosen-88').click();
        cy.get('Final').click();
        // test funding available
        cy.get('Yes').click();
        cy.get('No').click();

        // Geospatial Details
    })
})