describe('Going through the Archive Cataloguing Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Archive Cataloguing').click();
        cy.contains('Start New').click();
        // Let the Archive Reference tab render before advancing, otherwise the
        // forward click lands before the workflow has mounted its first step.
        cy.wait(6000);
        cy.workflowNext();

        // Archive Source Details — the tab renders lazily, so wait for its
        // first widget rather than a fixed sub-second pause.
        cy.get('input[aria-label="File Title"]', { timeout: 60000 }).should('be.visible').type('Test Source Name');
        cy.get('[aria-label="Subtitle"]').should('be.visible').type('Test Subtitle');
        cy.get('[aria-label="File ID (key)"]').should('be.visible').type('TestId');
        // These select2s carry their current value in the aria-label
        // ("Archive Source Type, Select an option"), so match on the prefix.
        cy.pickOptionByLabelPrefix('Archive Source Type, ', 'Genre');
        cy.wait(500);
        cy.pickOptionByLabelPrefix('File Status, ', 'Destroyed');
        cy.type_ckeditor('editor1', 'test description');
        cy.wait(500);
        cy.workflowNext();

        // Archive Source Creation
        cy.get('input[aria-label="Author Name"]', { timeout: 60000 }).should('be.visible').type('Test Author Name');
        cy.get('input[aria-label="Editor Name(s)"]').should('be.visible').type('Test Editor Name');
        // Type into the datepickers — clicking the addon opens no picker.
        cy.get('input[aria-label="Start Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.get('input[aria-label="End Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.type_ckeditor('editor3', 'test statement of responsibility');
        cy.wait(500);
        cy.workflowNext();

        // Repository Storage Location
        cy.wait(1000);
        cy.get('span').contains('Responsible Team').should('be.visible').siblings('.row').click({force: true});
        cy.wait(500);
        cy.get('span').contains('Storage Building Name').should('be.visible').siblings('.col-xs-12').click({force: true});
        cy.get('input[aria-label="Storage Room Name"]').should('be.visible').type('Test Storage Room Name');
        cy.get('input[aria-label="Storage Shelf Name"]').should('be.visible').type('Test Storage Shelf Name');
        cy.get('input[aria-label="Storage Box Name"]').should('be.visible').type('Test Storage Box Name');
        cy.contains('Save and Continue').click();

        // Archive Loan History
        cy.wait(500);
        cy.get('[aria-label="Person or Organization, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('input[aria-label="Start Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.get('input[aria-label="End Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.get('.workflow-component-element').get('.btn.btn-workflow-tile.btn-success').should('be.visible').contains('Add').click();
        cy.get('.workflow-top-control > .btn-success > .verbose').click();
    });
});
