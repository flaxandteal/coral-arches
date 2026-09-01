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

        cy.pickRelationshipFirst('Related Heritage Assets');
        cy.wait(1000);

        // Details tab. Scroll each card in before typing — these sit below the
        // fold once the Related Heritage Assets widget has expanded.
        ['weather_conditions', 'ground_conditions', 'time_of_arrival', 'time_of_departure']
            .forEach((cls) => {
                cy.get(`.card_component.${cls}`).first().scrollIntoView();
                cy.get(`.card_component.${cls}`).find('input').first()
                    .type('test', { force: true });
            });
        cy.get('.card_component.map_of_state_care_present > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        cy.get('.card_component.copy_of_ra_present > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"] > span').click();
        cy.workflowNext();
        cy.wait(4000);
        cy.workflowNext();
        cy.wait(5000);

        // aria-label embeds the current value, so match on the prefix.
        cy.pickOptionByLabelPrefix('Area or Feature, ');

        cy.get('.card_component.checked > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        cy.get('.card_component.issues > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        
        cy.pickOptionByLabelPrefix('Description Type, ');

        cy.get('.form-control').clear('t');
        cy.get('.form-control').type('test');
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click();
        cy.workflowNext();
        cy.wait(4000);
        cy.workflowNext();
        cy.wait(5000);
        cy.fillDate('reviewed_date');
        cy.fillDate('report_submission_date');
        // Last tab, so the footer button is a plain "Save".
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains(/Save and Continue|Next Step|Save/)
            .click();
        cy.wait(4000);
        cy.get('.workflow-top-control > .btn-success > .verbose').click();
    });
});
