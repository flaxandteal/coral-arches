describe('Going through the DAERA Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new AIL consultation and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('DAERA Workflow').click();
        cy.wait(2000);

        // Start 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab - generate-ail-number, no label override so this
        // renders under the widget's own default label "Consultation ID".
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Consultation tab
        // get-selected-monument-details-with-count ("Heritage Asseets
        // details") targets nodegroup 9a57f3c4-04b9-11f0-9182-9e7c335817fb,
        // which does not exist anywhere in the graph - flagged as an
        // unfixable gap earlier (no candidate to remap to). This means
        // there is currently no working UI on this workflow to actually
        // link a Heritage Asset to the consultation.
        // Likewise "daera-dates" (update-dates, nodegroup 5d6eecde...) and
        // the "Consultation Type" card (nodegroupid 34aca644...) both
        // target nodegroups that don't exist either, so neither renders.

        cy.contains('Applicant').scrollIntoView();
        cy.pickRelationshipFirst('Applicant');
        cy.wait(2000);

        // "Comments" card - node c36808b0 ("Advice text") exists and its
        // config.label override to "Comments" may or may not take effect
        // depending on whether this card's rendering path applies node-level
        // config overrides for a plain default-card; scoping by the node's
        // alias sidesteps needing to know which label actually rendered.
        cy.get('.card_component.advice_text').scrollIntoView();
        cy.get('.card_component.advice_text textarea, .card_component.advice_text input.form-control')
            .first().click().type('Consultation comments');

        // "Records NI" card - its relabel target (9d15ac44...) doesn't
        // exist either, so this keeps its real default widget label
        // "CM Reference" (see cards_x_nodes_x_widgets), same as the CM
        // References card on the other consultation-graph workflows.
        cy.contains('CM Reference').scrollIntoView();
        cy.get('[aria-label="CM Reference"]').click().type('CM-TEST-01');

        cy.contains('Consultation status').scrollIntoView();
        cy.get('input[aria-label="Consultation status"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.workflowNext();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext();

        // Letters tab - file-template's underlying response/letter nodes
        // (b15ee596.../6d09da12.../0c3e516c...) don't exist in the graph,
        // same gap as the Responses step on Assign Consultation, so this
        // step is skipped straight to Sign off via the tab bar.
        cy.get('.workflow-nav-tab').contains('Sign off').click();
        cy.wait(2000);

        // Sign off tab - required, last step. This step's hiddenNodes list
        // targets ~15 node ids, none of which match any real node in the
        // Sign Off nodegroup, so every field renders (same situation as
        // Curatorial's Sign Off step). update-deadline auto-computes
        // "Within Deadline" from an unrelated Agriculture Dates tile that
        // won't exist on a fresh resource, so it safely defaults to false
        // without needing any interaction here.
        cy.contains('Cur E').scrollIntoView();
        cy.pickRelationshipFirst('Cur E');
        cy.wait(2000);

        cy.setBooleanTrue('send_papers');

        cy.get('.card_component.sign_off_date_value input.form-control').first().click();
        cy.get('.card_component.sign_off_date_value .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
