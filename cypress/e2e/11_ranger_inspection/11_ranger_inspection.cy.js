describe('Going through the ranger inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const UPLOAD_FIXTURE = 'cypress/fixtures/test-upload.txt';
    const UPLOAD_NAME = 'test-upload.txt';

    // Start tab: open the workflow, pick the feature type, then save and
    // continue onto the Details tab.
    function startWorkflow() {
        cy.get('[href="/plugins/open-workflow?workflow-slug=ranger-inspection-workflow"] > .workflow-select-card > .workflow-select-title').click();
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.get('.verbose').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Save and Continue').click();
        cy.wait(4000);
    }

    function fillDocumentationTab() {
        // Upload a fixture file through the dropzone. The dropzone's own
        // <input type="file"> is hidden, hence { force: true }.
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.wait(2000);
        cy.get('input.dz-hidden-input').first().selectFile(UPLOAD_FIXTURE, { force: true });
        cy.get('.card-component', { timeout: 30000 }).should('contain.text', UPLOAD_NAME);
        cy.contains('files uploaded').should('be.visible');
        // An attached-but-unsaved file changes the footer button to "Save and
        // Continue" instead of "Next Step". Clicking it saves/uploads the
        // file and stays on this tab; "Next Step" then appears and actually
        // advances.
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains('Save and Continue')
            .click();
        cy.wait(3000);
    }

    function fillDetailsTab() {
        cy.pickRelationshipFirst('Related Heritage Assets');
        cy.wait(1000);

        // Scroll each card in before typing - these sit below the fold once
        // the Related Heritage Assets widget has expanded.
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
    }

    function fillInspectionTab() {
        // aria-label embeds the current value, so match on the prefix.
        cy.pickOptionByLabelPrefix('Area or Feature, ');

        cy.setBooleanTrue('checked');
        cy.setBooleanTrue('issues');

        cy.pickOptionByLabelPrefix('Description Type, ');

        cy.get('.form-control').clear('t');
        cy.get('.form-control').type('test');
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click();
    }

    function fillSignOffTab() {
        cy.fillDate('report_submission_date');
        cy.fillDate('reviewed_date');
        // Last tab, so the footer button is a plain "Save".
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains(/Save and Continue|Next Step|Save/)
            .click();
        cy.wait(4000);
    }

    function completeWorkflow() {
        cy.get('.workflow-top-control > .btn-success > .verbose').click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    }

    it('Start new and go through the workflow and populate all fields', function () {
        startWorkflow();

        fillDetailsTab();
        cy.workflowNext();
        cy.wait(4000);
        // We do not test the map tab, as it is a map widget and not a form. The map tab is also optional, so we skip it.\
        // We pick from the feature shape select
        cy.pickRelationshipFirst('Feature Shape');
        cy.wait(1000);
        cy.workflowNext();
        cy.wait(5000);

        fillInspectionTab();
        cy.workflowNext();
        cy.wait(4000);

        fillDocumentationTab();
        cy.workflowNext();
        cy.wait(5000);

        fillSignOffTab();

        completeWorkflow();
    });
});
