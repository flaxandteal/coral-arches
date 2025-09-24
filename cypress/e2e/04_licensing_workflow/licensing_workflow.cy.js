describe('Going through the licensing Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Run through licensing workflow', function () {
        cy.get('[href="/plugins/open-workflow?workflow-slug=licensing-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(2000);
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.wait(4000);
        cy.contains('Save and Continue').click();

        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component > .new-provisional-edit-card-container > .card > .widgets > :nth-child(1) > :nth-child(1) > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('s');
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component > .new-provisional-edit-card-container > .card > .widgets > :nth-child(1) > :nth-child(1) > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('site test');
        cy.get('.card_component.planning_reference > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.planning_reference > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test ref');
        cy.get('.card_component.cm_reference_number > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('c');
        cy.get('.card_component.cm_reference_number > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('cm num');
        cy.get('[aria-label="Applicant, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Nominated Excavation Director(s), Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Employing Body/Bodies, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.card_component.received_date_n1 > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.acknowledged_date_n1 > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.proposed_start_date_n1 > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.proposed_start_date_n1 > .row > .form-group').click({force: true});
        cy.get('.card_component.duration > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('2');
        cy.get('.card_component.duration > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('2');
        cy.get('.card_component.actual_start_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.actual_start_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click();
        cy.get('.card_component.actual_end_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click();
        cy.get('.card_component.actual_start_date > .row').click();
        cy.type_ckeditor('editor3', 'test, Description');
        cy.wait(2000);
        cy.get('[aria-label="Stage of Application, Received"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        // issue with multi select 
        // cy.get('[label="Excavation Reason(s)"]').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});

        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test building');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('s');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('street');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('c');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('city');
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('b');
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('bt561ag');
        cy.get('[aria-label="LA01 - Causeway Coast and Glens Borough Council"]').click({force: true});
        cy.get(':nth-child(3) > span > ul > :nth-child(1)').click();
        cy.get('#coordinatePoint').clear('J1025169962');
        cy.get('#coordinatePoint').type('J1025169962');
        cy.type_ckeditor('editor7', 'test, Description');

        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get('.card_component.application_form > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click({force: true});
        cy.get('.card_component.pow > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click({force: true});
        cy.get('.card_component.council_letter > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click({force: true});
        cy.get('.card_component.developer_funding_form > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});
        cy.get('.col-xs-12 > .form-control').clear('t');
        cy.get('.col-xs-12 > .form-control').type('test');
        cy.get('.tabbed-workflow-footer-button-container > :nth-child(2)').click({force: true});

        cy.get('[aria-label="Cur Grade E Decision, Grant licence"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        // this select doesn't work for some reason 
        // cy.get('[aria-label="Cur Grade D Decision, Approved"]').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.type_ckeditor('editor11', 'test, Description');

        cy.get('.card_component.issue_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.issue_date > .row > .form-group').click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});
        cy.get(':nth-child(2) > .verbose').click({force: true});

        cy.get('[aria-label="Transfer of Licence, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('[aria-label="New Applicant, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Nominated Excavation Director(s), Nominated Excavation Director(s)"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Former Employing Body, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Employing Body/Bodies, Employing Body/Bodies"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.card_component.date_requested_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.date_requested_value > .row').click({force: true});
        cy.get('[aria-label="Cur Grade E Decision, Do not approve transfer"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Cur Grade D Decision, Decline"]').click({ multiple: true });
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true }, {force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true }, {force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Made By, Add new Relationship"]').click({ multiple: true }, {force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.issued_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true}, { multiple: true });
        cy.get('.card_component.issued_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click({force: true}, { multiple: true });
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').should('be.visible').click({force: true});

        cy.get('.col-xs-12 > .form-control').clear('t');
        cy.get('.col-xs-12 > .form-control').type('test');
        cy.get('.card_component.report_submitted > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element').click({force: true});
        cy.get('[aria-label="Classification Type, Received"]').click({ multiple: true }, {force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.card_component.classification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component').click({force: true});
        cy.get('[aria-label="Classified By, Add new Relationship"]').click({ multiple: true }, {force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('.card_component.date_reported_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click({force: true}, { multiple: true });
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').click({force: true}, { multiple: true });
        cy.wait(2000);
        cy.get('.btn-success').click({force: true}, { multiple: true });
    })
})
