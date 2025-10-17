describe('Going through the Agri Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-workflow?workflow-slug=agriculture-and-forestry-consultation-workflow"] > .workflow-select-card').click();
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn').click();
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        cy.wait(8000);
        cy.get('[aria-label="Related Heritage Assets, Add new Relationship"]').click({force: true});
        cy.wait(4000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.wait(2000);
        cy.get('[aria-label="Referred to, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.get('[aria-label="Applicant, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});
        cy.get('[aria-label="Applicant organisation, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});

        cy.get('.card_component.date_received > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true} );
        cy.get('.card_component.date_acknowledged > .row').click();
        cy.get('.card_component.date_acknowledged > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.date_acknowledged > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click( {force: true} );
        cy.get('.card_component.due_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click( {force: true} );
        cy.get('.card_component.response_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click( {force: true} );
        cy.get('.card_component.response_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click( {force: true} );
        cy.get(':nth-child(4) > .workflow-component > .workflow-component-element > .card-component').click();
        cy.get('.col-xs-12 > .form-control').clear('t');
        cy.get('.col-xs-12 > .form-control').type('test');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.tabbed-workflow-footer-button-container > :nth-child(2) > .fa').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();
        cy.get('.form-control').click();
        cy.get('[style="display: flex; gap: 8px;"]').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.workflow-top-control > .btn-success').click();
    });
});
