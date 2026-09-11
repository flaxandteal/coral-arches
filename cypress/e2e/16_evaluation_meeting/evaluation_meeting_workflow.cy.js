describe('Going through the Evaluation Meeting Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new meeting and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Evaluation Meeting').click();
        cy.wait(2000);

        // Start Meeting 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start Meeting tab
        cy.wait(2500);
        cy.contains('Meeting ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');

        // Associated Building - links this meeting to an existing Heritage
        // Asset (widget label is "Monument or Area", not the workflow's own
        // "Associated Building" semanticName - see cards_x_nodes_x_widgets).
        cy.contains('Monument or Area').scrollIntoView();
        cy.pickRelationshipFirst('Monument or Area');
        cy.wait(2000);

        cy.workflowNext();

        // Details tab
        cy.contains('Listing Query').scrollIntoView();
        cy.get('[aria-label="LQ"]').click().type('LQ-TEST-01');

        // "Monument or Area" (HB) reappears here as a disabled read-only
        // display of the building picked on Start Meeting - nothing to do.

        cy.contains('Evaluation Meeting Type').scrollIntoView();
        cy.get('input[aria-label="Evaluation Meeting Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Full Survey Requirement Type').scrollIntoView();
        cy.get('input[aria-label="Full Survey Requirement Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // Consultation Dates - the "Date Consulted" -> "Meeting Date" label
        // override in the JSON doesn't match any node in this nodegroup (it
        // has Log Date/Target Date/Completion Date, no "Date Consulted"), so
        // it's a silent no-op; Log Date is the field that's actually visible
        // (Target Date Start and Completion Date are hidden).
        cy.contains('Log Date').scrollIntoView();
        cy.get('.card_component.log_date input.form-control').first().click();
        cy.get('.card_component.log_date .input-group-addon').click();

        // Contacts - Architect/Historian get relabelled "Architect
        // Present"/"Historian Present" by this card's labels override.
        cy.contains('Architect Present').scrollIntoView();
        cy.pickRelationshipFirst('Architect Present');
        cy.wait(2000);
        cy.contains('Historian Present').scrollIntoView();
        cy.pickRelationshipFirst('Historian Present');
        cy.wait(2000);

        cy.contains('Reason').scrollIntoView();
        cy.get('[aria-label="Reason"]').click().type('Evaluation meeting reason');

        cy.workflowNext();

        // Location Details tab - read-only "show-nodes" summary of the
        // linked Heritage Asset's location fields, nothing to input.
        cy.contains('Heritage Asset').should('be.visible');
        cy.workflowNext();

        // Evaluation tab - saveWithoutProgressing, this is the last step.
        // get-designation-details ("Existing Grade") is a read-only display
        // of the HA's current designation, no input.
        cy.contains('Criteria').scrollIntoView();
        cy.get('input[aria-label="Criteria"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('HAR Consideration').scrollIntoView();
        cy.get('input[aria-label="HAR Consideration"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Proposed Grade Type').scrollIntoView();
        cy.get('input[aria-label="Proposed Grade Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // The "Sign Off Date" nodeOptions override in the JSON targets node
        // id 5ffdc00e-03ad-11ef-948f-0242ac150003, which does not exist
        // anywhere in this nodegroup - same class of stale-id gap flagged
        // elsewhere, left as-is rather than guessed at.

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
