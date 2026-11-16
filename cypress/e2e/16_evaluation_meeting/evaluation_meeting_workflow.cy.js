describe('Going through the Evaluation Meeting Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    // cy.workflowNext() asserts the .step-counter value increases, which
    // assumes the counter tracks the tab you're currently viewing. It
    // doesn't here: open-evaluation-meeting-workflow.js's startNew() POSTs
    // the "Associated Building" tile directly via /api/tiles/ BEFORE the
    // workflow UI ever loads, so the step-builder's furthest-complete-step
    // detection sees that later step's data already present and the
    // counter starts (and stays) past every step this test's own clicks
    // would otherwise advance it to - cy.workflowNext() then always times
    // out waiting for a further increase that never comes, no matter which
    // tab it's actually called from. This clicks the same button without
    // that assertion; the cy.contains() check for each next tab's content
    // right after is what actually verifies the navigation worked.
    const clickNext = () => {
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled]):not(.disabled)')
            .contains(/Save and Continue|Next Step/)
            .click();
        cy.wait(2000);
    };

    // BLOCKED - confirmed application bug, not fixable from the test.
    //
    // The "Select Building" picker on Evaluation Meeting's own launcher
    // (open-evaluation-meeting-workflow.js's buildingString) filters
    // Heritage Assets on HB Number (node
    // 4b9883ef-9aad-559a-bd84-e4bb7b94a358) being "not_null". Verified with
    // an empty search on this picker (no typed text, so nothing but that
    // filter applies): it returns "No results found" - zero Heritage
    // Assets in this database satisfy it, seeded or otherwise. Checked why:
    //  - none of the seeded baseline HAs carry an HB Number
    //    (cypress/seed/coral_e2e_overrides.json sets hb_number: null on all
    //    of them, by design)
    //  - Add Building's own Finish-tab auto-numbering (componentName
    //    "generate-hb-number" in add-building-workflow.json) writes to a
    //    DIFFERENT nodegroup (dc49f08f-a4c5-5e23-bfa6-0587c085535d, the
    //    generic "Reference Code" field - confirmed in the DB as the
    //    "REF/2026/..." values it produces) rather than node 4b9883ef.
    //    Verified directly against the DB after running Add Building to
    //    completion multiple times: 4b9883ef's tile data stays JSON null
    //    every time.
    // So no path through the current UI can ever produce a resource this
    // picker will show, and therefore "Start New" on Evaluation Meeting can
    // never be reached. The helper below (same create-a-throwaway-resource
    // approach 25_merge_workflow's own createThrowawayHeritageAsset uses
    // for its picker) is kept for when that gap is fixed server-side - it
    // reaches Add Building's Finish step correctly - but it cannot make
    // this test pass until HB Number is actually set somewhere.
    const createThrowawayBuilding = (siteName) => {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Building').click();
        cy.wait(2000);
        cy.get('.btn-success').contains('Start New').click();

        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.workflowNext();

        cy.get('[aria-label="Heritage Asset Name"]').should('be.visible').click().type(siteName);
        cy.workflowNext();

        cy.wait(2000);
        cy.workflowNext(); // Descriptions - not required, nothing filled
        cy.wait(2000);
        cy.workflowNext(); // Location Details - not required, nothing filled
        cy.wait(2000);
        cy.workflowNext(); // Map - manually tested, see 01_add_garden
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext(); // Digital Files

        // Finish tab - reaching this is what fires generate-hb-number.
        cy.wait(2000);
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.wait(10000);
    };

    it('Create new meeting and go through the workflow and populate all fields', function () {
        const buildingName = `Evaluation Meeting Test Building ${Date.now()}`;
        createThrowawayBuilding(buildingName);

        cy.clearLocalStorage();
        cy.visit('/plugins/init-workflow');
        cy.contains('Workflows').should('be.visible');
        cy.contains('Evaluation Meeting').click();
        cy.wait(2000);

        // Unlike the generic open-workflow launcher, this workflow has its
        // own open-evaluation-meeting-workflow component/template: "Start
        // New" is bound `disable: !selectedBuilding()`, so it stays
        // disabled until a Heritage Asset is picked from the "Select
        // Building" resource-instance-select-widget above it.
        // Blindly clicking the first untyped-search result never actually
        // sets selectedBuilding() here (Start New stays disabled indefinitely
        // no matter how long you wait) - this resource-instance-select-widget
        // needs a real typed search and a match on an existing resource, the
        // same way 25_merge_workflow's base/merge pickers do.
        cy.get('.select2-selection').first().click();
        cy.select2Search(buildingName);
        cy.get('.select2-results__option').contains(buildingName).click();
        cy.wait(2000);

        // Start Meeting 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start Meeting tab - the "Consultation ID" -> "Meeting ID" labels
        // override in the JSON never actually applies (it only ever shows
        // up serialised inside a data-bind attribute, never as rendered
        // text), so the field keeps its real default label.
        cy.wait(2500);
        cy.contains('Consultation ID').should('be.visible');
        cy.get('.form-control').should('be.disabled');

        // Associated Building - links this meeting to an existing Heritage
        // Asset (widget label is "Monument or Area", not the workflow's own
        // "Associated Building" semanticName - see cards_x_nodes_x_widgets).
        // It's a resource-instance-list (multi), so scope by alias class
        // rather than pickRelationshipFirst (see 12_add_building).
        cy.contains('Monument or Area').scrollIntoView();
        cy.pickCardOption('related_monuments_and_areas');
        cy.wait(2000);

        clickNext();

        // Details tab
        cy.contains('Listing Query').scrollIntoView();
        cy.get('[aria-label="LQ"]').click().type('LQ-TEST-01');

        // "Monument or Area" (HB) reappears here as a disabled read-only
        // display of the building picked on Start Meeting - nothing to do.

        // Single-select reference-select-widget fields - scope by alias
        // class rather than input[aria-label] (see 12_add_building).
        cy.contains('Evaluation Meeting Type').scrollIntoView();
        cy.pickCardOption('evaluation_meeting_type');
        cy.wait(2000);

        cy.contains('Full Survey Requirement Type').scrollIntoView();
        cy.pickCardOption('full_survey_requirement_type');
        cy.wait(2000);

        // Consultation Dates - the "Date Consulted" -> "Meeting Date" label
        // override in the JSON doesn't match any node in this nodegroup (it
        // has Log Date/Target Date/Completion Date, no "Date Consulted"), so
        // it's a silent no-op; Log Date is the field that's actually visible
        // (Target Date Start and Completion Date are hidden).
        cy.contains('Log Date').scrollIntoView();
        cy.get('.card_component.log_date input.form-control').first().click();
        cy.get('.card_component.log_date .input-group-addon').click();

        // Contacts - Architect/Historian get relabelled "Architect
        // Present"/"Historian Present" by this card's labels override. Both
        // are resource-instance-list (multi), so scope by alias class.
        // This card's hiddenNodes list also leaves several other contact
        // roles visible (Archaeologist/CWT Area Manager/CWT Area
        // Supervisor/FM Warden(s)/HED Staff/Occupier(s)) - two entries in
        // that same hiddenNodes list (ecbda08c.../4c00b292...) don't exist
        // in this DB, so whatever two fields they were meant to hide stay
        // visible too; all now filled in for full field coverage.
        cy.contains('Architect Present').scrollIntoView();
        cy.pickCardOption('architect');
        cy.wait(2000);
        cy.contains('Historian Present').scrollIntoView();
        cy.pickCardOption('historian');
        cy.wait(2000);

        cy.pickCardOption('archaeologist');
        cy.wait(2000);
        cy.pickCardOption('cwt_area_manager');
        cy.wait(2000);
        cy.pickCardOption('cwt_area_supervisor');
        cy.wait(2000);
        cy.pickCardOption('fm_warden');
        cy.wait(2000);
        cy.pickCardOption('hed_staff_value');
        cy.wait(2000);
        cy.pickCardOption('occupier');
        cy.wait(2000);

        cy.contains('Reason').scrollIntoView();
        cy.get('[aria-label="Reason"]').click().type('Evaluation meeting reason');

        clickNext();

        // Location Details tab - read-only "show-nodes" summary of the
        // linked Heritage Asset's location fields, nothing to input.
        cy.contains('Heritage Asset').should('be.visible');
        clickNext();

        // Evaluation tab - saveWithoutProgressing, this is the last step.
        // get-designation-details ("Existing Grade") is a read-only display
        // of the HA's current designation, no input.
        // Single-select reference-select-widget fields - scope by alias
        // class rather than input[aria-label] (see 12_add_building).
        // "HAR Consideration"/"Proposed Grade Type" widget labels are
        // actually "HAR for Consideration"/"Proposed Grade".
        cy.contains('Criteria').scrollIntoView();
        cy.pickCardOption('evaluation_criteria');
        cy.wait(2000);

        cy.contains('HAR Consideration').scrollIntoView();
        cy.pickCardOption('har_consideration');
        cy.wait(2000);

        cy.contains('Proposed Grade Type').scrollIntoView();
        cy.pickCardOption('proposed_grade_type');
        cy.wait(2000);

        // The "Sign Off Date" nodeOptions override in the JSON targets node
        // id 5ffdc00e-03ad-11ef-948f-0242ac150003, which does not exist
        // anywhere in this nodegroup - same class of stale-id gap flagged
        // elsewhere, left as-is rather than guessed at.

        // Remaining visible fields on this card (this card has no
        // hiddenNodes list at all, so everything with a widget renders).
        cy.pickCardOption('enforcement_type');
        cy.wait(2000);
        cy.pickCardOption('propose_type');
        cy.wait(2000);
        cy.pickCardOption('senior_conservation_architect');
        cy.wait(2000);

        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Notes"]').click().type('Evaluation description');

        cy.get('.card_component.follow_up_meeting_date_value input.form-control').first().click();
        cy.get('.card_component.follow_up_meeting_date_value .input-group-addon').click();
        cy.wait(2000);
        cy.get('.card_component.start_date input.form-control').first().click();
        cy.get('.card_component.start_date .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
