describe('Going through the HA Designation Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Add new ha to designate then run through workflow', function () {
        cy.get('[href="/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(2000);
        cy.get('[aria-label="Select Heritage Asset, Please select a Heritage Asset"]').click();
        cy.wait(2000);
        cy.select2Search('Testing');
        cy.wait(3000);
        cy.get('.select2-results__option').contains('Testing').click();
        cy.wait(2000);
        cy.contains('Start New').click({ force: true });
        // The revision is created server-side and confirmed by an alert. Wait for
        // that alert to appear (retrying) rather than snapshotting the DOM once
        // after a fixed pause — it can take longer than the pause, and a missed
        // alert then blocks the revision dropdown underneath it.
        cy.get('.ep-form-alert-buttons .btn', { timeout: 60000 }).should('exist');
        // Confirm with the primary (OK) button specifically — clicking every
        // button, or blindly taking the first, can hit the cancel handler, which
        // bounces back to /plugins/init-workflow and loses the dropdown.
        cy.get('body').then(($b) => {
            const $ok = $b.find('.ep-form-alert-buttons .btn-primary');
            cy.get($ok.length
                ? '.ep-form-alert-buttons .btn-primary'
                : '.ep-form-alert-buttons .btn').first().click();
        });
        cy.wait(3000);
        // "Start New" only KICKS OFF the revision build - the alert says so
        // ("The Monument Revision is currently building. This process takes a few
        // minutes"). It runs on the celery worker, so the revision dropdown stays
        // empty until it finishes. Re-open the dropdown on a loop until a real
        // option shows up, rather than reading it once and picking whatever is
        // there (which is why this step was intermittently failing).
        const REVISION_SELECT = '[aria-label="Select Heritage Asset Revision, Please select a Heritage Asset Revision"]';
        const REAL_OPTION = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';

        const pickRevision = (attempt = 0) => {
            cy.get(REVISION_SELECT, { timeout: 60000 }).click();
            cy.wait(3000);
            cy.get('body').then(($b) => {
                if ($b.find(REAL_OPTION).length) {
                    cy.get(REAL_OPTION).first().click();
                } else if (attempt < 20) {
                    cy.get('body').type('{esc}');   // close, let the build progress
                    cy.wait(15000);
                    pickRevision(attempt + 1);
                } else {
                    throw new Error('Monument Revision never finished building - is the celery worker running?');
                }
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
