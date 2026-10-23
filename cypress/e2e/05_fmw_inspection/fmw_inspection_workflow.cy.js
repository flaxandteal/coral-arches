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
    // The map is drawn on a mapbox canvas that has no token in this environment, so drawing is not driven here.

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const STEP_BODY = '.tabbed-workflow-step-body';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const ROW = '.rr-table-row';
    const CALENDAR = '.bootstrap-datetimepicker-widget';

    // Which footer buttons are showing. Undo is hidden in every step of this workflow.
    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
        has('Undo', false);
    };

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`).should('contain.text', text);

    const rows = (alias) => cy.get(`.widget-wrapper.${alias} ${ROW}`, { timeout: 15000 });

    const closeDropdown = () => {
        cy.get('body').type('{esc}');
        cy.get('.select2-dropdown').should('not.exist');
        cy.document().then((doc) => doc.activeElement?.blur());
    };

    // A search with no hits still offers to create a new resource of each kind the picker allows, and nothing else.
    const offers = (alias, kinds) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        cy.select2Search('XXXXXX');
        cy.get(REAL_OPTIONS, { timeout: 30000 }).should(($options) => {
            expect([...$options].map((option) => option.textContent.trim()))
                .to.have.members(kinds.map((kind) => `Create a new ${kind} . . .`));
        });
        closeDropdown();
    };

    // Seeded people. Pickers are searched by name: the list re-renders under a click.
    const FIRST_PERSON = 'Test Person';
    const SECOND_PERSON = 'Another Person';

    // Several people can be picked for the field.
    const pickTwoPeople = (alias) => {
        cy.pickCardOption(alias, FIRST_PERSON);
        rows(alias).should('have.length', 1);
        cy.pickCardOption(alias, SECOND_PERSON);
        rows(alias).should('have.length', 2);
    };

    const today = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    };

    const dateInput = (ariaLabel) => cy.get(`[aria-label="${ariaLabel}"]`).filter(':visible').first();

    // A future date is refused: the picker falls back to today.
    const futureDateRefused = (ariaLabel) => {
        dateInput(ariaLabel).type('28-07-2036{enter}', { force: true });
        dateInput(ariaLabel).should('have.value', today());
    };

    // Clicking opens a calendar whose future days are disabled.
    const calendarBlocksFuture = (ariaLabel) => {
        dateInput(ariaLabel).click({ force: true });
        cy.get(`${CALENDAR}:visible`).should('exist');
        cy.get(`${CALENDAR} td.day.disabled:visible`).should('exist');
    };

    const consultation = {};

    // The new consultation may not be indexed yet, so the search is repeated until it lists the ID.
    const selectInDropdown = (id) => {
        cy.get('.select2-selection').first().click();
        const findInDropdown = (attemptsLeft) => {
            cy.select2Search(id);
            cy.get('body').then(($body) => {
                const listed = $body.find('.select2-results__option').toArray()
                    .some((option) => option.textContent.trim() === id);
                if (listed) return;
                expect(attemptsLeft, `${id} in the launcher list`).to.be.greaterThan(0);
                cy.wait(5000);
                findInDropdown(attemptsLeft - 1);
            });
        };
        findInDropdown(6);
        cy.get(REAL_OPTIONS).contains(id).click();
    };

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('FMW Inspection', { timeout: 120000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).click();

        // The consultation ID is generated into a locked input; the other steps stay locked and cannot be reached.
        cy.get('.widget-wrapper.resourceid', { timeout: 60000 }).should('contain.text', 'Report ID');
        cy.get('[aria-label="Report ID"]', { timeout: 60000 })
            .should(($id) => expect($id.val()).to.match(/^FMW\/\d{4}\/\w+$/))
            .and('be.disabled')
            .invoke('val').then((id) => { consultation.reference = id; });
        cy.get('.workflow-nav-tab.disabled').should('have.length', 5);
        footer({ previous: false, save: true });
        cy.workflowNext();

        // Visiting Irish Grid Reference once first leaves its coordinate input writable on the real visit.
        cy.get('.workflow-nav-tab-container').contains('Irish Grid Reference').click();
        cy.get('[data-bind*="tm65Val"]', { timeout: 60000 }).filter(':visible').should('not.be.disabled');
        cy.get('.workflow-nav-tab-container').contains('Report').click();

        // Report tab. Its widgets render lazily, so wait for the first picker before touching anything.
        cy.get('.widget-wrapper.related_monuments_and_areas .select2-selection', { timeout: 60000 }).should('exist');
        footer({ save: true });

        // Heritage asset: only existing ones can be picked, and none twice.
        label('related_monuments_and_areas', 'SMR Number(s)');
        cy.openRelationship('SMR Number(s)');
        cy.get(REAL_OPTIONS).should('have.length.greaterThan', 0).and(($options) => {
            expect([...$options].some((option) => option.textContent.includes('Create a new'))).to.equal(false);
        });
        closeDropdown();
        cy.pickRelationshipFirst('SMR Number(s)');
        cy.get(`.widget-wrapper.related_monuments_and_areas ${ROW}`).should('have.length', 1);
        // Details of the chosen heritage asset appear in the grey panel below the field.
        cy.get('div[style*="background: #eee"]').should('have.length', 1).within(() => {
            ['SMR Number', 'Monument Name', 'Designation Type', 'Townland', 'B File(s)'].forEach((text) => {
                cy.contains(text);
            });
        });
        // The same asset cannot be added twice.
        cy.pickRelationshipFirst('SMR Number(s)');
        cy.get(`.widget-wrapper.related_monuments_and_areas ${ROW}`).should('have.length', 1);

        // "Land Use" (bare prefix, no comma) collides with other aria-labels
        // on the page (e.g. a raw, non-select2 element), so target the field
        // by its card alias instead. This is a default-card-util component,
        // which wraps widgets in .widget-wrapper rather than .card_component.
        cy.scrollToWidget('land_use_classification');
        cy.get('.widget-wrapper.land_use_classification input.select2-search__field')
            .should('have.attr', 'placeholder', 'Select an option');
        cy.pickCardOption('land_use_classification');
        cy.pickCardOption('land_use_classification', 1);
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice')
            .should('have.length', 2);

        label('date_of_visit', 'Date of Visit');
        cy.scrollToWidget('date_of_visit');
        calendarBlocksFuture('Date of Visit');
        futureDateRefused('Date of Visit');

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

        // The Score field is condition x risk, and 0 while either is empty.
        const scoreInput = () => cy.get('.widget-wrapper:not(.total_score)')
            .filter((i, el) => el.innerText.trim() === 'Score')
            .find('input');
        label('condition_score', 'Condition Score');
        label('risk_score', 'Risk Score');
        scoreInput().should('have.value', '0');
        // Condition/Risk Score aria-labels embed the current value, so match on
        // the prefix instead of a hard-coded score.
        cy.pickOptionByLabelPrefix('Condition Score, ', 1);
        scoreInput().should('have.value', '0');
        cy.pickOptionByLabelPrefix('Risk Score, ', 2);
        scoreInput().should('have.value', '6');

        cy.typeRichText('inspection_report', 'Inspection report for automated testing.');
        cy.typeRichText('recommendation_description', 'Recommendation for automated testing.');
        cy.typeRichText('consultation_description', 'Notes for automated testing.');
        label('inspection_report', 'Inspection Report');
        label('recommendation_description', 'Recommendations');
        label('consultation_description', 'Notes');

        // Archaeologist, CWT Area Manager, Historian, Architect and HED Staff are hidden in this workflow.
        label('owner', 'Owner(s)');
        label('occupier', 'Occupier(s)');
        label('fm_warden', 'FM Warden(s)');
        offers('owner', ['Organization', 'Person']);
        offers('occupier', ['Person']);
        offers('fm_warden', ['Person']);
        pickTwoPeople('owner');
        pickTwoPeople('occupier');
        pickTwoPeople('fm_warden');
        // Required field on the same Contacts card; without it the tile save
        // fails with "This card requires values for the following: Casework
        // Officer". It renders further down the card than the other
        // relationship pickers, so scroll the footer into view first to give
        // it room to lazily mount.
        cy.get('.tabbed-workflow-footer').scrollIntoView();
        cy.pickRelationshipFirst('Casework Officer');
        cy.workflowNext();

        cy.contains('Coordinate Format', { timeout: 60000 });
        cy.contains('Alphanumeric: J1025169962');
        cy.contains('Absolute: 310251,369962');
        cy.contains('Long/Lat: -6.2960237,54.566080');
        cy.get('#formatType option').should(($o) => {
            expect($o.toArray().map((o) => o.textContent)).to.include.members(
                ['Alphanumeric TM65', 'Absolute TM65', 'Long/Lat']);
        });
        cy.get('select#formatType').filter(':visible').select('Alphanumeric TM65');
        cy.get('[data-bind*="tm65Val"]').filter(':visible').first().type('ZZ99', { force: true }).blur();
        cy.contains('Input coordinate did not pass validation. Please check it is in one of the approved formats and try again');
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
        // rendered and its drawing controls are offered.
        cy.get(STEP_BODY, { timeout: 60000 }).should('contain.text', 'Geospatial Coordinates');
        ['Add point', 'Add line', 'Add polygon'].forEach((text) => cy.get(STEP_BODY).should('contain.text', text));
        footer({ next: true });
        cy.openRelationship('Feature Shape');
        cy.get(REAL_OPTIONS).should(($options) => {
            expect([...$options].map((option) => option.textContent.trim()))
                .to.include.members(['Approx', 'Area', 'Linear', 'Point']);
        });
        cy.get(REAL_OPTIONS).contains(/^Point$/).click();
        cy.workflowNext();          // Map -> Documentation

        // Documentation tab: optional, and nothing is uploaded here.
        cy.get(STEP_BODY, { timeout: 60000 }).should('contain.text', 'Select Files');
        footer({ next: true });
        ['Upload Documents', 'Drag & Drop your files onto this panel', 'Adding documents to this record is optional', '200MB']
            .forEach((text) => cy.get(STEP_BODY).should('contain.text', text));
        cy.contains('button', 'Select Files').should('be.enabled');
        // fillDocumentationTab();
        cy.workflowNext();

        // Sign Off tab
        cy.get('.send_papers', { timeout: 60000 }).contains('Send Papers');

        // Send Papers is a three-state switch (unset, off, on), not radio buttons. Within Deadline and Cur E are hidden.
        cy.get('.send_papers .switch').should('have.attr', 'aria-checked', 'mixed').click();
        cy.get('.send_papers .switch').should(($switch) => {
            expect($switch.attr('aria-checked'), 'off is neither mixed nor true').to.not.be.oneOf(['mixed', 'true']);
        }).and('not.have.class', 'on').click();
        cy.get('.send_papers .switch').should('have.attr', 'aria-checked', 'true').and('have.class', 'on');

        label('sign_off_date_value', 'Signed Off On');
        cy.get('.sign_off_date_value').scrollIntoCentre();
        calendarBlocksFuture('Signed Off On');
        futureDateRefused('Signed Off On');
        dateInput('Signed Off On').clear({ force: true });
        dateInput('Signed Off On').type('28-07-2026{enter}', { force: true });
        dateInput('Signed Off On').should('have.value', '28-07-2026');

        // Report Submitted By and Reviewed By are sign-off buttons for the logged-in user's own
        // Person record, not people pickers; admin has none linked, so signing is refused.
        ['Report Submitted By', 'Reviewed By'].forEach((text) => cy.get(STEP_BODY).should('contain.text', text));
        cy.contains('You do not have permission to sign off');

        // The last step has no Next: Previous Step, plus Save once something changed.
        cy.get(FOOTER).should('contain.text', 'Previous Step').and('contain.text', 'Save')
            .and('not.contain.text', 'Next Step').and('not.contain.text', 'Undo');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });

    it('Shows the start and open controls on the launcher', function () {
        if (!consultation.reference) { this.skip(); return; }
        cy.contains('FMW Inspection', { timeout: 120000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
        cy.contains('button', 'Open Selected').should('be.visible').and('be.disabled');

        selectInDropdown(consultation.reference);
        cy.get('.select2-selection__rendered').first().invoke('text').should('match', /\S/);
        cy.contains('button', 'Open Selected').should('not.be.disabled');

        cy.get('.select2-selection__clear').first().click();
        cy.contains('button', 'Open Selected').should('be.disabled');
    });

    it('Opens the new consultation from the launcher with what was entered', function () {
        if (!consultation.reference) { this.skip(); return; }
        cy.contains('FMW Inspection', { timeout: 120000 }).click();
        cy.contains('button', 'Open Selected', { timeout: 60000 }).should('be.disabled');
        selectInDropdown(consultation.reference);
        cy.contains('button', 'Open Selected').should('not.be.disabled').click();

        // Back on the Start step, the ID matches and the other steps are open.
        cy.get('[aria-label="Report ID"]', { timeout: 90000 }).should('have.value', consultation.reference);
        cy.get('.workflow-nav-tab.active').should('contain.text', 'Start');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 0);

        // Everything entered on the Report tab was saved.
        cy.get('.workflow-nav-tab-container').contains('Report').click();
        cy.get('.widget-wrapper.related_monuments_and_areas .select2-selection', { timeout: 60000 }).should('exist');
        rows('related_monuments_and_areas').should('have.length', 1);
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice', { timeout: 60000 }).should('have.length', 2);
        ['owner', 'occupier', 'fm_warden'].forEach((alias) => rows(alias).should('have.length', 2));
        cy.get('.widget-wrapper.casework_officer', { timeout: 30000 }).should('contain.text', 'Name');
        cy.richTextValue('location_description_1').should('contain', 'Location description for automated testing.');
        cy.richTextValue('inspection_report').should('contain', 'Inspection report for automated testing.');
        cy.richTextValue('recommendation_description').should('contain', 'Recommendation for automated testing.');
        cy.richTextValue('consultation_description').should('contain', 'Notes for automated testing.');
        cy.scrollToWidget('date_of_visit');
        dateInput('Date of Visit').should('have.value', today());

        // The Irish Grid Reference was kept.
        cy.get('.workflow-nav-tab-container').contains('Irish Grid Reference').click();
        cy.get('[data-bind*="tm65Val"]', { timeout: 60000 }).filter(':visible').first().closest('.widget-wrapper')
            .find('#previewPoint').should('have.value', 'J1025169962');
    });

    it('Finds the completed consultation by its ID and shows what was entered', function () {
        if (!consultation.reference) { this.skip(); return; }
        const term = [{ context: '', context_label: '', id: `string${consultation.reference}`, text: consultation.reference,
            type: 'string', value: consultation.reference, inverted: false, selected: true }];
        const searchUrl = `/search?paging-filter=1&tiles=true&language=*&term-filter=${encodeURIComponent(JSON.stringify(term))}`;
        // The new resource may not be indexed yet, so search again until it shows.
        const searchUntilFound = (attemptsLeft) => {
            cy.intercept('GET', /search\/resources/).as('results');
            cy.visit(searchUrl, { timeout: 180000 });
            cy.wait('@results', { timeout: 60000 });
            cy.wait(2000);
            cy.get('body').then(($body) => {
                if ($body.text().includes(consultation.reference)) return;
                expect(attemptsLeft, `${consultation.reference} in search results`).to.be.greaterThan(0);
                cy.wait(5000);
                searchUntilFound(attemptsLeft - 1);
            });
        };
        searchUntilFound(6);

        // The result links to the resource's report.
        cy.get('a[href*="/report/"]', { timeout: 30000 }).first().invoke('attr', 'href').then((href) => {
            cy.visit(href, { timeout: 180000 });
        });
        [consultation.reference, 'Inspection report for automated testing.'].forEach((text) =>
            cy.contains(text, { timeout: 60000 }));
    });
});
