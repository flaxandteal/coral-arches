describe('Going through the Assign Consultation Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new consultation and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Planning Consultation').click();
        cy.wait(2000);

        // Initial step 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Initial step - no label override here, so this renders under the
        // widget's own default label "Consultation ID", not "HA Number"/
        // "SMC Reference Number" like the other workflows that reuse this
        // same System Reference Numbers card do.
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Application Details tab
        cy.contains('Planning Reference').scrollIntoView();
        cy.get('[aria-label="Planning Reference"]').click().type('PLAN-TEST-01');

        // CM References card's widget label is "CM Reference", not "CM
        // Reference Number".
        cy.contains('CM Reference').scrollIntoView();
        cy.get('[aria-label="CM Reference"]').click().type('CM-TEST-01');

        // DfI Received Date - no label override on this workflow, so it
        // keeps its default widget label "Date Received from DfI".
        cy.contains('Date Received from DfI').scrollIntoView();
        cy.get('.card_component.dfi_received_date_value input.form-control').first().click();
        cy.get('.card_component.dfi_received_date_value .input-group-addon').click();

        // Application Type (show-hierarchy-change) renders the normal
        // "Application Type" reference dropdown plus an extra "Hierarchy"
        // domain-select widget for tracking hierarchy changes - only the
        // former is exercised here.
        cy.contains('Application Type').scrollIntoView();
        cy.get('input[aria-label="Application Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Classification').scrollIntoView();
        cy.get('input[aria-label="Classification"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Development Type').scrollIntoView();
        cy.get('input[aria-label="Development Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Related Heritage Asset(s)').scrollIntoView();
        cy.pickRelationshipFirst('Related Heritage Asset(s)');
        cy.wait(2000);

        // Contacts - a large card with many relationship pickers visible
        // (only Owner, Planning Body, Casework Officer and a handful of
        // others are hidden here); exercising a representative few.
        cy.contains('Agent').scrollIntoView();
        cy.pickRelationshipFirst('Agent');
        cy.wait(2000);
        cy.contains('Applicant').scrollIntoView();
        cy.pickRelationshipFirst('Applicant');
        cy.wait(2000);

        cy.contains('Application Reason').scrollIntoView();
        cy.get('[aria-label="Application Reason"]').click().type('Test application reason');

        cy.contains('Proposal Description').scrollIntoView();
        cy.get('[aria-label="Proposal Description"]').click().type('Test proposal description');

        cy.workflowNext();

        // Location Details tab - same Addresses/Council/Localities/Location
        // Descriptions structure as the other consultation-graph workflows.
        cy.wait(2000);
        cy.get('[aria-label="Building Name"]').click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Street"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Town or City"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Postcode"]').first().click().type('Testing Labs');
        cy.wait(2000);

        cy.pickRelationshipFirst('County');
        cy.wait(2000);
        cy.pickRelationshipFirst('Townland');
        cy.wait(2000);

        cy.get('.council').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.pickRelationshipFirst('Area Type');
        cy.wait(2000);
        cy.pickRelationshipFirst('Area Name');
        cy.wait(2000);

        cy.contains('Location Description').scrollIntoView();
        cy.get('[aria-label="Location Description"]').click().type('Test location description');

        cy.workflowNext();

        // Map tab - manually tested, see 01_add_garden
        cy.workflowNext();

        // Action tab - update-dates.js reads params.issueDateNode/
        // dueDateNode, but the ids configured for them in this JSON
        // (8322f9f6.../c4413ac8...) don't match any node in this nodegroup,
        // so the auto-due-date-from-issue-date linking never fires; the
        // component still falls back to rendering the card's normal
        // widgets, which is what's exercised below.
        cy.contains('Action Type').scrollIntoView();
        cy.get('input[aria-label="Action Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Status').scrollIntoView();
        cy.get('input[aria-label="Status"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Assigned to').scrollIntoView();
        cy.pickRelationshipFirst('Assigned to');
        cy.wait(2000);

        cy.get('.card_component.date_entered input.form-control').first().click();
        cy.get('.card_component.date_entered .input-group-addon').click();

        cy.contains('Internal Notes for Admin Team').scrollIntoView();
        cy.get('[aria-label="Internal Notes for Admin Team"]').click().type('Internal note');

        cy.workflowNext();

        // Responses tab - pdf-merger's responseFileNode/responseTeamNode
        // (5d401df8.../b15ee596...) don't exist anywhere in the graph, the
        // same class of gap flagged on the DAERA and HB/HM Planning
        // Consultation Response workflows, so this feature can't actually
        // merge/save a response here. This step also hides its own "save"
        // button (saveWithoutProgressing) and there is no workflow-wide
        // "Save and Complete Workflow" control on it either - every prior
        // step already persisted its own data via workflowNext, so reaching
        // this tab is the end of what this spec can drive.
        cy.get('.workflow-nav-tab').contains('Responses').click();
        cy.wait(2000);
    });
});
