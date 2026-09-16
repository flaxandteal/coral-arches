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

        // Archive Source Details - the tab renders lazily, so wait for its
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
        // Type into the datepickers - clicking the addon opens no picker.
        cy.get('input[aria-label="Start Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.get('input[aria-label="End Date"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });
        cy.type_ckeditor('editor3', 'test statement of responsibility');
        cy.wait(500);
        cy.workflowNext();

        // Repository Storage Location. Responsible Team is a
        // resource-instance-select (Archive Source.json, widget
        // ff3c400a-76ec-...), so open and pick it the same way every other
        // relationship field in this suite does; the previous blind
        // `.siblings('.row').click()` didn't select anything. Storage
        // Building Name is now a controlled-list reference widget
        // (Archive Source.json node f1553fe4-ba03-..., datatype "reference"),
        // rendered as a select2 dropdown rather than a text input, so pick
        // an option like the other reference widgets in this suite instead
        // of typing into it. Storage Room/Shelf/Box Name below it are still
        // plain string widgets.
        cy.wait(1000);
        cy.pickRelationshipFirst('Responsible Team');
        cy.wait(1000);
        cy.pickOptionByLabelPrefix('Storage Building Name, ');
        cy.get('input[aria-label="Storage Room Name"]').should('be.visible').type('Test Storage Room Name');
        cy.get('input[aria-label="Storage Shelf Name"]').should('be.visible').type('Test Storage Shelf Name');
        cy.get('input[aria-label="Storage Box Name"]').should('be.visible').type('Test Storage Box Name');
        cy.workflowNext();          // Repository Storage Location -> Archive Loan History

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

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
