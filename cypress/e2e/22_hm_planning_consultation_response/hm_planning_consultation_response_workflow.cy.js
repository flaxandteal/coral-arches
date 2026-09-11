describe('Going through the HM Planning Consultation Response Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new response and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('HM Planning Consultation Response').click();
        cy.wait(2000);

        // Initial step 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Initial step - no label override, renders under the widget's own
        // default label "Consultation ID".
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Assign tab - Assignment card
        cy.contains('Assigned To').scrollIntoView();
        cy.pickRelationshipFirst('Assigned To');
        cy.wait(2000);
        cy.contains('Assignment Team').scrollIntoView();
        cy.get('input[aria-label="Assignment Team"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // Action card - Action Type and Action text are hidden here, so
        // only Status, Assigned to (lowercase "t" - a different node to the
        // Assignment card's "Assigned To" above) and the date fields render.
        cy.contains('Status').scrollIntoView();
        cy.get('input[aria-label="Status"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.date_entered input.form-control').first().click();
        cy.get('.card_component.date_entered .input-group-addon').click();

        cy.workflowNext();

        // Application Summary tab - pc-summary is a read-only render-nodes
        // display, nothing to input.
        cy.wait(2000);
        cy.workflowNext();

        // Map tab - manually tested, see 01_add_garden
        cy.workflowNext();

        // Summary tab - Response Action card
        cy.contains('Response Summary').scrollIntoView();
        cy.get('[aria-label="Response Summary"]').click().type('Test response summary');
        cy.wait(2000);
        cy.contains('Response Team').scrollIntoView();
        cy.get('input[aria-label="Response Team"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.contains('Response Type').scrollIntoView();
        cy.get('input[aria-label="Response Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.workflowNext();

        // Upload Response tab - related-document-upload's
        // resourceModelDigitalObjectNodeGroupId (31e5ece6...) doesn't exist
        // in the graph, but that param is only read at save time when
        // actually linking an uploaded file's tile, not at render time, so
        // the widget itself still renders fine; only "Select Files" is
        // exercised here, same as the other upload steps in this suite.
        cy.get('.bord-top > .btn').contains('Select Files').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
