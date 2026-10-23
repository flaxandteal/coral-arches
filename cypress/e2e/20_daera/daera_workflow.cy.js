describe('Going through the DAERA Workflow', function () {

    // Seeded Heritage Assets (cypress/seed). The first two have a recommended
    // designation of Scheduled Monument; the third does not. HA/02 has no reference,
    // type or address (all "No data available").
    const HA_NO_DATA = 'HA/02 Testing';
    const HA_SCHEDULED_1 = 'SMR-TEST-005 Testing';
    const HA_SCHEDULED_2 = 'SMR-TEST-006 Testing';
    const HA_NOT_SCHEDULED = 'SMR-TEST-004 Testing';

    // Date Received drives Due Date: the `update-dates` component writes received + 21 into Due Date.
    // Date Received, Date Acknowledged, Response Date and the sign-off Date are capped at today.
    const DAYS_TO_ADD = 21;
    const FOOTER = '.tabbed-workflow-footer-button-container';
    const CALENDAR = '.bootstrap-datetimepicker-widget';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';

    const pad = (n) => String(n).padStart(2, '0');
    const ddmmyyyy = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const daysFromToday = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
    const daysAgo = (n) => daysFromToday(-n);
    // dd-mm-yyyy (what the widgets render) -> dd-mm-yyyy n days later.
    const addDays = (text, days) => {
        const [dd, mm, yyyy] = text.split('-').map(Number);
        return ddmmyyyy(new Date(yyyy, mm - 1, dd + days));
    };
    const TODAY = ddmmyyyy(new Date());
    const FIRST_OF_MONTH = `01-${pad(new Date().getMonth() + 1)}-${new Date().getFullYear()}`;

    const DATE_RECEIVED = ddmmyyyy(daysAgo(6));
    const DATE_RECEIVED_AGAIN = ddmmyyyy(daysAgo(5));
    const DATE_ACKNOWLEDGED = FIRST_OF_MONTH;
    const DUE_DATE = ddmmyyyy(daysAgo(1));
    const RESPONSE_DATE = ddmmyyyy(daysAgo(2));
    const SIGN_OFF_DATE = ddmmyyyy(daysAgo(1));

    const CONSULTATION_GRAPH = '8d41e49e-a250-11e9-9eab-00224800b26d';
    const STATUS = 'Approved';
    const TYPE = 'Abstraction';
    const CM_REFERENCE = 'CM-TEST-001';
    const COMMENTS = 'Cypress consultation comments.';
    const LETTER_TYPE = 'DAERA AIL Consultation';

    // Set by the full walk-through and used by the tests after it.
    const consultation = {};

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    const haWidget = '.widget-wrapper.related_heritage_assets_n1';
    const rows = (alias) => cy.get(`.widget-wrapper.${alias} .rr-table-row`, { timeout: 15000 });
    const dateInput = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).first();
    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));
    const counts = (monuments, scheduled) => {
        cy.get('input[aria-label="Monuments"]', { timeout: 15000 }).should('have.value', String(monuments));
        cy.get('input[aria-label="Scheduled monuments"]', { timeout: 15000 }).should('have.value', String(scheduled));
    };
    const noUndo = () => cy.get(FOOTER).should('not.contain.text', 'Undo');
    const removeHeritageAsset = (name) => {
        cy.contains(`${haWidget} .rr-table-row`, name).find('button:has(.fa-trash)').click();
        cy.contains(`${haWidget} .rr-table-row`, name).should('not.exist');
    };

    const openLauncher = () => {
        cy.get('[href="/plugins/open-workflow?workflow-slug=daera-workflow"] > .workflow-select-card', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
    };

    // The generated Consultation ID (AIL number) arrives a moment after the step renders.
    const startNew = () => {
        openLauncher();
        cy.contains('button', 'Start New').click();
        cy.get('[aria-label="Consultation ID"]', { timeout: 60000 })
            .should(($input) => expect($input.val()).to.match(/^AIL/));
    };

    const ailNumber = (id) => Number(id.match(/^AIL(\d+)-/)[1]);

    const openFromLauncher = (id) => {
        openLauncher();
        cy.contains('button', 'Open Selected').should('be.disabled');
        selectInDropdown(id);
        cy.contains('button', 'Open Selected').should('not.be.disabled').click();
        cy.get('[aria-label="Consultation ID"]', { timeout: 90000 }).should('have.value', id);
    };

    // With the calendar open on a date field, today is selectable and the day after it is not.
    const tomorrowBlocked = () => {
        cy.get(`${CALENDAR} td.day.today:visible`).should('not.have.class', 'disabled');
        cy.get(`${CALENDAR} td.day:visible`).then(($days) => {
            const todayAt = $days.toArray().findIndex((day) => day.classList.contains('today'));
            expect($days.eq(todayAt + 1)).to.have.class('disabled');
        });
    };

    // A date capped at today shows a calendar with the days after today disabled, and closes on click-away.
    const futureDaysBlocked = (alias, away = '.widget-wrapper.consultation_type_n1') => {
        cy.scrollToWidget(alias);
        dateInput(alias).click({ force: true });
        cy.get(`${CALENDAR} td.day:visible`).should('exist');
        tomorrowBlocked();
        cy.get(away).first().click({ force: true, position: 'topLeft' });
        notShown(CALENDAR);
    };

    // The minimum a later step needs: a type picked on the Consultation step.
    const fillMinimalConsultation = () => {
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        cy.pickCardOption('consultation_type_n1', TYPE);
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection').first().should('contain.text', TYPE);
    };

    const toSignOff = () => {
        cy.workflowNext();          // Consultation -> Documentation
        cy.workflowNext();          // Documentation -> Letters
        cy.workflowNext();          // Letters -> Sign off
        cy.contains('.arches-toggle-sm', 'Within Deadline', { timeout: 60000 }).should('exist');
    };
    // An unset switch has no aria-checked, so No is the attribute not being "true", re-read after the deadline lookup settles.
    const withinDeadline = (expected) => {
        const getSwitch = () => cy.get('span.switch[aria-label^="Within Deadline"]', { timeout: 30000 });
        if (expected) {
            getSwitch().should('have.attr', 'aria-checked', 'true');
            return;
        }
        cy.wait(5000);
        getSwitch().should('not.have.attr', 'aria-checked', 'true');
    };

    // Start step: ID generated into a locked box, later steps locked, no Undo.
    function fillStartTab() {
        cy.get('[aria-label="Consultation ID"]', { timeout: 60000 }).should('be.disabled');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 4);
        cy.get(FOOTER).should('contain.text', 'Save and Continue').and('not.contain.text', 'Previous Step');
        noUndo();
        cy.get('[aria-label="Consultation ID"]').invoke('val').then((id) => { consultation.id = id; });
    }

    function fillHeritageAssets() {
        cy.get(haWidget, { timeout: 60000 }).should('exist');
        cy.get('input[aria-label="Monuments"]').should('be.disabled');
        cy.get('input[aria-label="Scheduled monuments"]').should('be.disabled');

        // A search matching no Heritage Asset offers nothing, and no way to create one.
        cy.openRelationship('Related Heritage Assets');
        cy.get('.select2-search__field:visible').first().type('XXXXXXX');
        cy.get('.select2-results__option', { timeout: 20000 })
            .should('contain.text', 'No results found')
            .and('not.contain.text', 'Create a new');

        // Missing details read "No data available" under the generic reference label.
        cy.pickRelationshipSearch('Related Heritage Assets', 'HA/02', HA_NO_DATA);
        cy.contains('Heritage Reference Number').should('be.visible');
        cy.contains('No data available').should('exist');
        counts(1, 0);

        // A picked asset is greyed in the list, and choosing it again adds nothing.
        cy.openRelationship('Related Heritage Assets');
        cy.select2Search('HA/02');
        cy.contains(REAL_OPTIONS, HA_NO_DATA).should('have.attr', 'aria-disabled', 'true').click();
        rows('related_heritage_assets_n1').should('have.length', 1);
        counts(1, 0);

        cy.pickRelationshipSearch('Related Heritage Assets', 'SMR-TEST-005', HA_SCHEDULED_1);
        cy.contains('SMR Number', { timeout: 30000 }).should('exist');
        cy.contains(HA_SCHEDULED_1, { timeout: 30000 }).should('exist');
        cy.contains('Ecclesiastical Site', { timeout: 30000 }).should('exist');
        cy.contains('Knockans', { timeout: 30000 }).should('exist');
        counts(2, 1);

        cy.pickRelationshipSearch('Related Heritage Assets', 'SMR-TEST-006', HA_SCHEDULED_2);
        cy.contains('Chambered Tomb', { timeout: 30000 }).should('exist');
        cy.contains('Dunteige', { timeout: 30000 }).should('exist');
        counts(3, 2);

        cy.pickRelationshipSearch('Related Heritage Assets', 'SMR-TEST-004', HA_NOT_SCHEDULED);
        counts(4, 2);
        rows('related_heritage_assets_n1').should('have.length', 4);

        removeHeritageAsset(HA_NO_DATA);
        cy.contains('Heritage Reference Number', { timeout: 30000 }).should('not.exist');
        counts(3, 2);
        removeHeritageAsset(HA_SCHEDULED_1);
        counts(2, 1);
        rows('related_heritage_assets_n1').should('have.length', 2);
    }

    // Each people field is searchable and takes several resources, shown as rows below the field.
    function fillPeople() {
        const fields = [
            { alias: 'agent_n1', label: 'Agent', term: 'Test Person' },
            { alias: 'applicant_n1', label: 'Applicant', term: 'Test Person' },
            { alias: 'applicant_organisation', label: 'Applicant organisation', term: 'Test Organisation', second: false },
            { alias: 'referred_to', label: 'Referred to', term: 'Test Person' },
        ];
        fields.forEach(({ alias, label, term, second = true }) => {
            cy.openRelationship(label);
            cy.select2Search(term);
            cy.get(REAL_OPTIONS).contains(term).click();
            rows(alias).should('have.length', 1);
            if (!second) return;
            cy.pickRelationshipSecond(label);
            rows(alias).should('have.length', 2);
        });

        // Agent and Applicant offer only existing people.
        ['Agent', 'Applicant'].forEach((field) => {
            cy.openRelationship(field);
            cy.get('.select2-search__field:visible').first().type('XXXXXXX');
            cy.get('.select2-results__option', { timeout: 30000 }).should('not.contain.text', 'Create a new');
            cy.get('body').type('{esc}');
        });
    }

    function fillDates() {
        // Opening an empty date puts today in, and Due Date follows Date Received by 21 days.
        cy.scrollToWidget('date_received');
        dateInput('date_received').click({ force: true });
        cy.get(`${CALENDAR} td.day:visible`).should('exist');
        tomorrowBlocked();
        cy.get('.widget-wrapper.consultation_type_n1').click({ force: true, position: 'topLeft' });
        notShown(CALENDAR);
        dateInput('date_received').should('have.value', TODAY);
        dateInput('due_date').should('have.value', addDays(TODAY, DAYS_TO_ADD));

        cy.replaceDate('date_received', DATE_RECEIVED);
        dateInput('due_date').should('have.value', addDays(DATE_RECEIVED, DAYS_TO_ADD));
        cy.replaceDate('date_received', DATE_RECEIVED_AGAIN);
        dateInput('due_date').should('have.value', addDays(DATE_RECEIVED_AGAIN, DAYS_TO_ADD));

        // Due Date stays editable by hand.
        cy.replaceDate('due_date', DUE_DATE);
        dateInput('due_date').should('have.value', DUE_DATE);

        futureDaysBlocked('date_acknowledged');
        // Picked from the calendar (the other dates are typed) to cover both ways in.
        cy.pickCalendarDay('date_acknowledged', 1);
        dateInput('date_acknowledged').should('have.value', DATE_ACKNOWLEDGED);

        futureDaysBlocked('response_date');
        cy.replaceDate('response_date', RESPONSE_DATE);
    }

    function fillConsultationTab() {
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        cy.get(FOOTER).should('contain.text', 'Previous Step');

        fillHeritageAssets();
        fillPeople();
        fillDates();

        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection__placeholder').should('contain.text', 'Select an option');
        cy.pickCardOption('consultation_type_n1', TYPE);
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection').first().should('contain.text', TYPE);

        cy.get('.widget-wrapper.advice_text .widget-input-label').first().should('have.text', 'Comments');
        cy.typeRichText('advice_text', COMMENTS);

        cy.get('.widget-wrapper.cm_reference_number .widget-input-label').first().should('have.text', 'Records NI');
        cy.scrollToWidget('cm_reference_number');
        cy.get('.widget-wrapper.cm_reference_number input.form-control').first()
            .type(CM_REFERENCE, { force: true });

        cy.get('.widget-wrapper.consultation_status .select2-selection__placeholder').should('contain.text', 'Select an option');
        cy.pickCardOption('consultation_status', STATUS);
        cy.get('.widget-wrapper.consultation_status .select2-selection').first().should('contain.text', STATUS);

        noUndo();
    }

    // File upload is left out (per-environment storage bucket):
    // cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });
    function fillDocumentationTab() {
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.get(FOOTER).should('contain.text', 'Next Step').and('not.contain.text', 'Undo');
    }

    // Every value entered on the Consultation step is shown, whether reached by Previous Step or by reopening.
    function consultationValuesShown() {
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        rows('related_heritage_assets_n1').should('have.length', 2);
        counts(2, 1);
        ['agent_n1', 'referred_to', 'applicant_n1'].forEach((alias) => {
            rows(alias).should('have.length', 2);
        });
        rows('applicant_organisation').should('have.length', 1);
        dateInput('date_received').should('have.value', DATE_RECEIVED_AGAIN);
        dateInput('due_date').should('have.value', DUE_DATE);
        dateInput('date_acknowledged').should('have.value', DATE_ACKNOWLEDGED);
        dateInput('response_date').should('have.value', RESPONSE_DATE);
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection', { timeout: 30000 }).first().should('contain.text', TYPE);
        cy.get('.widget-wrapper.consultation_status .select2-selection', { timeout: 30000 }).first().should('contain.text', STATUS);
        cy.get('.widget-wrapper.cm_reference_number input.form-control', { timeout: 30000 }).first()
            .should('have.value', CM_REFERENCE);
        cy.get('.widget-wrapper.advice_text .cke_wysiwyg_frame', { timeout: 60000 }).should('exist');
        cy.richTextValue('advice_text').should('contain', COMMENTS);
    }

    // Letters step: the Letter Type select is fed by `letterOptions` in the plugin
    // config. Generating a letter stays commented out: the docx templates are
    // deployment assets and may be absent.
    function fillLettersTab() {
        const selector = '.select2-selection[aria-label^="Letter Type, "]';
        cy.get(selector, { timeout: 60000 }).filter(':visible').first().click();
        cy.get('.select2-results__option', { timeout: 10000 })
            .should('have.length', 1).and('contain.text', LETTER_TYPE);
        cy.contains('button', 'Generate').should('be.disabled');
        cy.get(FOOTER).should('contain.text', 'Next Step').and('not.contain.text', 'Save').and('not.contain.text', 'Undo');
        cy.get('.select2-results__option').contains(LETTER_TYPE).click();
        cy.get(selector).first().should('contain.text', LETTER_TYPE);
        cy.contains('button', 'Generate').should('not.be.disabled');
        // cy.contains('button', 'Generate').click();
    }

    function fillSignOffTab() {
        cy.get('.widget-wrapper.sign_off_date_value .widget-input-label', { timeout: 60000 }).first().should('have.text', 'Date');
        futureDaysBlocked('sign_off_date_value', '.step-counter');
        cy.replaceDate('sign_off_date_value', SIGN_OFF_DATE);

        // Within Deadline is core's switch widget, which has no .widget-wrapper.<alias> class, so it is found by its aria-label.
        // Checklist predates v8: the switch shows no "Click to switch" subtitle.
        cy.contains('.arches-toggle-sm', 'Within Deadline').should('exist');
        // The Response Date is before the Due Date.
        withinDeadline(true);

        // The admin user has no Person in a sign-off group, so Cur E is disabled.
        cy.contains('Cur E').should('exist');
        cy.contains('You do not have permission to sign off').should('exist');
        cy.get('i.fa-ban').should('exist');
    }

    const termFilter = (value) => encodeURIComponent(JSON.stringify([{ context: '', context_label: '', id: `string${value}`,
        text: value, type: 'string', value, inverted: false, selected: true }]));

    // The new resource is indexed a moment after the workflow completes, so search again until it shows.
    const searchUntilFound = (value, attemptsLeft = 6) => {
        cy.request(`/search/resources?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(value)}`).then((response) => {
            const hit = response.body.results.hits.hits.find((h) => h._source.displayname.includes(consultation.id));
            if (hit) {
                expect(hit._source.graph_id, 'graph of the hit').to.equal(CONSULTATION_GRAPH);
                consultation.resourceId = hit._id;
                return;
            }
            expect(attemptsLeft, `${consultation.id} in the results for ${value}`).to.be.greaterThan(0);
            cy.wait(5000);
            searchUntilFound(value, attemptsLeft - 1);
        });
    };

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

    it('Start new and go through the workflow to completion', function () {
        startNew();
        fillStartTab();
        cy.workflowNext();          // Start -> Consultation

        fillConsultationTab();
        cy.workflowNext();          // Consultation -> Documentation

        fillDocumentationTab();
        cy.get(FOOTER).contains('Previous Step').click();
        consultationValuesShown();

        cy.workflowNext();          // Consultation -> Documentation (again)
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.workflowNext();          // Documentation -> Letters

        fillLettersTab();
        cy.workflowNext();          // Letters -> Sign off

        fillSignOffTab();
        cy.get('.workflow-top-control').contains('Save and Complete Workflow').scrollIntoView().click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 60000 }).should('have.length.greaterThan', 0);
    });

    it('Shows the start and open controls on the launcher', function () {
        if (!consultation.id) { this.skip(); return; }
        cy.get('[href="/plugins/open-workflow?workflow-slug=daera-workflow"] > .workflow-select-card', { timeout: 60000 }).click();
        cy.contains('DAERA Workflow', { timeout: 60000 }).should('be.visible');
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
        cy.contains('button', 'Open Selected').should('be.visible').and('be.disabled');
        cy.get('.select2-selection__placeholder').should('contain.text', 'Start new or please select from below');

        selectInDropdown(consultation.id);
        cy.contains('button', 'Open Selected').should('not.be.disabled');

        cy.get('.select2-selection__clear').first().click();
        cy.contains('button', 'Open Selected').should('be.disabled');
    });

    it('Finds the completed consultation by its ID with what was entered', function () {
        if (!consultation.id) { this.skip(); return; }
        searchUntilFound(consultation.id);

        cy.visit(`/search?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(consultation.id)}`, { timeout: 180000 });

        cy.then(() => cy.request(`/resource/${consultation.resourceId}/tiles`)).then((response) => {
            const tiles = response.body.tiles;
            const tileOf = (nodegroupId) => tiles.find((tile) => tile.nodegroup === nodegroupId);
            const iso = (ddmmyyyyText) => {
                const [dd, mm, yyyy] = ddmmyyyyText.split('-').map(Number);
                return isoDate(new Date(yyyy, mm - 1, dd));
            };
            const assets = tileOf('a8a4f3cc-67b1-510e-8abb-719fe4458d8c').data;
            expect(assets['0f74af35-a8d7-5a12-953a-1773d3981fec']).to.have.length(2);
            expect(Number(assets['a7d5d94e-1094-568a-ab49-bdd9362a1485'])).to.equal(2);
            expect(Number(assets['4cbfed23-7989-500c-9a0f-c63307d15beb'])).to.equal(1);

            const dates = tileOf('c57c0e55-9d47-5161-ad50-5c27eadb5d3a').data;
            expect(dates['4bc58750-4ec7-5a0b-8222-f564b8fda277']).to.equal(iso(DATE_RECEIVED_AGAIN));
            expect(dates['4dd92777-2d90-515a-bbf5-540796a299ff']).to.equal(iso(DUE_DATE));
            expect(dates['888a2eef-fd3f-57a1-adb2-f7f1ca00ae0d']).to.equal(iso(DATE_ACKNOWLEDGED));
            expect(dates['0da2486a-aaca-5b02-beb7-f81a2ebab9aa']).to.equal(iso(RESPONSE_DATE));

            expect(JSON.stringify(tileOf('005dbe8b-5a63-54c7-981b-ca636d191505'))).to.contain(STATUS);
            expect(tileOf('9a1a435f-a540-5c98-96c7-fdb9b54d29d9').data['c8bd2093-9099-57bb-aff9-ea97e0f32a38'])
                .to.equal(iso(SIGN_OFF_DATE));
        });
    });

    it('Opens the completed consultation from the launcher with what was entered', function () {
        if (!consultation.id) { this.skip(); return; }
        openFromLauncher(consultation.id);

        cy.get('.workflow-nav-tab.active').should('contain.text', 'Start');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 0);
        cy.get('[aria-label="Consultation ID"]').should('be.disabled');
        noUndo();

        cy.get('.workflow-nav-tab-container').contains('Consultation').click();
        consultationValuesShown();
    });

    it('Gives the next consultation the next ID and lists it once the Start step is saved', function () {
        if (!consultation.id) { this.skip(); return; }
        startNew();
        cy.get('[aria-label="Consultation ID"]').invoke('val').then((id) => {
            expect(ailNumber(id)).to.equal(ailNumber(consultation.id) + 1);
            consultation.nextId = id;
        });
        cy.workflowNext();
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');

        cy.visit('/plugins/init-workflow', { timeout: 180000 });
        cy.then(() => openFromLauncher(consultation.nextId));
    });

    it('Continues past the Consultation step with Consultation Type empty', function () {
        startNew();
        cy.workflowNext();
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection__placeholder').should('contain.text', 'Select an option');
        cy.workflowNext();
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Documentation');
        // Save and Complete Workflow is offered on every step, so the user can save and exit at any point.
        cy.get('.workflow-top-control').contains('Save and Complete Workflow').should('be.visible');
    });

    it('Sets Within Deadline to No when there is no Response Date', function () {
        if (!consultation.nextId) { this.skip(); return; }
        cy.then(() => openFromLauncher(consultation.nextId));
        cy.workflowNext();
        fillMinimalConsultation();
        cy.fillDate('date_received', DATE_RECEIVED);
        dateInput('date_received').should('have.value', DATE_RECEIVED);
        toSignOff();
        withinDeadline(false);
    });

    it('Sets Within Deadline to No when the Response Date is on the Due Date', function () {
        startNew();
        cy.workflowNext();
        fillMinimalConsultation();
        cy.fillDate('date_received', ddmmyyyy(daysAgo(30)));
        dateInput('date_received').should('have.value', ddmmyyyy(daysAgo(30)));
        dateInput('due_date').should('have.value', ddmmyyyy(daysAgo(30 - DAYS_TO_ADD)));
        cy.fillDate('response_date', ddmmyyyy(daysAgo(30 - DAYS_TO_ADD)));
        dateInput('response_date').should('have.value', ddmmyyyy(daysAgo(30 - DAYS_TO_ADD)));
        toSignOff();
        withinDeadline(false);
    });
});
