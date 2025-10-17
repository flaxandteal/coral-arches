describe('Going through the state care Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-state-care-condition-survey-workflow?workflow-slug=state-care-condition-survey-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.get('[aria-label="Select Heritage Asset, Please select a Heritage Asset"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Start New').click();
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.contains('Save and Continue').click();

        cy.wait(4000);
        cy.get('[aria-label="Assessment Type, 16. Issues raised in previous survey"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.get('[aria-label="Works Required, N/A"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.get('[aria-label="1 - Optimal"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.get('[aria-label="1 - Low"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.wait(4000);
        cy.get('.workflow-component-element').get('.btn.btn-workflow-tile.btn-success').should('be.visible').contains('Add').click();

        cy.type_ckeditor('editor1', 'test');
        cy.get(':nth-child(2) > .workflow-component > .workflow-component-element > .card-component').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.tabbed-workflow-footer-button-container > :nth-child(2)').click();
        cy.contains('Next Step').click();
        cy.get('.card_component.completed_on > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.completed_on > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.signed_off_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.signed_off_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.workflow-top-control > .btn-success > .verbose').click();
    });
});