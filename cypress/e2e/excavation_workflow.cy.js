describe('Logging in', function () {
    it('Log in', function () {
        cy.login(); // Sanity check
    })
})

describe('Working With The Excavation Workflow', function () {
    it('Test Page 1: Initialization of the Excavation Workflow', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        //Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();
    })
    it('Test Page 2: Filling the Application Details', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        //Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();
        
        // Page 2/12
        //Filling the Application Details
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
        // cy.wait(10000) // wait to load the textbox
        // cy.get('[data-cke-editorplaceholder="Enter text"]').click().type('Testing the Notes textbox');
        // Choosing stage if application in Application Details
        cy.get('#select2-chosen-88').click();
        cy.contains('Not Issued').click();
        // test funding available
        cy.get('[data-bind="text:node.config.trueLabel"]').click();
        cy.get('[data-bind="text:node.config.falseLabel"]').click();

        cy.contains('Save and Continue').click();
    })
    it('Test Page 3: Geospatial Detail', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        // Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        // Page 2/12
        // Filling the Application Details
        cy.wait(5000);
        cy.get('[aria-label="Site Name"]').click().type('Site Name test 1');
        cy.contains("Save and Continue").click();

        // Page 3/11
        // Geospatial Details
        cy.wait(5000);
        cy.contains('Next Step').click();

    })
    it('Test Page 4: Locations Details', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        // Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        // Page 2/12
        // Filling the Application Details
        cy.wait(5000);
        cy.get('[aria-label="Site Name"]').click().type('Site Name test 1');
        cy.contains("Save and Continue").click();

        // Page 3/11
        // Geospatial Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 4/11
        // Location Details
        cy.wait(5000);
        cy.get('[aria-label="Street"]').click().type('Street 1');
        cy.get('[aria-label="Town or City"]').click().type('Town or City 1');
        cy.get('[aria-label="County "]').click().type('County 1');
        cy.get('[aria-label="Postcode"]').click().type('Postcode 1');
        // Townland
        cy.get('#s2id_autogen209').click();
        cy.contains('Essex').click();

        cy.contains('Save and Continue').click();
    })
    it.only('Test Page 5: Additional Files', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        // Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        // Page 2/12
        // Filling the Application Details
        cy.wait(5000);
        cy.get('[aria-label="Site Name"]').click().type('Site Name test 1');
        cy.contains("Save and Continue").click();

        // Page 3/11
        // Geospatial Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 4/11
        // Location Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 5/11
        // Additional Files
        cy.wait(5000);

        // Uploaded Application form
        cy.get('[aria-label="Have you uploaded an Application Form?"]').contains('No').click();
        cy.get('[aria-label="Have you uploaded an Application Form?"]').contains('Yes').click();
        // Uploaded POW file
        cy.get('[aria-label="Have you uploaded a POW file?"]').contains('No').click();
        cy.get('[aria-label="Have you uploaded a POW file?"]').contains('Yes').click();
        // Uploaded Council Letter
        cy.get('[aria-label="Have you uploaded a Council Letter?"]').contains('No').click();
        cy.get('[aria-label="Have you uploaded a Council Letter?"]').contains('Yes').click();
        // Uploaded Developer Funding Form
        cy.get('[aria-label="Have you uploaded a Developer Funding Form?"]').contains('No').click();
        cy.get('[aria-label="Have you uploaded a Developer Funding Form?"]').contains('Yes').click();
        
        cy.contains("Save and Continue").click();
    })
    it('Test Page 6: Something', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        // Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        // Page 2/12
        // Filling the Application Details
        cy.wait(5000);
        cy.get('[aria-label="Site Name"]').click().type('Site Name test 1');
        cy.contains("Save and Continue").click();

        // Page 3/11
        // Geospatial Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 4/11
        // Location Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 5/11
        // Additional Files
        cy.wait(5000);
        cy.contains('Next Step').click();
    })
    it('Goes through the Entire Excavation Workflow', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Page 1/11 
        //Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        // Page 2/12
        //Filling the Application Details
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
        // cy.wait(10000) // wait to load the textbox
        // cy.get('[data-cke-editorplaceholder="Enter text"]').click().type('Testing the Notes textbox');
        // Choosing stage if application in Application Details
        cy.get('#select2-chosen-88').click();
        cy.contains('Not Issued').click();
        // test funding available
        cy.get('[data-bind="text:node.config.trueLabel"]').click();
        cy.get('[data-bind="text:node.config.falseLabel"]').click();

        cy.contains('Save and Continue').click();

        // Page 3/11
        // Geospatial Details
        cy.wait(5000);
        cy.contains('Next Step').click();

        // Page 4/11
        // Location Details
        cy.wait(5000);
        cy.get('[aria-label="Street"]').click().type('Street 1');
        cy.get('[aria-label="Town or City"]').click().type('Town or City 1');
        cy.get('[aria-label="County "]').click().type('County 1');
        cy.get('[aria-label="Postcode"]').click().type('Postcode 1');
        // Townland
        cy.get('#s2id_autogen209').click();
        cy.contains('Essex').click();

        cy.contains('Save and Continue').click();


        // Page 5/11
        // Additional Files

        // Page 6/11
        // Communications

        // Page 7/11
        // Record Decision

        // Page 8/11
        // Cover Letter

        // Page 9/11
        // Ammendments

        // Page 10/11
        // Excavation Report

        // Page 11/11
        // Summary
    })

    it('Application stage is final, giving flash message', function () {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow");
        cy.contains("Workflows");
        cy.contains("Excavation Licensing").click();
        // Starting the workflow

        // Create a new excavation license
        cy.contains("Start New").click();

        // Initialize excavation license
        cy.wait(5000);
        cy.contains("Save and Continue").click();

        cy.wait(10000) // wait to load the textbox
        // Choosing stage if application in Application Details
        cy.get('#select2-chosen-88').click();
        cy.contains('Final').click();

        cy.contains('Save and Continue').click();
        // Geospatial Details
    })
})

