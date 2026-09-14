describe('Going through the Scheduled Monument Consent Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    // cy.workflowNext() asserts the .step-counter value increases, which
    // assumes the counter tracks the tab currently on screen. It doesn't
    // here: open-scheduled-monument-consent-workflow.js's startNew() POSTs
    // the "Associated Building" tile directly via /api/tiles/ before the
    // workflow UI even loads (same pattern confirmed broken in
    // 16_evaluation_meeting), so the step-builder's furthest-complete-step
    // detection starts the counter already past every tab this test's own
    // clicks would otherwise advance it to. This clicks the same button
    // without that assertion; the cy.contains()/cy.wait() calls around each
    // use are what actually verify the navigation worked.
    const clickNext = () => {
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled]):not(.disabled)')
            .contains(/Save and Continue|Next Step/)
            .click();
        cy.wait(2000);
    };

    it('Create new SMC and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('SMC').click();
        cy.wait(2000);

        // Unlike a generic open-workflow launcher, this one has its own
        // open-scheduled-monument-consent-workflow component/template:
        // "Start New" is bound `disable: !selectedHA()`, so it stays
        // disabled until a Heritage Asset is picked from the "Select
        // Heritage Asset" resource-instance-multiselect-widget above it
        // (filtered to HAs with a non-null SMR Number - the seeded "HA/04"
        // Testing" carries "SMR-TEST-004" and satisfies that; its display
        // name is "HA/04 Testing", not the SMR value itself).
        cy.get('.select2-selection').first().click();
        cy.select2Search('HA/04');
        cy.get('.select2-results__option').contains('HA/04').click();
        cy.wait(2000);

        // BLOCKED - confirmed backend bug, not fixable from the test.
        // Clicking "Start New" here POSTs to /open-workflow (coral's own
        // view, coral/views/open_workflow.py), which 500s:
        //   File "coral/views/open_workflow.py", line 155, in
        //   get_parent_tile_lookups
        //     nodegroup=self.nodegroups[nodegroup_id],
        //   KeyError: '083e2924-ca61-11ee-afca-0242ac180006'
        // - the same class of stale/nonexistent-nodegroup-id bug documented
        // all over this test suite, but this time it crashes the server
        // outright instead of silently no-op'ing, so the workflow can never
        // actually open. Confirmed via `docker logs coral-arches-1`
        // immediately after this click.
        cy.get('.btn-success').contains('Start New').click();

        // Start Meeting tab - the "Consultation ID" -> "SMC Reference
        // Number" labels override never actually applies (same no-op as
        // 16_evaluation_meeting's "Consultation ID" -> "Meeting ID" -
        // confirmed via cards_x_nodes_x_widgets: the widget's real label is
        // "Consultation ID"), so the field keeps its real default label.
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');

        // "Monument or Area" is a resource-instance-list (multi), so scope
        // by alias class rather than pickRelationshipFirst.
        cy.contains('Monument or Area').scrollIntoView();
        cy.pickCardOption('related_monuments_and_areas');
        cy.wait(2000);

        clickNext();

        // Details tab
        // get-ha-smc-details ("Select Heritage Assets") renders a summary of
        // the building picked on Start Meeting - read-only, nothing to input.
        cy.wait(2000);

        // Single-select reference-select-widget - scope by alias class
        // rather than input[aria-label].
        cy.contains('Distinction').scrollIntoView();
        cy.pickCardOption('distinction');
        cy.wait(2000);

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

        // "Applicant" -> "Entered By" label override. Multi (resource-
        // instance-list), scope by alias class. This card also leaves
        // Agent/Applicant organisation/Referred to visible (2 of the 4
        // hiddenNodes ids don't exist in this DB), filled in too.
        cy.contains('Entered By').scrollIntoView();
        cy.pickCardOption('applicant_n1');
        cy.wait(2000);
        cy.pickCardOption('agent_n1');
        cy.wait(2000);
        cy.pickCardOption('applicant_organisation');
        cy.wait(2000);
        cy.pickCardOption('referred_to');
        cy.wait(2000);

        clickNext();

        // Relevant Parties tab - reuses the same Contacts card as Evaluation
        // Meeting, relabelled here to Agent(s)/Owner(s)/Applicant(s)/
        // Occupier(s) (Owner and Occupier(s) already render under those
        // exact names by default, so the override is a no-op for them but
        // the end result is the same label either way). All four are
        // resource-instance-list (multi), so scope by alias class.
        cy.contains('Agent(s)').scrollIntoView();
        cy.pickCardOption('agent');
        cy.wait(2000);
        cy.contains('Owner(s)').scrollIntoView();
        cy.pickCardOption('owner');
        cy.wait(2000);
        cy.contains('Applicant(s)').scrollIntoView();
        cy.pickCardOption('applicant');
        cy.wait(2000);
        cy.contains('Occupier(s)').scrollIntoView();
        cy.pickCardOption('occupier');
        cy.wait(2000);

        clickNext();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        clickNext();

        // Letter tab - file-template letter generation is optional
        // (saveWithoutProgressing, "save" button hidden on this step), skip
        // straight to Decision via the tab bar.
        cy.get('.workflow-nav-tab').contains('Decision').click();
        cy.wait(2000);

        // Decision tab - single-select reference-select-widget fields,
        // scoped by alias class ("Status" node's own alias is "status_n1",
        // not "status"). Issued By uses a custom "user-to-model-select"
        // widget restricted to sign-off groups (via a nodeOptions override
        // that targets a node id not present in this nodegroup, so it's a
        // no-op and the field falls back to a plain resource-instance
        // picker, which is single-value so pickRelationshipFirst is fine).
        cy.contains('Consent').scrollIntoView();
        cy.pickCardOption('consent');
        cy.wait(2000);

        cy.contains('Status').scrollIntoView();
        cy.pickCardOption('status_n1');
        cy.wait(2000);

        cy.contains('Issued By').scrollIntoView();
        cy.pickRelationshipFirst('Issued By');
        cy.wait(2000);

        cy.get('[aria-label="Works to be carried out"]').click().type('Test works description');

        cy.get('.card_component.provisional_issued_date input.form-control').first().click();
        cy.get('.card_component.provisional_issued_date .input-group-addon').click();
        cy.wait(2000);
        cy.get('.card_component.actual_issued_date input.form-control').first().click();
        cy.get('.card_component.actual_issued_date .input-group-addon').click();

        cy.contains('Works to be carried out').scrollIntoView();
        cy.get('[aria-label="Works to be carried out"]').click().type('Test works description');

        cy.get('.card_component.actual_issued_date input.form-control').first().click();
        cy.get('.card_component.actual_issued_date .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
