describe('Going through the FWM Inspection Workflow', function () {

    beforeEach(() => {
        cy.rewriteHeaders();
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

        //Report Tab
        cy.wait(8000);
        // SMR number dropdown
        cy.get(':nth-child(1) > .workflow-component').contains('Add new Relationship').click();
        cy.wait(3000);
        cy.get('.select2-results__option').first().click();

        // Land use dropdown
        cy.get('[aria-label="Land Use"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Date of vist date selector
        cy.get('[aria-label="Date of Visit"]').scrollIntoView().should('be.visible').click();

        // Condition score dropdown
        cy.get('[aria-label="Condition Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Risk score dropdwon
        cy.get('[aria-label="Risk Score, 1"]').scrollIntoView().should('be.visible').click();
        cy.get('.select2-results__option').first().click();

        // Owner dropdown
        cy.get('[aria-label="Owner(s), Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').contains('John Smith').click({force: true});
        cy.wait(2000);

        // Occupier dropdown
        cy.get('[aria-label="Occupier(s), Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').contains('John Smith').click({force: true});

        // fm warden dropdown
        cy.wait(2000);
        cy.get('[aria-label="FM Warden(s), Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').contains('John Smith').click({force: true});
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click()

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
