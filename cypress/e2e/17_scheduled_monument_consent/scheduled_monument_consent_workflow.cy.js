describe('Going through the Scheduled Monument Consent Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new SMC and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('SMC').click();
        cy.wait(2000);

        // Start Meeting 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start Meeting tab
        cy.wait(2500);
        cy.contains('SMC Reference Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');

        cy.contains('Monument or Area').scrollIntoView();
        cy.pickRelationshipFirst('Monument or Area');
        cy.wait(2000);

        cy.workflowNext();

        // Details tab
        // get-ha-smc-details ("Select Heritage Assets") renders a summary of
        // the building picked on Start Meeting - read-only, nothing to input.
        cy.wait(2000);

        cy.contains('Distinction').scrollIntoView();
        cy.get('input[aria-label="Distinction"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // "Consultation Name" -> "Application Reference" label override
        // (the widget's own default label matches "Consultation Name"
        // exactly, so this one actually takes effect).
        cy.contains('Application Reference').scrollIntoView();
        cy.get('[aria-label="Application Reference"]').click().type('SMC-APP-01');

        // CM References card's widget label is "CM Reference", not "CM
        // Reference Number" (the node's own name) - see cards_x_nodes_x_widgets.
        cy.contains('CM Reference').scrollIntoView();
        cy.get('[aria-label="CM Reference"]').click().type('CM-TEST-01');

        // "Date Received from DfI" -> "Received Date" label override
        cy.contains('Received Date').scrollIntoView();
        cy.get('.card_component.dfi_received_date_value input.form-control').first().click();
        cy.get('.card_component.dfi_received_date_value .input-group-addon').click();

        // "Reason" -> "Proposal Summary" label override
        cy.contains('Proposal Summary').scrollIntoView();
        cy.get('[aria-label="Proposal Summary"]').click().type('Proposed works summary');

        // "Applicant" -> "Entered By" label override
        cy.contains('Entered By').scrollIntoView();
        cy.pickRelationshipFirst('Entered By');
        cy.wait(2000);

        cy.workflowNext();

        // Relevant Parties tab - reuses the same Contacts card as Evaluation
        // Meeting, relabelled here to Agent(s)/Owner(s)/Applicant(s)/
        // Occupier(s) (Owner and Occupier(s) already render under those
        // exact names by default, so the override is a no-op for them but
        // the end result is the same label either way).
        cy.contains('Agent(s)').scrollIntoView();
        cy.pickRelationshipFirst('Agent(s)');
        cy.wait(2000);
        cy.contains('Owner(s)').scrollIntoView();
        cy.pickRelationshipFirst('Owner(s)');
        cy.wait(2000);
        cy.contains('Applicant(s)').scrollIntoView();
        cy.pickRelationshipFirst('Applicant(s)');
        cy.wait(2000);
        cy.contains('Occupier(s)').scrollIntoView();
        cy.pickRelationshipFirst('Occupier(s)');
        cy.wait(2000);

        cy.workflowNext();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext();

        // Letter tab - file-template letter generation is optional
        // (saveWithoutProgressing, "save" button hidden on this step), skip
        // straight to Decision via the tab bar.
        cy.get('.workflow-nav-tab').contains('Decision').click();
        cy.wait(2000);

        // Decision tab - Issued By uses a custom "user-to-model-select"
        // widget restricted to sign-off groups (via a nodeOptions override
        // that targets a node id not present in this nodegroup, so it's a
        // no-op and the field falls back to a plain resource-instance
        // picker) - skipped here, consistent with other Person/Group
        // relationship pickers left untouched elsewhere in this suite.
        cy.contains('Consent').scrollIntoView();
        cy.get('input[aria-label="Consent"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Status').scrollIntoView();
        cy.get('input[aria-label="Status"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Works to be carried out').scrollIntoView();
        cy.get('[aria-label="Works to be carried out"]').click().type('Test works description');

        cy.get('.card_component.actual_issued_date input.form-control').first().click();
        cy.get('.card_component.actual_issued_date .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
