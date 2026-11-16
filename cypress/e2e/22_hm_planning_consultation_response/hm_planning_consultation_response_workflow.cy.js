describe('Going through the HM Planning Consultation Response Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new response and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('HM Planning Consultation Response').click();
        cy.wait(2000);

        // There is no "Start New" here. coral/plugins/open-workflow.json sets
        // disableStartNew on this workflow, and the template only renders that button
        // under `if: !workflow().disableStartNew` - a response can only be OPENED, on a
        // consultation the Planning Consultation workflow (18) already assigned.
        cy.get('[aria-label="Select Licence, Please select from below"]').click();
        cy.wait(3000);
        cy.select2Search('PLAN-TEST-01');
        cy.wait(2000);
        cy.get('.select2-results__option')
            .not('.loading-results')
            .not('.select2-results__option--load-more')
            .not('.select2-results__message')
            .contains('PLAN-TEST-01')
            .click();
        cy.wait(2000);
        cy.get('.btn-primary').contains('Open Selected').click();

        // Initial step - no label override, renders under the widget's own
        // default label "Consultation ID".
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Assign tab. Nothing on this card is pickable in a response workflow:
        // Assignment Team is hidden (widget.visible(false), so still in the DOM), and Assigned To is
        // disabled in nodeOptions because the Update Response Assignee function sets it
        // from the consultation side. Clicking either opens no dropdown.
        cy.get('.widget-wrapper.assigned_to').should('exist');
        cy.get('.widget-wrapper.assignment_team').should('not.be.visible');
        cy.wait(1000);

        // Action card - this workflow hides six of its nodes (Action Type, Action text,
        // Action Status, Date Entered, Date Uploaded and "Assigned to"), all of which
        // belong to the Planning Consultation workflow that assigns the work, not to the
        // team responding to it. Target Date is what is left to see.
        cy.get('.widget-wrapper.action_status').should('not.be.visible');
        cy.get('.widget-wrapper.assigned_to_n1').should('not.be.visible');
        cy.wait(1000);

        cy.workflowNext();

        // Application Summary tab - pc-summary is a read-only render-nodes
        // display, nothing to input.
        cy.wait(2000);
        cy.workflowNext();

        // Map tab - manually tested, see 01_add_garden
        cy.workflowNext();

        // Summary tab - Response Action card
        // Response Summary is a rich-text widget: CKEditor replaces the textarea, so
        // there is no [aria-label] input to type into.
        cy.typeRichText('response_summary_value', 'Test response summary');
        cy.wait(2000);
        // Response Team is hidden here too, and prefilled with the responding team.
        cy.get('.widget-wrapper.response_team').should('not.be.visible');
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
