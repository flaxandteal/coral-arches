describe('Going through the FWM Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        // A cold load fetches ~250 webpack chunks and can exceed the 90s default.
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // File uploads stay commented out: the upload buckets differ per environment.
    // function fillDocumentationTab() {
    //     cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });
    //     cy.get('.card-component', { timeout: 30000 }).should('contain.text', 'test-upload.txt');
    //     cy.contains('Save and Continue').click();
    // }

    it('Shows the start and open controls on the launcher', function () {
        cy.contains('FMW Inspection').click();
        cy.contains('Start New').should('be.visible');
        cy.contains('Open Selected').should('be.visible');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('FMW Inspection').click();
        cy.contains('Start New').click();

        // The consultation ID is generated into a locked input before the step can be saved.
        cy.get('[aria-label="Report ID"]', { timeout: 30000 })
            .should(($id) => expect($id.val()).to.match(/^FMW\/\d{4}\/\w+$/))
            .and('be.disabled');
        cy.workflowNext();

        // Visiting Irish Grid Reference once first leaves its coordinate input writable on the real visit.
        cy.get('.workflow-nav-tab-container').contains('Irish Grid Reference').click();
        cy.wait(2000);
        cy.get('.workflow-nav-tab-container').contains('Report').click();

        // Report tab. Its widgets render lazily, so wait for select2 to appear
        // before touching anything.
        cy.get('.select2-selection', { timeout: 60000 }).should('exist');
        cy.wait(8000);

        cy.pickRelationshipFirst('SMR Number(s)');
        cy.get('.rr-table-row').should('have.length', 1);
        // Details of the chosen heritage asset appear in the grey panel below the field.
        cy.get('div[style*="background: #eee"]').should('have.length', 1).within(() => {
            ['Monument Name', 'Designation Type', 'Townland', 'B File(s)'].forEach((label) => {
                cy.contains(label);
            });
        });
        // The same asset cannot be added twice.
        cy.pickRelationshipFirst('SMR Number(s)');
        cy.get('.rr-table-row').should('have.length', 1);

        // "Land Use" (bare prefix, no comma) collides with other aria-labels
        // on the page (e.g. a raw, non-select2 element), so target the field
        // by its card alias instead. This is a default-card-util component,
        // which wraps widgets in .widget-wrapper rather than .card_component.
        cy.pickCardOption('land_use_classification');
        cy.pickCardOption('land_use_classification', 1);
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice')
            .should('have.length', 2);

        // A date in the future is refused: the picker falls back to today.
        cy.scrollToWidget('date_of_visit');
        cy.get('[aria-label="Date of Visit"]').filter(':visible').first()
            .type('28-07-2036{enter}', { force: true });
        const now = new Date();
        const today = [now.getDate(), now.getMonth() + 1, now.getFullYear()]
            .map((part) => String(part).padStart(2, '0')).join('-');
        cy.get('[aria-label="Date of Visit"]').filter(':visible').first().should('have.value', today);

        // Location Description is a CKEditor 4 rich-text widget: its
        // <textarea data-bind="ckeditor: currentText"> stays
        // visibility:hidden/display:none once CKEditor replaces it with an
        // iframe-based WYSIWYG editor, so typing into the textarea directly
        // does nothing. Drive the CKEDITOR instance's API instead, scoped to
        // this widget's wrapper class so it doesn't pick up another
        // rich-text widget on the same tab.
        // same applies to all other rich-text widgets in this workflow
        cy.typeRichText('location_description_1', 'Location description for automated testing.');
        cy.pickRelationshipFirst('Location Description Type');
        cy.wait(1000);

        // Condition/Risk Score aria-labels embed the current value, so match on
        // the prefix instead of a hard-coded score.
        // The Score field is condition x risk: option 2 x option 3.
        cy.pickOptionByLabelPrefix('Condition Score, ', 1);
        cy.pickOptionByLabelPrefix('Risk Score, ', 2);
        cy.get('.widget-wrapper:not(.total_score)')
            .filter((i, el) => el.innerText.trim() === 'Score')
            .find('input')
            .should('have.value', '6');

        cy.typeRichText('inspection_report', 'Inspection report for automated testing.');
        cy.typeRichText('recommendation_description', 'Recommendation for automated testing.');
        cy.typeRichText('consultation_description', 'Notes for automated testing.');

        // Archaeologist, CWT Area Manager, Historian, Architect and HED Staff are hidden in this workflow.
        cy.pickRelationshipFirst('Owner(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Occupier(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('FM Warden(s)');
        cy.wait(4000);
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
        cy.contains('Alphanumeric: J1025169962');
        cy.contains('Absolute: 310251,369962');
        cy.contains('Long/Lat: -6.2960237,54.566080');
        cy.get('#formatType option').should(($o) => {
            expect($o.toArray().map((o) => o.textContent)).to.include.members(
                ['Alphanumeric TM65', 'Absolute TM65', 'Long/Lat']);
        });
        cy.get('[data-bind*="tm65Val"]').filter(':visible').first().type('ZZ99', { force: true }).blur();
        cy.contains('Input coordinate did not pass validation');
        cy.get('[data-bind*="tm65Val"]').filter(':visible').first().clear({ force: true });
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
        // #previewPoint is also hardcoded by the hidden national grid widget, so scope to this one.
        cy.get('[data-bind*="tm65Val"]').filter(':visible').first().closest('.widget-wrapper')
            .find('#previewPoint').should('have.value', 'J1025169962');
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
        // fillDocumentationTab();
        cy.workflowNext();

        // Sign Off tab
        cy.wait(2000);

        // Send Papers is a switch-widget (a plain on/off toggle). Within Deadline and Cur E are hidden.
        cy.get('.send_papers').contains('Send Papers');
        cy.get('.send_papers .switch').click();

        cy.get('.sign_off_date_value').scrollIntoCentre();
        cy.get('[aria-label="Signed Off On"]').filter(':visible').first()
            .type('2026-07-28{enter}', { force: true });
        cy.get('[aria-label="Signed Off On"]').filter(':visible').first().should('not.have.value', '');

        // Report Submitted By and Reviewed By are sign-off buttons for the logged-in user's own
        // Person record; admin has none linked, so signing is refused.
        // cy.pickRelationshipFirst('Report Submitted By');
        // cy.pickRelationshipFirst('Reviewed By');
        cy.contains('You do not have permission to sign off');

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
