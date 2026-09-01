describe('Going through the FWM Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('FMW Inspection').click();
        cy.contains('Start New').click();

        // Initial step tab
        cy.get('.workflow-nav-tab').contains('Report').click();
        cy.get('.workflow-nav-tab').contains('Map').click();
        cy.get('.workflow-nav-tab').contains('Documentation').click();
        cy.get('.workflow-nav-tab').contains('Sign Off').click();
        cy.wait(2000);
        cy.contains('Save and Continue').click();

        // Report tab. Its widgets render lazily, so wait for select2 to appear
        // before touching anything.
        cy.get('.select2-selection', { timeout: 60000 }).should('exist');
        cy.wait(8000);

        cy.pickRelationshipFirst('SMR Number(s)');
        cy.wait(1000);

        cy.pickOptionByLabelPrefix('Land Use');
        cy.wait(1000);

        // Date of Visit is a datepicker — type rather than click the addon.
        cy.get('[aria-label="Date of Visit"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });

        // Condition/Risk Score aria-labels embed the current value, so match on
        // the prefix instead of a hard-coded score.
        cy.pickOptionByLabelPrefix('Condition Score, ');
        cy.pickOptionByLabelPrefix('Risk Score, ');

        cy.pickRelationshipFirst('Owner(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Occupier(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('FM Warden(s)');
        cy.wait(2000);
        cy.workflowNext();

        cy.wait(4000);
        cy.get('.irish_grid_tm65_ > .row > .form-group > :nth-child(3) > span > ul > :nth-child(1)').click();
        cy.get('.irish_grid_tm65_ > .row > .form-group > :nth-child(3) > #coordinatePoint').clear('J1025169962');
        cy.get('.irish_grid_tm65_ > .row > .form-group > :nth-child(3) > #coordinatePoint').type('J1025169962{enter}');
        cy.get('.irish_grid_tm65_ > .row').click();

        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Documentation tab
        cy.wait(2000);
        cy.get('.bord-top > .btn').contains('Select Files')
        //cy.get('.media-block').selectFile('cypress/e2e/04_curatorial_inspection_workflow/testFileForUpload.txt');
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign Off tab
        cy.wait(2000);
        cy.get('.widget-input-label').contains('Signed Off On');
        cy.get('[aria-label="Signed Off On"]').click();
        cy.get('.date-icon').first().click();

        cy.get('.send_papers').contains('Send Papers');
        cy.get('.send_papers').contains('Yes').click(); 

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
