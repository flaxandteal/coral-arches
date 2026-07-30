describe('Going through the HA Designation Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const LAUNCHER = '/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow';
    const HA_SELECT = '[aria-label="Select Heritage Asset, Please select a Heritage Asset"]';
    const REVISION_SELECT = '[aria-label="Select Heritage Asset Revision, Please select a Heritage Asset Revision"]';
    const REAL_OPTION = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';

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
        cy.get('.card_component.postcode_value input').filter(':visible').first().type('test');
        // Council is a concept dropdown; open it and pick a specific authority.
        cy.get('.council').filter(':visible').first().scrollIntoView();
        cy.get('.council').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Causeway Coast and Glens').click();
        // Walk the remaining tabs. Each step needs its own wait — two
        // back-to-back workflowNext() calls re-click the same stale button and
        // silently skip a tab.
        cy.workflowNext();          // Location Details -> Map
        cy.wait(3000);
        cy.workflowNext();          // Map -> Assessment
        cy.wait(3000);
        cy.workflowNext();          // Assessment -> Relevant Parties
        cy.wait(4000);
        cy.workflowNext();          // Relevant Parties -> Documentation
        cy.wait(4000);
        cy.workflowNext();          // Documentation -> Letters
        cy.wait(4000);
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
        // Advance off Approvals. Match on the button text rather than
        // '> .btn-success > .verbose' — the footer's forward control is a plain
        // "Save" on the last tabs, so that structural selector is not always there.
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains(/Save and Continue|Next Step|Save/)
            .click();
        cy.wait(4000);
        cy.get('.form-checkbox').click();
        cy.get('.widgets > :nth-child(2) > .btn > span').click();
        cy.get('.widgets > :nth-child(2) > .btn > span').click();
        cy.get('.ep-form-alert-buttons > .btn-primary > span').click();
    })
})
