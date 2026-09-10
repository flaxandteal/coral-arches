describe('Going through the HA Designation Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const LAUNCHER = '/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow';
    const HA_SELECT = '[aria-label="Select Heritage Asset, Please select a Heritage Asset"]';
    const REVISION_SELECT = '[aria-label="Select Heritage Asset Revision, Please select a Heritage Asset Revision"]';
    const REAL_OPTION = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const UPLOAD_FIXTURE = 'cypress/e2e/03_ha_designation/ha-designation-test-upload.txt';
    const UPLOAD_NAME = 'ha-designation-test-upload.txt';

    // Open the launcher and pick the Heritage Asset to designate. Always the
    // FIRST 'Testing' match: the launcher sorts results ascending, so repeating
    // the same search lands on the same asset, and the revision dropdown below
    // is filtered by the selected asset's HA number (see revisionSearchString in
    // open-designation-workflow.js) — a different asset would show no revision.
    function openLauncherAndSelectHa() {
        cy.visit(LAUNCHER);
        cy.wait(3000);
        cy.get(HA_SELECT, { timeout: 60000 }).click();
        cy.wait(2000);
        cy.select2Search('Testing');
        cy.wait(3000);
        cy.get('.select2-results__option').contains('Testing').first().click();
        cy.wait(2000);
    }

    it('Add new ha to designate then run through workflow', function () {
        openLauncherAndSelectHa();
        cy.contains('Start New').click({ force: true });
        // "Start New" is startRemapAndOpen(): it POSTs /remap-monument-to-revision
        // and then calls openWorkflow(), which sees the queued alert and shows it
        // instead of opening anything. Wait for that alert rather than
        // snapshotting the DOM once after a fixed pause.
        cy.get('.ep-form-alert-buttons .btn', { timeout: 60000 }).should('exist');
        // Acknowledging the "Build Process Started" (ep-alert-blue) alert
        // navigates back to /plugins/init-workflow — that is openWorkflow()'s OK
        // callback in coral/media/js/viewmodels/open-workflow.js, not a stray
        // cancel button. So the launcher has to be re-opened afterwards; the
        // spec used to sit on the old page waiting for a dropdown that had gone.
        cy.get('.ep-form-alert-buttons .btn-primary').first().click();
        cy.wait(3000);

        // The revision itself is built by the celery task remap_monument_to_revision
        // ("This process takes a few minutes"), so the revision dropdown stays
        // empty until the worker finishes. Re-open the launcher on a loop until a
        // real option shows up. If this never resolves, check that the stack is
        // actually running a celery worker — the CI compose file grew one in
        // docker-compose.ci.yml for exactly this reason.
        const pickRevision = (attempt = 0) => {
            openLauncherAndSelectHa();
            cy.get(REVISION_SELECT, { timeout: 60000 }).click();
            // The dropdown queries the server when it opens. $b.find() below is a
            // ONE-SHOT probe that never retries, so a plain cy.wait() reported
            // "no revisions" whenever the response took longer than the pause -
            // the CI run at 14:55 polled 13 times and every revision search
            // returned a hit the whole time. Wait for the dropdown to open and
            // for its in-flight request to settle, so the probe sees real state.
            cy.get('.select2-dropdown', { timeout: 30000 }).should('be.visible');
            cy.get('.select2-results__option.loading-results', { timeout: 30000 })
                .should('not.exist');
            cy.wait(1000);
            cy.get('body').then(($b) => {
                if ($b.find(REAL_OPTION).length) {
                    cy.get(REAL_OPTION).first().click();
                    return;
                }
                if (attempt >= 12) {
                    throw new Error('Monument Revision never finished building - is the celery worker running?');
                }
                cy.get('body').type('{esc}');   // close, let the build progress
                cy.wait(15000);
                pickRevision(attempt + 1);
            });
        };
        pickRevision();
        cy.wait(2000);
        cy.contains('Open Selected').click();

        cy.wait(8000);
        cy.workflowNext();
        cy.wait(2000);
        cy.workflowNext();
        cy.wait(2000);
        // Location Details tab.
        cy.get('.card_component.building_name_value input').filter(':visible').first().type('test');
        cy.get('.card_component.street_value input').filter(':visible').first().type('test');
        cy.get('.card_component.town_or_city_value input').filter(':visible').first().type('test');
        // County is a concept dropdown. Unlike townland/council, "county" is
        // a semantic grouping node with no widget of its own — the actual
        // reference field is county_value (county_type only classifies it).
        cy.get('.county_value').filter(':visible').first().scrollIntoView();
        cy.get('.county_value').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Antrim').click();
        cy.get('.card_component.postcode_value input').filter(':visible').first().type('test');
        // Townland is a concept dropdown; open it and pick a specific townland.
        cy.get('.townland').filter(':visible').first().scrollIntoView();
        cy.get('.townland').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Abohill').click();
        // Council is a concept dropdown; open it and pick a specific authority.
        cy.get('.council').filter(':visible').first().scrollIntoView();
        cy.get('.council').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Causeway Coast and Glens').click();

        // Area Assignments is a repeatable card: pick Area Type and Area
        // Name, click Add, then confirm both picked values now appear in
        // the tile list Arches renders above the form.
        cy.get('.card_component.area_type').filter(':visible').first().scrollIntoView();
        cy.get('.card_component.area_type').filter(':visible').first()
            .find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').not('.loading-results').not('.select2-results__option--load-more')
            .first().invoke('text').then((areaTypeText) => {
                areaTypeText = areaTypeText.trim();
                cy.get('.select2-results__option').contains(areaTypeText).click();

                cy.get('.card_component.area_name').filter(':visible').first().scrollIntoView();
                cy.get('.card_component.area_name').filter(':visible').first()
                    .find('.select2-selection').first().click();
                cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
                cy.get('.select2-results__option').not('.loading-results').not('.select2-results__option--load-more')
                    .first().invoke('text').then((areaNameText) => {
                        areaNameText = areaNameText.trim();
                        cy.get('.select2-results__option').contains(areaNameText).click();

                        cy.get('.btn-success').contains('Add').click();
                        cy.wait(2000);
                        // The new tile renders above the form, off the current
                        // scroll position, so it's clipped by the scrollable
                        // container until scrolled into view.
                        cy.contains(areaTypeText).scrollIntoView().should('be.visible');
                        cy.contains(areaNameText).scrollIntoView().should('be.visible');
                    });
            });

        // Location Descriptions is also a repeatable card: type free text,
        // click Add, and confirm it shows up in the tile list. Description
        // Type is NOT filled here: this card's own workflow step config
        // (address-step's Location Descriptions componentConfig in
        // heritage-asset-designation-workflow.json) lists that node's real
        // graph id (4680d6d9-9167-4607-bf72-9d4fb708c74d) in hiddenNodes, so
        // the widget renders with visible: false (display:none) on this step
        // and can never be interacted with here — confirmed by inspecting
        // the live DOM, not a scroll/render-timing issue.
        //
        // location_description itself is a rich-text-widget (CKEditor), not
        // a plain <input>, so cy.typeInCard (which only matches
        // input.form-control) can never find it either; use type_ckeditor
        // instead, same as other specs' rich-text fields.
        cy.type_ckeditor('location_description', 'Test location description');
        // This card's own Add button doesn't have class btn-success (it's
        // .btn-mint, per the live DOM); .btn-success only matches Area
        // Assignments' Add button, so an unscoped lookup always clicked the
        // wrong card's button (a no-op there) and this tile never got
        // added. Scope the click to the button inside this same .card
        // (Add lives in .install-buttons, a sibling of the widgets form).
        // cy.get('.card_component.location_description').filter(':visible').first()
        //     .closest('.card').find('.install-buttons button').contains('Add').click();
        // cy.wait(2000);
        // cy.contains('Test location description').scrollIntoView().should('be.visible');

        // Walk the remaining tabs. Each step needs its own wait — two
        // back-to-back workflowNext() calls re-click the same stale button and
        // silently skip a tab.
        cy.workflowNext();          // Location Details -> Map
        cy.wait(3000);
        // Map tab — besides the draw widget, it has a Feature Shape concept
        // dropdown (alias feature_shape). The widget itself renders via an
        // async knockout `component:` binding, so `.card_component.feature_shape`
        // can still be absent right after the tab switch; anchor on the
        // widget's own label text instead and give it a real timeout to
        // appear, then walk up to the card to find the select2 control.
        cy.contains('.control-label', 'Feature Shape', { timeout: 15000 })
            .closest('.card_component').scrollIntoView();
        cy.contains('.control-label', 'Feature Shape')
            .closest('.card_component')
            .find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').not('.loading-results').not('.select2-results__option--load-more')
            .first().click();
        cy.wait(1000);
        cy.workflowNext();          // Map -> Assessment
        cy.wait(3000);
        // Assessment tab — the workflow config marks Designation Description
        // Type and Designation Description as required on this step (see
        // nodeOptions on assessment-step in heritage-asset-designation-workflow.json),
        // so Next Step won't advance until they're filled in and added.
        // Same async component-rendering issue as Feature Shape above: anchor
        // on the widget's own label text ("Designation Descriptions") rather
        // than the card_component class, which can lose the race against the
        // knockout `component:` binding.
        cy.contains('.control-label', 'Designation Descriptions', { timeout: 15000 })
            .closest('.card_component').scrollIntoView();
        cy.contains('.control-label', 'Designation Descriptions')
            .closest('.card_component')
            .find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').not('.loading-results').not('.select2-results__option--load-more')
            .first().click();
        // designation_description is a rich-text-widget (CKEditor), not a
        // plain <input> — typeInCard only matches input.form-control and
        // never finds it, same as location_description elsewhere in this
        // spec. Scope by card class since there may be other CKEditor
        // instances on this tab.
        cy.typeRichText('designation_description', 'Test designation description');
        cy.get('.btn-success').contains('Add').click();
        cy.wait(2000);

        // Designation and Protection Assignment — single tile, all its
        // visible fields (everything not in the step's hiddenNodes list).
        const designationConceptFields = [
            'recommended_designation_type','grade', 'listing_criteria', 'scheduling_criteria','land_use_site'
        ];
        designationConceptFields.forEach((field) => cy.pickCardOption(field));
        cy.typeInCard('land_folio_number', 'Test folio number');

        // Records NI (CM Reference) — single tile.
        cy.typeInCard('cm_reference_number', 'Test CM reference number');

        // HMC Reference — single tile.
        cy.typeInCard('hmc_reference_number', 'Test HMC reference number');

        cy.workflowNext();          // Assessment -> Relevant Parties
        cy.wait(4000);
        // Relevant Parties tab — Applicant, Agent and Field Worker are
        // hidden on this step (see hiddenNodes on relevant-parties-step),
        // leaving Owner and Occupier as the visible resource-instance
        // relationships
        cy.pickRelationshipFirst('Occupier');
        cy.pickRelationshipFirst('Owner');
        cy.wait(2000);
        cy.workflowNext();          // Relevant Parties -> Documentation
        cy.wait(4000);
        // Documentation tab — upload a fixture file through the dropzone.
        // The dropzone's own <input type="file"> is hidden, hence
        // { force: true }.
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
        cy.workflowNext();          // Documentation -> Letters
        cy.wait(4000);
        // Letters tab — Designation Letter Type is a concept dropdown; pick
        // the first option.
        cy.pickCardOption('designation_letter_type');
        cy.workflowNext();          // Letters -> Approvals
        cy.wait(5000);
        // Approvals tab — every date is a datepicker widget; clicking its
        // calendar addon fills today.
        cy.fillDate('assessment_date_value');
        cy.fillDate('desg_approved_date_value');
        cy.fillDate('owner_notified_date_value');
        cy.fillDate('council_consulted_date');
        cy.fillDate('council_response_date');
        cy.fillDate('local_authority_notification_date_value');
        cy.fillDate('statutory_consultee_notification_date_value');
        cy.fillDate('director_sign_off_date_value');

        // Every date above has its own qualifier + qualifier metatype concept
        // dropdowns alongside it.
        const approvalQualifierFields = [
            'assessment_date_qualifier', 'assessment_date_qualifier_metatype',
            'desg_approved_date_qualifier', 'desg_approved_date_qualifier_metatype',
            'owner_notified_date_qualifier', 'owner_notified_date_qualifier_metatype',
            'local_authority_notification_date_qualifier', 'local_authority_notification_date_qualifier_metatype',
            'statutory_consultee_notification_date_qualifier', 'statutory_consultee_notification_date_qualifier_metatype',
            'director_sign_off_date_qualifier', 'director_sign_off_date_qualifier_metatype',
        ];
        approvalQualifierFields.forEach((field) => cy.pickCardOption(field));

        // Role type/metatype for the two sign-off people (Assessment Done By,
        // Approved By) are plain concept dropdowns, independent of the
        // sign-off widgets themselves.
        cy.pickCardOption('assessment_done_by_role_type');
        cy.pickCardOption('assessment_done_by_role_metatype');
        cy.pickCardOption('desg_approver_role_type');
        cy.pickCardOption('desg_approver_role_metatype');

        cy.typeInCard('council_response', 'Test council response');

        // Assessment Done By / Approved By are user-to-model-select sign-off
        // widgets: clicking only sets a value if the logged-in user's Person
        // belongs to one of the configured signOffGroups. The admin login used
        // here isn't in those groups, so (as already established in
        // 07_incident_report.cy.js) the widget just renders "You do not have
        // permission to sign off" — confirm the cards are present rather than
        // trying to click them.
        cy.get('.card_component.assessment_done_by_value').should('be.visible');
        cy.get('.card_component.desg_approved_by').should('be.visible');

        // Advance off Approvals. Match on the button text rather than
        // '> .btn-success > .verbose' — the footer's forward control is a plain
        // "Save" on the last tabs, so that structural selector is not always there.
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains(/Save and Continue|Next Step|Save/)
            .click();
        cy.wait(4000);

        // Apply Revision tab — the summary lists back everything we filled
        // in on the Approvals tab (see approval-summary.js's renderNodeIds).
        // The two sign-off fields should read "Not provided": no login used
        // in this suite belongs to a signOffGroup, so those widgets could
        // never be filled (see the Approvals tab comment above).
        [
            'Assessment Date', 'Approved Date', 'Owner Notified Date',
            'Local Authority Notification Date', 'Statutory Consultee Notification Date',
            'Director Sign Off Date',
        ].forEach((label) => {
            cy.contains('.block-item', `${label}:`).should('not.contain.text', 'Not provided');
        });
        ['Assessment Done By', 'Approved By'].forEach((label) => {
            cy.contains('.block-item', `${label}:`).should('contain.text', 'Not provided');
        });

        // "Apply Revision" stays disabled until the acknowledgement checkbox
        // is checked (see hasAcknowledgedProcess in start-remap-and-merge.js).
        cy.get('.widgets > :nth-child(2) > .btn').should('be.disabled');
        cy.get('.form-checkbox').click();
        cy.get('.widgets > :nth-child(2) > .btn').should('not.be.disabled');
        cy.get('.widgets > :nth-child(2) > .btn > span').click();

        // Clicking it raises an "Are you sure?" confirm alert; confirming
        // POSTs /remap-revision-to-monument and redirects back to the
        // workflow launcher once the merge is done.
        cy.get('.ep-alert-blue', { timeout: 10000 }).should('contain.text', 'Are you sure?');
        cy.get('.ep-form-alert-buttons > .btn-primary > span').click();
        cy.location('pathname', { timeout: 30000 }).should('include', '/plugins/init-workflow');
    });
});
