describe('Going through the licensing Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Run through licensing workflow', function () {
        cy.get('[href="/plugins/open-workflow?workflow-slug=licensing-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.wait(2000);
        cy.contains('Save and Continue').click();


        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component > .new-provisional-edit-card-container > .card > .widgets > :nth-child(1) > :nth-child(1) > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('s');
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component > .new-provisional-edit-card-container > .card > .widgets > :nth-child(1) > :nth-child(1) > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('site test');
        cy.get('.card_component.planning_reference > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.planning_reference > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test ref');
        cy.get('.card_component.cm_reference_number > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('c');
        cy.get('.card_component.cm_reference_number > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('cm num');

        // Selects todo
        // cy.wait(2000);
        // cy.get('#select2-kaqv-container > .select2-selection__placeholder').click();
        // cy.wait(2000);
        // cy.get('#select2-zg9g-container > .select2-selection__placeholder').click();
        // cy.wait(2000);
        // cy.get('#select2-hhaa-container > .select2-selection__placeholder').click();
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
        cy.get('.card_component.excavation_reason_type > .row > .form-group > .col-xs-12 > .select2 > .selection > .select2-selection > .select2-selection__rendered > .select2-search > .select2-search__field').click({force: true});
        cy.get('.card_component.excavation_type > .row > .form-group > .col-xs-12 > .select2 > .selection > .select2-selection > .select2-selection__rendered > .select2-search > .select2-search__field').click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});
        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('t');
        cy.get('.card_component.building_name_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('test building');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('s');
        cy.get('.card_component.street_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('street');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('c');
        cy.get('.card_component.town_or_city_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('city');

        // Selects todo
        // cy.get('#select2-9ivx-container').click();
        // cy.get('#select2-9ivx-container').click();
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').clear('b');
        cy.get('.card_component.postcode_value > .row > .form-group > [style="max-width: 600px; position: relative"] > .col-xs-12 > .form-control').type('bt561ag');
        cy.get('.select2-search__field').click();
        cy.get(':nth-child(2) > .workflow-component > .workflow-component-element > .card-component').click();

        //selects todo
        // cy.get('#select2-9cfz-container').click();
        // cy.get('#select2-h4r6-container').click();
        // cy.get('#select2-h4r6-container').click();
        // cy.get('#select2-1jv2-container').click();
        // cy.get('#select2-1jv2-container').click();
        cy.get(':nth-child(3) > span > ul > :nth-child(1)').click();
        cy.get('#coordinatePoint').clear('J1025169962');
        cy.get('#coordinatePoint').type('J1025169962');
        cy.get(':nth-child(3) > span > ul > :nth-child(1)').click();
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

        // selects todo
        // cy.get('#select2-cp0d-container').click();
        // cy.get('#select2-gbjp-container').click();
        // cy.get('#select2-nna9-container').click();
        // cy.get('#select2-k25a-container > .select2-selection__placeholder').click();
        cy.get('.card_component.issue_date > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.issue_date > .row > .form-group').click({force: true});

        // selects todo
        // cy.get('#select2-k6p0-container').click();
        // cy.get('#select2-ivte-container').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});
        cy.get(':nth-child(2) > .verbose').click({force: true});

        // selects todo
        // cy.get('#select2-26r0-container').click();
        // cy.get('#select2-n3nu-container').click();
        // cy.get('#select2-zqax-container > .select2-selection__placeholder').click();
        // cy.get('.card_component.new_licensee > .widget-wrapper > .rr-widget > .rr-table > [data-bind="foreach: relationshipsInFilter"] > .rr-table-row > .rr-table-row-initial > [style="flex-grow: 1; cursor: pointer;"] > .rr-table-instance-label').click();
        //selects todo
        // cy.get('#select2-652p-container').click();
        // cy.get('#select2-5x5w-container').click();
        cy.get('.card_component.date_requested_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.date_requested_value > .row').click({force: true});

        // selects todo
        // cy.get('#select2-j7mz-container').click();
        // cy.get('#select2-0asb-container > .select2-selection__placeholder').click();
        // cy.get('#select2-eqng-container').click();
        // cy.get('#select2-hax3-container > .select2-selection__placeholder').click();
        cy.get('.card_component.issued_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.issued_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click({force: true});
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click({force: true});
        cy.get(':nth-child(1) > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === false, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(false)}, attr: {\'aria-checked\': value() === false}"]').click({force: true});
        cy.get(':nth-child(2) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(2) > .workflow-component > .workflow-component-element').click({force: true});

        // selects todo
        // cy.get('#select2-549f-container').click();
        // cy.get('#select2-t1vq-container').click();
        // cy.get('#select2-33qs-container').click();
        // cy.get('#select2-33ci-container > .select2-selection__placeholder').click();
        cy.get(':nth-child(19) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(19) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click({force: true});
        cy.get(':nth-child(20) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('[data-day="10/02/2025"]').click();
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click({force: true});
        cy.get('.col-xs-12 > .form-control').clear('t');
        cy.get('.col-xs-12 > .form-control').type('test');
        cy.get('.card_component.report_submitted > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element').click({force: true});
        //selects todo
        // cy.get('#select2-m4kt-container').click();
        cy.get('.card_component.classification_date_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element > .card-component').click({force: true});
        // selects todo
        // cy.get('#select2-1l6c-container').click();
        cy.get('.card_component.gis_dataset_received > .row > .form-group > .col-xs-12 > .pad-hor > :nth-child(2)').click({force: true});
        cy.get('.card_component.gis_dataset_checked_correct > .row > .form-group > .col-xs-12 > .pad-hor > :nth-child(3)').click({force: true});
        cy.get('.card_component.archaeology_found > .row > .form-group > .col-xs-12 > .pad-hor > :nth-child(2)').click({force: true});
        cy.get('.card_component.date_reported_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.archaeology_found > .row > .form-group > .col-xs-12 > .pad-hor').click({force: true});
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click({force: true});
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').click({force: true});
        cy.get('.btn-success').click({force: true});
    })
})


// cy.get('[aria-label="Select Heritage Asset, Please select a Heritage Asset"]').click();
//         cy.wait(2000);
//         cy.get('.select2-results__option').contains('HA/01').click();
//         cy.wait(2000);
//         cy.contains('Start New').click();