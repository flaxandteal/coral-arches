describe('Going through the FWM Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const UPLOAD_FIXTURE = 'cypress/e2e/05_fmw_inspection/fmw-inspection-test-upload.txt';
    const UPLOAD_NAME = 'fmw-inspection-test-upload.txt';

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

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('FMW Inspection').click();
        cy.contains('Start New').click();

        // Initial step tab. Pre-visiting every tab here warms up each step's
        // card so its widgets are already loaded (and writable) by the time
        // the test reaches them via normal forward navigation -- skipping a
        // tab here (as Irish Grid Reference used to be) leaves its
        // coordinate widget rendered disabled on first real visit.
        cy.get('.workflow-nav-tab').contains('Report').click();
        cy.get('.workflow-nav-tab').contains('Irish Grid Reference').click();
        cy.get('.workflow-nav-tab').contains('Map').click();
        cy.get('.workflow-nav-tab').contains('Documentation').click();
        cy.get('.workflow-nav-tab').contains('Sign Off').click();
        cy.wait(2000);
        cy.contains('Save and Continue').click();

        // Report tab. Its widgets render lazily, so wait for select2 to appear
        // before touching anything.
        cy.get('.select2-selection', { timeout: 60000 }).should('exist');
        cy.wait(8000);

        cy.pickRelationshipFirst('SMR Number(s)');
        cy.wait(1000);

        // "Land Use" (bare prefix, no comma) collides with other aria-labels
        // on the page (e.g. a raw, non-select2 element), so target the field
        // by its card alias instead. This is a default-card-util component,
        // which wraps widgets in .widget-wrapper rather than .card_component.
        cy.pickCardOption('land_use_classification');
        cy.wait(1000);

        // Date of Visit is a datepicker — type rather than click the addon.
        cy.get('[aria-label="Date of Visit"]').filter(':visible').first()
            .type('28-07-2026{enter}', { force: true });

        // Condition/Risk Score aria-labels embed the current value, so match on
        // the prefix instead of a hard-coded score.
        cy.pickOptionByLabelPrefix('Condition Score, ');
        cy.pickOptionByLabelPrefix('Risk Score, ');

        cy.pickRelationshipFirst('Archaeologist');
        cy.wait(1000);
        cy.pickRelationshipFirst('CWT Area Manager');
        cy.wait(1000);
        cy.pickRelationshipFirst('Historian');
        cy.wait(1000);
        cy.pickRelationshipFirst('Architect');
        cy.wait(1000);
        cy.pickRelationshipFirst('Owner(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Occupier(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('FM Warden(s)');
        cy.wait(4000);
        cy.pickRelationshipFirst('HED Staff');
        cy.wait(1000);
        // Required field on the same Contacts card; without it the tile save
        // fails with "This card requires values for the following: Casework
        // Officer". It renders further down the card than the other
        // relationship pickers, so scroll the footer into view first to give
        // it room to lazily mount.
        cy.get('.tabbed-workflow-footer').scrollIntoView();
        cy.pickRelationshipFirst('Casework Officer');
        cy.wait(2000);
        cy.workflowNext();

        cy.wait(4000);
        cy.contains('Coordinate Format');
        // The coordinate input (irishGrid.htm) binds visibility to
        // `!disabled()`, so wait for the writable, visible control before
        // typing into it. Alphanumeric format matches the widget's own
        // placeholder example.
        //
        // id="coordinatePoint" is not unique: bngpoint.htm's widget template
        // hardcodes the same id, so `#coordinatePoint` can match more than
        // one element and the `:visible` filter becomes unreliable. Scope on
        // the `tm65Val` data-bind instead, which is specific to the Irish
        // Grid TM65 widget's view model.
        // The typed value is only parsed and committed to the tile on blur:
        // tm65point.js's `preview` computed reads `isSelected` (bound to the
        // input's `hasFocus`) and skips writing `this.value(pre)` while the
        // field is still focused, so without a blur the tile never becomes
        // dirty and "Save and Continue" won't advance the step.
        cy.get('[data-bind*="tm65Val"]').filter(':visible').first().type('J1025169962', { force: true }).blur();
        cy.wait(2000);
        cy.workflowNext();          // Irish Grid Reference -> Map

        // Map tab. Mapbox has no API token configured in this dev
        // environment ("An API access token is required to use Mapbox GL"),
        // so the map itself cannot be driven headlessly; just confirm it
        // rendered and move on, same as the Geospatial Details tab in the
        // licensing workflow.
        cy.wait(4000);
        cy.contains('Geospatial Coordinates');
        cy.pickRelationshipFirst('Feature Shape');
        cy.wait(1000);
        cy.workflowNext();          // Map -> Documentation

        // Documentation tab
        cy.wait(2000);
        fillDocumentationTab();
        cy.workflowNext();
        // cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign Off tab
        cy.wait(2000);

        // Send Papers is a switch-widget (a plain on/off toggle, no Yes/No
        // text), not the radio-boolean-widget the old assertion expected.
        cy.get('.send_papers').contains('Send Papers');
        cy.get('.send_papers .switch').click();

        // Within Deadline is a radio-boolean-widget -- click the "Yes" label,
        // not the underlying (visually hidden) radio input.
        cy.get('[aria-label="Within Deadline"]').contains('Yes').click();
        cy.wait(1000);

        cy.get('.widget-input-label').contains('Signed Off On');
        cy.get('[aria-label="Signed Off On"]').click();
        cy.get('.date-icon').first().click();

        cy.pickRelationshipFirst('Cur E');
        cy.wait(2000);
        cy.pickRelationshipFirst('Cur E Role Type');
        cy.wait(2000);
        cy.pickRelationshipFirst('Report Submitted By');
        cy.wait(2000);
        cy.pickRelationshipFirst('Reviewed By');
        cy.wait(2000);
        cy.pickRelationshipFirst('Cur E Role Metatype');
        cy.wait(2000);

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
