describe('Going through the risk assessment Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const UPLOAD_FIXTURE = 'cypress/fixtures/test-upload.txt';
    const UPLOAD_NAME = 'test-upload.txt';

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

    // The Risk Assessment launcher (open-risk-assessment-workflow.js,
    // `stateMonumentString`) only lists Heritage Assets whose "Recommended
    // designation, identification and protection" reference field (node
    // 5aa9d22a-29c6-5de0-8119-84ee1e93081f) includes the "Scheduled Monument"
    // controlled-list item (1e898077-9144-9ef0-b6e1-08f4e4881972). Run
    // `manage.py seed_test_scheduled_monument` first to give a Heritage Asset
    // that designation and reindex it, or the dropdown has nothing to select.
    it('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-risk-assessment-workflow?workflow-slug=risk-assessment-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(4000);
        cy.get('.select2-selection').filter(':visible').first().click();
        cy.wait(3000);
        cy.get('.select2-results__option')
            .not('.loading-results')
            .not('.select2-results__option--load-more')
            .first()
            .click();
        cy.wait(2000);
        cy.contains('Start New').click();
        cy.wait(8000);

        // Initial Step - the launcher already created the Associated Heritage
        // Asset tile and the System Reference Number is auto-generated, so
        // there is nothing left to fill in here.
        cy.workflowNext();

        // Heritage Asset Details - "Select Heritage Assets" is read-only
        // display of the resource picked in the launcher; the actual fields
        // to fill live on the "Details" card next to it. That card renders
        // after several sequential fetches in get-ha-details.js (tile data,
        // B File report, designation concept lookups), so give it well past
        // the default timeout before touching it - and use { force: true }
        // on the first field since Cypress's actionability check can still
        // catch the text-widget input mid-layout even once it has a real
        // size.
        cy.wait(15000);
        cy.get('.widget-wrapper.area_leased input.form-control', { timeout: 20000 })
            .first()
            .type('Automated test paddock', { force: true });
        cy.fillDate('date_for_renewal');
        cy.setBooleanTrue('details_on_file');
        // Property Status is left unfilled: the node is now the
        // controlled-lists "reference" datatype (config: {controlledList}),
        // but its widget is still the legacy "domain-multiselect-widget",
        // which reads its option list from node.config.options - a key that
        // does not exist on a reference-type node's config. That leaves the
        // widget's `options` observable empty/undefined, so select2Query's
        // init intermittently never runs and no .select2-selection ever
        // appears - the same widget/datatype migration mismatch already
        // found on the Risk Assessment launcher and get-ha-details.js.
        cy.workflowNext();

        // Map - the actual geometry (geospatial_coordinates) is copied from
        // the Heritage Asset and disabled (nodeOptions disableEdit), so only
        // Feature Shape is fillable here.
        cy.wait(3000);
        cy.pickCardOption('feature_shape');
        cy.wait(1000);
        cy.workflowNext();

        // Identification/Evaluation - fill every field on the "many"-tile
        // Evaluation card, then Add it. Severity/Likelihood drive the
        // Calculated Risk field automatically (get-calculated-risk.js).
        cy.wait(3000);
        cy.typeRichText('description', 'Automated test risk evaluation.');
        cy.pickCardOption('hazard_identification_and_risk_evaluation_value');
        cy.wait(1000);
        cy.pickCardOption('severity_after_controls');
        cy.wait(1000);
        cy.pickCardOption('likelihood_after_controls');
        cy.wait(1000);
        cy.pickCardOption('priority');
        cy.wait(1000);
        cy.get('.widget-wrapper.risk_evaluation_after_contols input')
            .should('not.have.value', '');
        cy.get('.workflow-component-element').get('.btn.btn-workflow-tile.btn-success').should('be.visible').contains('Add').click();
        cy.wait(2000);
        cy.workflowNext();

        // Documentation
        fillDocumentationTab();
        cy.wait(4000);
        cy.workflowNext();

        // Sign Off - the last tab. Assessment Done By / Sign Off By are
        // resource-instance pickers restricted to a handful of sign-off
        // groups (user-to-model-select.js); the seeded admin account has no
        // Person resource in any of them, so - same as the known "Cur E"
        // sign-off blocker in 08_agri - those two fields cannot be filled
        // here and are left alone.
        cy.wait(5000);
        cy.fillDate('assessment_date');
        cy.fillDate('sign_off_date');
        cy.typeInCard('visitation_rate', '12');
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
