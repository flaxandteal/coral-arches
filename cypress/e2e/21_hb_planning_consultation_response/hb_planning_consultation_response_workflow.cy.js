describe('Going through the HB Planning Consultation Response Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new response and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('HB Planning Consultation Response').click();
        cy.wait(2000);

        // Initial step 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Initial step - no label override, renders under the widget's own
        // default label "Consultation ID".
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Assign tab - Assignment card. "Assigned To" is a
        // resource-instance-list (multi), scope by alias class.
        cy.contains('Assigned To').scrollIntoView();
        cy.pickCardOption('assigned_to');
        cy.wait(2000);
        cy.contains('Assignment Team').scrollIntoView();
        cy.pickCardOption('assignment_team');
        cy.wait(2000);

        // Action card - Action Type and Action text are hidden here, so
        // only Status, Assigned to (lowercase "t" - a different, also multi,
        // node to the Assignment card's "Assigned To" above) and the date
        // fields render.
        cy.contains('Status').scrollIntoView();
        cy.pickCardOption('action_status');
        cy.wait(2000);
        cy.pickCardOption('assigned_to_n1');
        cy.wait(2000);

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
        cy.pickCardOption('response_team');
        cy.wait(2000);
        cy.contains('Response Type').scrollIntoView();
        cy.pickCardOption('response_type');
        cy.wait(2000);

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
