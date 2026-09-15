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
        // Single-select reference-select-widget fields - scope by alias
        // class rather than input[aria-label] (see 12_add_building).
        cy.contains('Application Type').scrollIntoView();
        cy.pickCardOption('application_type');
        cy.wait(2000);

        cy.contains('Classification').scrollIntoView();
        cy.pickCardOption('classification_type');
        cy.wait(2000);

        cy.contains('Development Type').scrollIntoView();
        cy.pickCardOption('development_type');
        cy.wait(2000);

        // Related Heritage Asset(s) is a resource-instance-list (multi).
        cy.contains('Related Heritage Asset(s)').scrollIntoView();
        cy.pickCardOption('related_heritage_assets');
        cy.wait(2000);

        // Contacts - a large card with many relationship pickers visible
        // (only Owner, Planning Body, Casework Officer and a handful of
        // others are hidden here); exercising a representative few. Both
        // are resource-instance-list (multi).
        cy.contains('Agent').scrollIntoView();
        cy.pickCardOption('agent');
        cy.wait(2000);
        cy.contains('Applicant').scrollIntoView();
        cy.pickCardOption('applicant');
        cy.wait(2000);

        // Both are rich-text widgets, whose textarea CKEditor hides and which
        // arches' rich-text.htm never gives an aria-label. Scope by wrapper
        // class so each picks its own editor, not the other one on this tab.
        cy.contains('Application Reason').scrollIntoView();
        cy.typeRichText('consultation_description', 'Test application reason');

        cy.contains('Proposal Description').scrollIntoView();
        cy.typeRichText('proposal_text', 'Test proposal description');

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

        // Scope by alias class rather than pickRelationshipFirst - this is
        // a different graph (Consultation) from Add Garden/Building, so
        // single-vs-multi can't be assumed to match; county_value/townland
        // etc. work regardless either way.
        cy.pickCardOption('county_value');
        cy.wait(2000);
        cy.pickCardOption('townland');
        cy.wait(2000);

        cy.get('.council').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.pickCardOption('area_type');
        cy.wait(2000);
        cy.pickCardOption('area_name');
        cy.wait(2000);

        cy.contains('Location Description').scrollIntoView();
        cy.typeRichText('location_description', 'Test location description');

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
        cy.pickCardOption('action_type');
        cy.wait(2000);

        // "Status" node's own alias is "action_status", not "status".
        cy.contains('Status').scrollIntoView();
        cy.pickCardOption('action_status');
        cy.wait(2000);

        // Resource-instance-list (multi). Named, not first: Update Response Assignee
        // rejects anyone outside the HM/HB Planning groups, and the picker offers
        // every Person. This account is seeded into HM Planning Users.
        cy.contains('Assigned to').scrollIntoView();
        cy.pickCardOption('assigned_to_n1', 'e2e_hm_planning_users');
        cy.wait(2000);

        cy.get('.card_component.date_entered input.form-control').first().click();
        cy.get('.card_component.date_entered .input-group-addon').click();

        cy.contains('Internal Notes for Admin Team').scrollIntoView();
        cy.typeRichText('action_text', 'Internal note');

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
