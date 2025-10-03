describe('Going through the Archive Cataloguing Workflow', function () {

    beforeEach(() => {
        cy.rewriteHeaders();
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Start new and go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Archive Cataloguing').click();
        cy.contains('Start New').click();

        cy.contains('Save and Continue').click();

        // Archive Source Details
        cy.wait(900);
        cy.get('input[aria-label="File Title"]').should('be.visible').type('Test Source Name');
        cy.get('[aria-label="Subtitle"]').should('be.visible').type('Test Subtitle');
        cy.get('[aria-label="File ID (key)"]').should('be.visible').type('TestId');
        cy.get('span').contains('Archive Source Type').should('be.visible').siblings('.archive_source_type').click();
        cy.wait(500);
        cy.get('.select2-results__options li').contains('Genre').click();
        cy.get('span').contains('File Status').siblings('.col-xs-12').click();
        cy.wait(500);
        cy.get('.select2-results__options li').contains('Destroyed');
        cy.get('.select2-results__options li').contains('For Review');
        cy.get('.select2-results__options li').contains('Closed');
        cy.get('.select2-results__options li').contains('Open');
        cy.get('.select2-results__options li').contains('Destroyed').click();
        cy.type_ckeditor('editor1', 'test description');
        cy.wait(500);
        cy.contains('Save and Continue').click();

        // Archive Source Creation
        cy.wait(500);
        cy.get('input[aria-label="Author Name"]').should('be.visible').type('Test Author Name');
        cy.get('input[aria-label="Editor Name(s)"]').should('be.visible').type('Test Editor Name');
        cy.get('[aria-label="Start Date"]').scrollIntoView().should('be.visible').click();

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');

        cy.get('input[aria-label="Start Date"]').siblings('.bootstrap-datetimepicker-widget').contains(dd).click( {force: true} );
        cy.get('[aria-label="End Date"]').scrollIntoView().should('be.visible').click( {force: true} );
        cy.get('input[aria-label="End Date"]').siblings('.bootstrap-datetimepicker-widget').contains(dd).click( {force: true} );
        cy.type_ckeditor('editor3', 'test statement of responsibility');
        cy.wait(500);
        cy.contains('Save and Continue').click();

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
        cy.get('.select2-results__option').contains('John Smith').click();
        cy.get('[aria-label="Start Date"]').scrollIntoView().should('be.visible').click({force: true});
        cy.get('[aria-label="Start Date"]').siblings('.bootstrap-datetimepicker-widget').contains(dd).click({force: true});
        cy.get('[aria-label="End Date"]').scrollIntoView().should('be.visible').click({force: true});
        cy.get('[aria-label="End Date"]').siblings('.bootstrap-datetimepicker-widget').contains(dd).click({force: true});
        cy.get('.workflow-component-element').get('.btn.btn-workflow-tile.btn-success').should('be.visible').contains('Add').click();
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click();
        cy.get('.workflow-top-control > .btn-success > .verbose').click();
    });
});
