describe('Going through the ranger inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-workflow?workflow-slug=ranger-inspection-workflow"] > .workflow-select-card > .workflow-select-title').click();
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.get('.verbose').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Save and Continue').click();

        cy.wait(4000);

        cy.get('[aria-label="Related Heritage Assets, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});

        cy.get('.card_component.weather_conditions > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.weather_conditions > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.ground_conditions > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.ground_conditions > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.time_of_arrival > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.time_of_arrival > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.time_of_departure > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.time_of_departure > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.map_of_state_care_present > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        cy.get('.card_component.copy_of_ra_present > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"] > span').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').click();
        cy.get('.tabbed-workflow-footer-button-container > :nth-child(2) > .fa').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();


        cy.get('[aria-label="Area or Feature, 22. Natural heritage"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});

        cy.get('.card_component.checked > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        cy.get('.card_component.issues > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        
        cy.get('[aria-label="Description Type, Description of condition and issue"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click({force: true});

        cy.get('.form-control').clear('t');
        cy.get('.form-control').type('test');
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get('.card_component.reviewed_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.reviewed_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.report_submission_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.report_submission_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.workflow-top-control > .btn-success > .verbose').click();
    });
});
