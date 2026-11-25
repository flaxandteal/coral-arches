describe('Going through the Merge Workflow', function () {
    const container = Cypress.env('CORAL_CONTAINER');

    // Seeded by seed_test_merge_pair. A merge consumes them, so locally the spec reseeds first.
    const BASE = 'HA/90 Merge Test Base';
    const OTHER = 'HA/91 Merge Test Other';
    // Seeded assets swapped in and out to show a selection is replaced.
    const SPARE = 'SMR-TEST-004 Testing';

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const CALENDAR = '.bootstrap-datetimepicker-widget';

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const todayString = () => `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    before(() => {
        // CI seeds the pair in the workflow; locally the spec reseeds the stack it runs against.
        if (!container) return;
        cy.exec(
            `docker exec -e CORAL_ALLOW_TEST_SEED=1 ${container} sh -c ` +
            `"[ -f /web_root/ENV/bin/activate ] && . /web_root/ENV/bin/activate; cd /web_root/coral 2>/dev/null || cd /app; ` +
            `python manage.py seed_test_merge_pair"`,
            { timeout: 180000, failOnNonZeroExit: true }
        );
    });

    beforeEach(() => {
        cy.login();
    });

    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
    };
    const info = (heading, text) => {
        cy.contains(heading, { timeout: 60000 });
        cy.contains(text);
    };
    const picker = (label) => cy.get(`[aria-label="${label}"] + .select2 .select2-selection`, { timeout: 60000 }).first();
    const pick = (label, name) => {
        picker(label).click();
        cy.select2Search(name);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(name).click();
        picker(label).should('contain.text', name);
    };
    const tabsDisabledAfter = (count) => cy.get('.workflow-nav-tab.disabled').should('have.length', count);

    it('Merges one Heritage Asset into another', function () {
        cy.visit('/plugins/merge-workflow', { timeout: 180000 });

        // Search: nothing to do until a base asset is chosen.
        info('Base Resource', 'The resource selected here will take priority during the merge.');
        cy.contains('label', 'Base Heritage Asset');
        footer({ previous: false, next: true });
        cy.get(FOOTER).contains('button', 'Next Step').should('have.class', 'disabled');
        tabsDisabledAfter(5);

        // A second pick replaces the first.
        pick('Base Heritage Asset', SPARE);
        pick('Base Heritage Asset', BASE);
        picker('Base Heritage Asset').should('not.contain.text', SPARE);
        footer({ previous: false, save: true });
        cy.contains('button', 'Save and Continue').click();

        // Merging
        info('Merge Resource', 'Data from this resource will be merged into the base resource');
        cy.contains('label', 'Merge Heritage Asset');
        footer({ next: true });
        cy.get(FOOTER).contains('button', 'Next Step').should('have.class', 'disabled');
        pick('Merge Heritage Asset', SPARE);
        pick('Merge Heritage Asset', OTHER);
        picker('Merge Heritage Asset').should('not.contain.text', SPARE);
        footer({ save: true });
        cy.contains('button', 'Save and Continue').click();

        // Map of Locations: the seeded assets have no geometry, so only the map itself is checked.
        info('Geometry Locations', 'Red represents the base resource. Blue represents the merge resource.');
        cy.get('.mapboxgl-canvas, .maplibregl-canvas', { timeout: 60000 }).should('be.visible');
        footer({ next: true });
        cy.get(FOOTER).contains('button', 'Next Step').should('not.have.class', 'disabled').click();

        // Information: both HA numbers, locked, and the reason is required.
        info('Please provide information', "It's mandatory that you provide information in the notes text box");
        cy.get('[aria-label="Base HA Number"]', { timeout: 60000 }).should('be.disabled').and('have.value', 'HA/90');
        cy.get('[aria-label="Merged HA Number"]').should('be.disabled').and('have.value', 'HA/91');
        cy.get('.widget-wrapper.description').should('contain.text', 'Notes');
        cy.typeRichText('description', 'Cypress merge: the two records describe the same site.');
        footer({ save: true });
        cy.contains('button', 'Save and Continue').click();

        // Approval
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Approval');
        footer({ save: true });
        cy.contains('Report Updated By');
        // The admin user has no Person in the merge sign-off groups.
        cy.contains('You do not have permission to sign off');
        cy.get('[aria-label="Reference ID"]').should('be.disabled')
            .and(($input) => expect($input.val()).to.match(/^MRT\/\d{4}\/\w+$/));
        cy.get('.widget-wrapper.date_of_submission_value').should('contain.text', 'Date of Submission');
        cy.get('.widget-wrapper.date_of_submission_value input.form-control').first().click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get('.workflow-nav-tab.active').click();
        cy.get('.widget-wrapper.date_of_submission_value input.form-control').first().should('have.value', todayString());
        cy.pickCalendarDay('date_of_submission_value', 1);
        cy.contains('button', 'Save and Continue').click();

        // Submit Merge: Submit waits for the acknowledgement, then starts the merge.
        info('WARNING: Process Description', 'This process cannot easily be undone');
        cy.contains('button', 'Submit').should('be.disabled');
        cy.get('input[type="checkbox"]:visible, .form-checkbox:visible').first().click({ force: true });
        cy.intercept('POST', '/merge-resources').as('merge');
        cy.contains('button', 'Submit').should('be.enabled').click();
        cy.wait('@merge').its('response.statusCode').should('eq', 200);
        cy.contains('Merge process has STARTED', { timeout: 30000 });
        cy.contains('You can now safely save and exit the workflow');
        cy.contains('button, .btn', /^\s*ok\s*$/i).click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });
});
