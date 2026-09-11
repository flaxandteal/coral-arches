describe('Going through the Curatorial Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new inspection and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Curatorial Inspection').click();
        cy.wait(2000);

        // Start 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab - no label override, so this renders under the widget's
        // own default label "Consultation ID" (same as Assign Consultation).
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Asset Details tab
        // get-selected-monument-details (reused from the FMW Inspection
        // workflow) relabels the "Monument or Area" picker to "SMR Number"
        // and shows a read-only summary panel for the selected monument.
        cy.contains('SMR Number').scrollIntoView();
        cy.pickRelationshipFirst('SMR Number');
        cy.wait(2000);

        // Two cards here (nodegroupids 0ecfd47a.../a2cda8b4...) reference
        // nodegroups that don't exist in this DB at all - same class of gap
        // documented on the Add IHR workflow - so they never render.

        cy.contains('Log Date').scrollIntoView();
        cy.get('.card_component.log_date input.form-control').first().click();
        cy.get('.card_component.log_date .input-group-addon').click();

        cy.contains('Reason').scrollIntoView();
        cy.get('[aria-label="Reason"]').click().type('Curatorial inspection reason');

        cy.workflowNext();

        // Attendees Details tab - this card's hiddenNodes and its CWT Area
        // Manager(s)/Archaeologist(s)/CWT Area Supervisor(s) relabels all
        // target node ids that don't exist in this nodegroup either, so
        // every field in this large Contacts card renders visible under its
        // real default label; only a representative few are exercised here.
        cy.contains('Owner').scrollIntoView();
        cy.pickRelationshipFirst('Owner');
        cy.wait(2000);
        cy.contains('Occupier').scrollIntoView();
        cy.pickRelationshipFirst('Occupier');
        cy.wait(2000);
        cy.contains('Architect').scrollIntoView();
        cy.pickRelationshipFirst('Architect');
        cy.wait(2000);
        cy.contains('Historian').scrollIntoView();
        cy.pickRelationshipFirst('Historian');
        cy.wait(2000);

        cy.workflowNext();

        // Comments tab (cardinality "n") - the two isrequired overrides
        // here also target nonexistent node ids, so nothing is actually
        // enforced as required.
        cy.contains('Curatorial Description').scrollIntoView();
        cy.get('input[aria-label="Curatorial Description Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Curatorial Description"]').click().type('Test curatorial comment');
        cy.get('.btn-success').contains('Add').click();
        cy.wait(2500);

        cy.workflowNext();

        // Upload tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext();

        // Sign Off tab - last step; unlike the other Sign Off style steps
        // in this suite, "save" isn't hidden here so the usual completion
        // button is available. "Cur E" is a resource-instance picker whose
        // intended "user-to-model-select" sign-off-group restriction never
        // applies (its nodeOptions target another nonexistent node id), so
        // it falls back to a plain relationship picker.
        cy.contains('Cur E').scrollIntoView();
        cy.pickRelationshipFirst('Cur E');
        cy.wait(2000);

        cy.setBooleanTrue('send_papers');
        cy.setBooleanTrue('within_deadline');

        cy.get('.card_component.sign_off_date_value input.form-control').first().click();
        cy.get('.card_component.sign_off_date_value .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
