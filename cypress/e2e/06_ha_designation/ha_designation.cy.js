describe('Going through the HA Designation Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Add new ha to designate then run through workflow', function () {
        cy.get('[href="/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(2000);
        cy.get('[aria-label="Select Heritage Asset, Please select a Heritage Asset"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.wait(2000);
        cy.contains('Start New').click();

        cy.wait(2000);
        cy.get('.ep-form-alert-buttons > .btn > span').click({ multiple: true });
        cy.get('[href="/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow"] > .workflow-select-card').click();
        cy.wait(2000);
        cy.get('[aria-label="Select Heritage Asset Revision, Please select a Heritage Asset Revision"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.wait(2000);
        cy.contains('Open Selected').click();

        cy.wait(2000);
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test');
        cy.get('.select2-search__field').click();
        cy.get('.select2-search__field').click();
        cy.get(':nth-child(2) > .workflow-component').click();
        cy.get('[aria-label="LA01 - Causeway Coast and Glens Borough Council"]').click({force: true});
        cy.get(':nth-child(2) > .verbose').click();
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container > :nth-child(2)').click();
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.contains('Next Step').click();
        cy.wait(2000);
        cy.contains('Next Step').click();
        cy.wait(4000);
        cy.get('.card_component.assessment_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.assessment_date_value > .row').click();
        cy.get('.card_component.desg_approved_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.desg_approved_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.owner_notified_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.owner_notified_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.council_consulted_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.council_consulted_date > .row > .form-group').click();
        cy.get('.card_component.council_response_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.council_response_date > .row > .form-group').click();
        cy.get('.card_component.local_authority_notification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.local_authority_notification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.statutory_consultee_notification_date_value > .row > .form-group > .control-labx').click();
        cy.get('.card_component.statutory_consultee_notification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.statutory_consultee_notification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.director_sign_off_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.director_sign_off_date_value > .row').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get('.form-checkbox').click();
        cy.get('.widgets > :nth-child(2) > .btn > span').click();
        cy.get('.widgets > :nth-child(2) > .btn > span').click();
        cy.get('.ep-form-alert-buttons > .btn-primary > span').click();
    })
})
