describe('Going through the HA Designation Workflow', function () {
    const container = Cypress.env('CORAL_CONTAINER');

    // Seeded by seed_test_designation_asset: applying a revision rewrites the asset, so it has its own.
    const ASSET = 'HA/92 Designation Test';
    const BUILDING_NAME = 'Designation test building';

    const LAUNCHER = '/plugins/open-designation-workflow?workflow-slug=heritage-asset-designation-workflow';
    const HA_SELECT = '.select2-selection[aria-label^="Select Heritage Asset,"]';
    const REVISION_SELECT = '.select2-selection[aria-label^="Select Heritage Asset Revision"]';
    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const MANY_BUTTONS = '.btn-workflow-tile';
    const TILE_CARDS = '.wf-multi-tile-step-card';
    const CALENDAR = '.bootstrap-datetimepicker-widget';

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    before(() => {
        // CI seeds the asset in the workflow; locally the spec seeds the stack it runs against.
        if (!container) return;
        cy.exec(
            `docker exec -e CORAL_ALLOW_TEST_SEED=1 ${container} sh -c ` +
            `"[ -f /web_root/ENV/bin/activate ] && . /web_root/ENV/bin/activate; cd /web_root/coral 2>/dev/null || cd /app; ` +
            `python manage.py seed_test_designation_asset"`,
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
    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('contain.text', text);
    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));
    // Each step has at most one multi-entry card, so its buttons and entries are found page-wide.
    const manyButton = (anchor, text) => cy.contains(MANY_BUTTONS, text);
    const entries = () => cy.get(TILE_CARDS);
    // A new selection reaches the tile a moment after select2 shows it; Add straight away keeps the old value.
    // A new selection reaches the tile a moment after select2 shows it; Add straight away keeps the old value.
    const addEntry = (anchor, text) => {
        cy.wait(2000);
        manyButton(anchor, 'Add').should('not.have.class', 'disabled').click();
        entries().should('have.length', 1).and('contain.text', text).and('contain.text', 'Remove').and('contain.text', 'Edit');
    };
    const optionTexts = (alias) => {
        cy.get(`.widget-wrapper.${alias}`).scrollIntoView();
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        return cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length.greaterThan', 0)
            .then(($options) => $options.toArray().map((o) => o.textContent.trim()));
    };
    // Steps nest scroll containers, so bring a dropdown into view before picking from it.
    const pick = (alias, indexOrText = 0) => {
        cy.get(`.widget-wrapper.${alias}`).first().scrollIntoView();
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click({ force: true });
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        if (typeof indexOrText === 'string') {
            cy.get(REAL_OPTIONS, { timeout: 15000 }).contains(indexOrText).click({ force: true });
        } else {
            cy.get(REAL_OPTIONS, { timeout: 15000 }).eq(indexOrText).click({ force: true });
        }
    };
    // Picking a second option replaces the first.
    const pickTwice = (alias, first, second) => {
        cy.pickCardOption(alias, first);
        cy.pickCardOption(alias, second);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().should('contain.text', second).and('not.contain.text', first);
    };
    // A maxDate:today datepicker starts empty, puts today in when opened, and greys out every later day.
    const checkDate = (alias, text) => {
        label(alias, text);
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', '').click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get(`${CALENDAR} td.day.active:visible`).nextAll('td.day').each(($day) => expect($day).to.have.class('disabled'));
        cy.get('.workflow-nav-tab.active').click();
        notShown(CALENDAR);
        cy.pickCalendarDay(alias, 1);
        cy.get(`.widget-wrapper.${alias} input.form-control`).first().should('have.value', firstOfMonth());
    };

    const openLauncherWithAsset = () => {
        cy.visit(LAUNCHER, { timeout: 180000 });
        cy.contains('Heritage Asset Designation', { timeout: 60000 });
        cy.get(`${HA_SELECT}`, { timeout: 60000 }).first().click();
        cy.select2Search(ASSET);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(ASSET).click();
    };

    // The revision is built by a celery task, so reopen the launcher until it is listed.
    const pickRevision = (attempt = 0) => {
        openLauncherWithAsset();
        // Picking the asset changes the revision search, which re-creates that dropdown.
        cy.wait(3000);
        cy.get(REVISION_SELECT, { timeout: 60000 }).first().click();
        cy.get('.select2-dropdown', { timeout: 30000 }).should('be.visible');
        cy.get('.select2-results__option.loading-results', { timeout: 30000 }).should('not.exist');
        cy.wait(1000);
        cy.get('body').then(($body) => {
            if ($body.find(REAL_OPTIONS).length) {
                cy.get(REAL_OPTIONS).first().click();
                return;
            }
            expect(attempt, 'revision built - is the celery worker running?').to.be.lessThan(12);
            cy.get('body').type('{esc}');
            cy.wait(15000);
            pickRevision(attempt + 1);
        });
    };

    it('Builds a revision and designates the Heritage Asset', function () {
        // Heritage Asset Designation: Open Selected waits for a pick; Start New builds a revision.
        cy.visit(LAUNCHER, { timeout: 180000 });
        cy.contains('Heritage Asset Designation', { timeout: 60000 });
        cy.contains('button', 'Open Selected').should('be.disabled');
        openLauncherWithAsset();
        cy.intercept('POST', '/remap-monument-to-revision').as('remap');
        cy.contains('button', 'Start New').should('be.enabled').click();
        cy.wait('@remap').its('response.statusCode').should('eq', 200);
        cy.contains('Build Process Started', { timeout: 60000 });
        cy.contains('The Monument Revision is currently building.');
        cy.get('.ep-form-alert-buttons .btn-primary').first().click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');

        pickRevision();
        cy.contains('button', 'Open Selected').should('not.be.disabled').click();

        // Start: the asset, locked.
        cy.get('.workflow-nav-tab.active', { timeout: 90000 }).should('contain.text', 'Start');
        cy.contains('Heritage Asset', { timeout: 60000 });
        footer({ previous: false, next: true });
        cy.workflowNext();

        // Heritage Asset Details: a read-only summary of the asset.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Heritage Asset Details');
        cy.contains('Designation Test', { timeout: 60000 });
        cy.workflowNext();

        // Location Details
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Location Details');
        ['full_address', 'building_number_sub_street_value', 'sub_street_value', 'locality_value', 'address_status', 'address_currency']
            .forEach((alias) => notShown(`.widget-wrapper.${alias}`));
        [['building_name_value', 'Building Name'], ['building_number_value', 'Building Number'], ['street_value', 'Street'],
            ['town_or_city_value', 'Town or City'], ['postcode_value', 'Postcode'], ['county_value', 'County'],
            ['townland', 'Townland'], ['council', 'Council'], ['area_type', 'Area Type'], ['area_name', 'Area Name'],
            ['location_description', 'Location Description']].forEach(([alias, text]) => label(alias, text));
        cy.typeInCard('building_name_value', BUILDING_NAME);
        cy.typeInCard('street_value', 'Test Street');
        cy.typeInCard('town_or_city_value', 'Belfast');
        cy.typeInCard('postcode_value', 'BT1 1AA');
        pickTwice('county_value', 'Down', 'Antrim');
        cy.pickCardOption('townland', 'Abohill');
        // The 11 councils, named "LA06 - Ards and North Down Borough Council" in v8 where the checklist has "37: Ards and North Down".
        optionTexts('council').then((texts) => {
            expect(texts).to.have.length(11);
            expect(texts.some((t) => t.includes('Ards and North Down'))).to.equal(true);
        });
        cy.get(REAL_OPTIONS).contains('Ards and North Down').click();

        // Area descriptions: both fields are needed before Add.
        notShown(MANY_BUTTONS);
        cy.pickCardOption('area_type', 'Barony');
        manyButton('area_type', 'Add').should('have.class', 'disabled');
        cy.pickCardOption('area_name');
        addEntry('area_type', 'Barony');

        cy.typeRichText('location_description', 'Test location description');
        cy.workflowNext();

        // Map: the map loads, with a Feature Shape to pick. Drawing is tested by hand.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Map');
        cy.get('.maplibregl-canvas, .mapboxgl-canvas', { timeout: 60000 }).should('exist');
        label('feature_shape', 'Feature Shape');
        optionTexts('feature_shape').then((texts) => expect(texts).to.include('Dispersed Event'));
        cy.get(REAL_OPTIONS).contains('Dispersed Event').click();
        cy.workflowNext();

        // Assessment
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Assessment');
        // The checklist expects "Designation Description Type"; the type field is labelled "Designation Descriptions".
        label('designation_description_type', 'Designation Descriptions');
        label('designation_description', 'Designation Description');
        optionTexts('designation_description_type').then((texts) =>
            expect(texts).to.include.members(['Statutory', 'Assessment']));
        cy.get(REAL_OPTIONS).contains('Statutory').click();
        manyButton('designation_description_type', 'Add').should('have.class', 'disabled');
        cy.typeRichText('designation_description', 'Test designation description');
        addEntry('designation_description_type', 'Statutory');

        label('recommended_designation_type', 'Recommended designation, identification and protection');
        label('designation_or_protection_type', 'Designation or Protection Type');
        label('grade', 'Grade');
        label('listing_criteria', 'Listing Criteria');
        label('land_folio_number', 'Land Folio Number');
        label('cm_reference_number', 'Records NI');
        pick('designation_or_protection_type');
        // Grade is single-select: the second pick replaces the first.
        pick('grade', 0);
        cy.get('.widget-wrapper.grade .select2-selection__rendered').first().invoke('text').then((first) => {
            pick('grade', 1);
            cy.get('.widget-wrapper.grade .select2-selection__rendered').first().should('not.contain.text', first.trim());
            cy.get('.widget-wrapper.grade .select2-selection__choice').should('not.exist');
        });
        pick('listing_criteria', 0);
        pick('listing_criteria', 1);
        cy.get('.widget-wrapper.listing_criteria .select2-selection__choice').should('have.length', 2);
        cy.typeInCard('land_folio_number', 'FOLIO-TEST-1');
        cy.typeInCard('cm_reference_number', 'RECORDS-NI-TEST');
        cy.workflowNext();

        // Relevant Parties: people and organisations, several owners.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Relevant Parties');
        // Each relationship widget fetches its template on first use, which is slow on a dev server.
        cy.get('.widget-wrapper.occupier', { timeout: 180000 }).should('contain.text', 'Occupier');
        label('owner', 'Owner(s)');
        cy.pickRelationshipSearch('Occupier(s)', 'Test Person');
        cy.pickRelationshipSearch('Owner(s)', 'Test Person');
        cy.pickRelationshipSearch('Owner(s)', 'Test Organisation');
        cy.get('.widget-wrapper.owner .rr-table-row').should('have.length', 2);
        cy.workflowNext();

        // Documentation and Letters: uploads and letters are tested elsewhere.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Documentation');
        cy.contains('button', 'Select Files', { timeout: 60000 });
        footer({ next: true });
        cy.workflowNext();
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Letters');
        cy.workflowNext();

        // Approvals: sign-off people come from the sign-off groups; the dates are capped at today.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Approvals');
        label('assessment_done_by_value', 'Assessment Done By');
        label('desg_approved_by', 'Approved By');
        cy.contains('You do not have permission to sign off');
        [['assessment_date_value', 'Assessment Date'], ['desg_approved_date_value', 'Approval Date'],
            ['owner_notified_date_value', 'Owner Notified Date'],
            ['local_authority_notification_date_value', 'Local Authority Notification Date'],
            ['statutory_consultee_notification_date_value', 'Statutory Consultee Notification Date'],
            ['director_sign_off_date_value', 'Director Sign Off Date']].forEach(([alias, text]) => checkDate(alias, text));
        cy.workflowNext();

        // Apply Revision: confirmed with a tick, then a warning before it starts.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Apply Revision');
        cy.contains('WARNING: Process Description');
        cy.contains('button', 'Apply Revision').should('be.disabled');
        cy.get('.form-checkbox').click();
        cy.contains('button', 'Apply Revision').should('not.be.disabled').click();
        cy.get('.ep-alert-blue', { timeout: 30000 }).should('contain.text', 'Are you sure?').and('contain.text', 'This process cannot be undone');
        cy.get('.ep-form-alert-buttons .btn-primary').first().click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });
});
