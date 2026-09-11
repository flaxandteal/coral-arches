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

        // Details tab. Scroll each card in before typing - these sit below the
        // fold once the Related Heritage Assets widget has expanded.
        ['weather_conditions', 'ground_conditions', 'time_of_arrival', 'time_of_departure']
            .forEach((cls) => {
                cy.get(`.card_component.${cls}`).first().scrollIntoView();
                cy.get(`.card_component.${cls}`).find('input').first()
                    .type('test', { force: true });
            });
        // Radio-boolean widgets: use the same helper 04_licensing_workflow
        // relies on (setBooleanTrue) instead of reaching into the
        // data-bind-attribute markup directly.
        cy.setBooleanTrue('map_of_state_care_present');
        cy.setBooleanTrue('copy_of_ra_present');
        cy.workflowNext();
        cy.wait(4000);
        cy.workflowNext();
        cy.wait(5000);

        // aria-label embeds the current value, so match on the prefix.
        cy.pickOptionByLabelPrefix('Area or Feature, ');

        cy.setBooleanTrue('checked');
        cy.setBooleanTrue('issues');

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

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
