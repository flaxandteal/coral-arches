describe('Going through the DAERA Workflow', function () {

    // Real Heritage Assets in a populated development database. The first two
    // are recommended as Scheduled Monument; the third is not.
    const HA_SCHEDULED_1 = 'ANT 001:009';
    const HA_SCHEDULED_2 = 'ANT 035:002';
    const HA_NOT_SCHEDULED = 'ANT 014:009';
    const PANEL_TIMEOUT = 30000;

    // Date Received drives Due Date: the `update-dates` component writes
    // received + `daysToAdd` (21) into Due Date. Date Acknowledged and Response
    // Date are `maxDate: "today"`. Within Deadline compares Response Date with
    // the saved Due Date, so Due Date is edited by hand to land after it.
    const DAYS_TO_ADD = 21;
    // Typed dates are reset to today by these widgets, so days of the current month
    // are picked from the calendar (days 1-4 keep this valid from the 4th onwards).
    const now = new Date();
    const dateOf = (day) => [
        String(day).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear(),
    ].join('-');
    const DATE_RECEIVED = dateOf(1);
    const DATE_RECEIVED_AGAIN = dateOf(2);
    const DATE_ACKNOWLEDGED = dateOf(2);
    const DUE_DATE = dateOf(4);
    const RESPONSE_DATE = dateOf(3);
    const SIGN_OFF_DATE = '06-07-2026';

    const STATUS = 'Approved';
    const TYPE = 'Abstraction';
    const CM_REFERENCE = 'CM-TEST-001';
    const COMMENTS = 'Cypress consultation comments.';
    const LETTER_TYPE = 'DAERA AIL Consultation';

    // dd-mm-yyyy (what the widgets render) -> dd-mm-yyyy n days later.
    const addDays = (ddmmyyyy, days) => {
        const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
        const d = new Date(yyyy, mm - 1, dd);
        d.setDate(d.getDate() + days);
        return [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            d.getFullYear(),
        ].join('-');
    };

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    function openWorkflowAndStartNew() {
        cy.get('[href="/plugins/open-workflow?workflow-slug=daera-workflow"] > .workflow-select-card', { timeout: 60000 }).click();
        cy.wait(2000);
        cy.contains('DAERA Workflow').should('be.visible');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.contains('Start New').click();
        cy.wait(3000);
    }

    // The Consultation ID (AIL number) is generated server-side.
    function fillStartTab() {
        cy.get('[aria-label="Consultation ID"]', { timeout: 60000 }).should('be.disabled');
        cy.get('[aria-label="Consultation ID"]', { timeout: 30000 })
            .should(($input) => expect($input.val()).to.match(/^AIL/));
        cy.contains('button', 'Undo').should('not.exist');
    }

    const haWidget = '.widget-wrapper.related_heritage_assets_n1';
    const counts = (monuments, scheduled) => {
        cy.get('input[aria-label="Monuments"]', { timeout: 15000 }).should('have.value', String(monuments));
        cy.get('input[aria-label="Scheduled monuments"]', { timeout: 15000 }).should('have.value', String(scheduled));
    };
    const removeHeritageAsset = (name) => {
        cy.contains(`${haWidget} .rr-table-row`, name)
            .find('button:has(.fa-trash)').click();
        cy.wait(1000);
    };
    const dateInput = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).first();

    function fillHeritageAssets() {
        cy.get(`${haWidget}`, { timeout: 60000 }).should('exist');
        cy.get('input[aria-label="Monuments"]').should('be.disabled');
        cy.get('input[aria-label="Scheduled monuments"]').should('be.disabled');

        cy.pickRelationshipSearch('Related Heritage Assets', 'Kilvoruan', HA_SCHEDULED_1);
        cy.contains('SMR Number', { timeout: PANEL_TIMEOUT }).should('exist');
        cy.contains(HA_SCHEDULED_1, { timeout: PANEL_TIMEOUT }).should('exist');
        cy.contains('Ecclesiastical Site', { timeout: PANEL_TIMEOUT }).should('exist');
        cy.contains('Knockans', { timeout: PANEL_TIMEOUT }).should('exist');
        counts(1, 1);

        // Picking the same asset again adds nothing.
        cy.pickRelationshipSearch('Related Heritage Assets', 'Kilvoruan', HA_SCHEDULED_1);
        cy.wait(1000);
        cy.get(`${haWidget} .rr-table-row`).should('have.length', 1);
        counts(1, 1);

        cy.pickRelationshipSearch('Related Heritage Assets', '035:002', HA_SCHEDULED_2);
        cy.contains('Chambered Tomb', { timeout: PANEL_TIMEOUT }).should('exist');
        cy.contains('Dunteige', { timeout: PANEL_TIMEOUT }).should('exist');
        counts(2, 2);

        cy.pickRelationshipSearch('Related Heritage Assets', 'Tirkilly', HA_NOT_SCHEDULED);
        cy.contains('Tirkilly', { timeout: PANEL_TIMEOUT }).should('exist');
        counts(3, 2);
        cy.get(`${haWidget} .rr-table-row`).should('have.length', 3);

        removeHeritageAsset(HA_NOT_SCHEDULED);
        counts(2, 2);
        removeHeritageAsset(HA_SCHEDULED_1);
        counts(1, 1);
        cy.contains(HA_SCHEDULED_1).should('not.exist');
        cy.get(`${haWidget} .rr-table-row`).should('have.length', 1);
    }

    // Each people field takes several resources, shown as rows below the field.
    function fillPeople() {
        ['agent_n1', 'referred_to', 'applicant_n1', 'applicant_organisation'].forEach((alias) => {
            const label = { agent_n1: 'Agent', referred_to: 'Referred to', applicant_n1: 'Applicant', applicant_organisation: 'Applicant organisation' }[alias];
            cy.pickRelationshipFirst(label);
            cy.wait(500);
            cy.pickRelationshipSecond(label);
            cy.get(`.widget-wrapper.${alias} .rr-table-row`).should('have.length', 2);
        });
    }

    function fillDates() {
        cy.pickCalendarDay('date_received', 1);
        dateInput('date_received').should('have.value', DATE_RECEIVED);
        dateInput('due_date').should('have.value', addDays(DATE_RECEIVED, DAYS_TO_ADD));

        cy.pickCalendarDay('date_received', 2);
        dateInput('due_date').should('have.value', addDays(DATE_RECEIVED_AGAIN, DAYS_TO_ADD));

        // Due Date stays editable by hand.
        cy.pickCalendarDay('due_date', 4);
        dateInput('due_date').should('have.value', DUE_DATE);
        cy.pickCalendarDay('date_acknowledged', 2);
        cy.pickCalendarDay('response_date', 3);
    }

    function fillConsultationTab() {
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        cy.wait(4000);

        fillHeritageAssets();
        fillPeople();
        fillDates();

        cy.pickCardOption('consultation_type_n1', TYPE);
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection').first().should('contain.text', TYPE);

        cy.get('.widget-wrapper.advice_text .widget-input-label').first().should('have.text', 'Comments');
        cy.typeRichText('advice_text', COMMENTS);

        cy.get('.widget-wrapper.cm_reference_number .widget-input-label').first().should('have.text', 'Records NI');
        cy.scrollToWidget('cm_reference_number');
        cy.get('.widget-wrapper.cm_reference_number input.form-control').first()
            .type(CM_REFERENCE, { force: true });

        cy.pickCardOption('consultation_status', STATUS);
        cy.get('.widget-wrapper.consultation_status .select2-selection').first().should('contain.text', STATUS);

        cy.contains('button', 'Undo').should('not.exist');
    }

    // File upload is left out (per-environment storage bucket):
    // cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });
    function fillDocumentationTab() {
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.contains('button', 'Undo').should('not.exist');
    }

    // Step back to prove the Consultation tile actually persisted rather than
    // just having been typed into the DOM.
    function verifyConsultationTabPersisted() {
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').click();
        cy.get('.widget-wrapper.date_received', { timeout: 60000 }).should('exist');
        cy.wait(4000);
        cy.get(`${haWidget} .rr-table-row`).should('have.length', 1);
        counts(1, 1);
        ['agent_n1', 'referred_to', 'applicant_n1', 'applicant_organisation'].forEach((alias) => {
            cy.get(`.widget-wrapper.${alias} .rr-table-row`).should('have.length', 2);
        });
        dateInput('date_received').should('have.value', DATE_RECEIVED_AGAIN);
        dateInput('due_date').should('have.value', DUE_DATE);
        dateInput('date_acknowledged').should('have.value', DATE_ACKNOWLEDGED);
        dateInput('response_date').should('have.value', RESPONSE_DATE);
        cy.get('.widget-wrapper.consultation_type_n1 .select2-selection').first().should('contain.text', TYPE);
        cy.get('.widget-wrapper.consultation_status .select2-selection').first().should('contain.text', STATUS);
        cy.get('.widget-wrapper.cm_reference_number input.form-control').first()
            .should('have.value', CM_REFERENCE);
        cy.richTextValue('advice_text').should('contain', COMMENTS);
    }

    // Letters step: the Letter Type select is fed by `letterOptions` in the plugin
    // config. Generating a letter stays commented out: the docx templates are
    // deployment assets and may be absent.
    function fillLettersTab() {
        cy.wait(5000);
        const selector = '.select2-selection[aria-label^="Letter Type, "]';
        cy.get(selector).filter(':visible').first().click();
        cy.get('.select2-results__option', { timeout: 10000 })
            .should('contain.text', LETTER_TYPE);
        cy.get('.select2-results__option').contains(LETTER_TYPE).click();
        cy.get(selector).first().should('contain.text', LETTER_TYPE);
        // cy.contains('button', 'Generate').click();
    }

    function fillSignOffTab() {
        cy.wait(5000);
        cy.get('.widget-wrapper.sign_off_date_value .widget-input-label').first().should('have.text', 'Date');
        cy.fillDate('sign_off_date_value', SIGN_OFF_DATE);
        // The widget re-stamps this one with today's date, so assert the shape.
        cy.get('.widget-wrapper.sign_off_date_value input.form-control').first()
            .invoke('val').should('match', /^\d{2}-\d{2}-\d{4}$/);

        // update-deadline compares the saved Response Date with the Due Date:
        // a Response Date on the 3rd against a Due Date on the 4th is inside the deadline. Within Deadline is core's switch widget, which has no
        // .widget-wrapper.<alias> class, so it is found by its aria-label.
        cy.contains('.arches-toggle-sm', 'Within Deadline').should('exist');
        cy.get('span.switch[aria-label^="Within Deadline"]').should('have.attr', 'aria-checked', 'true');

        // The admin user has no Person in a sign-off group, so Cur E is disabled.
        cy.contains('Cur E').should('exist');
        cy.contains('You do not have permission to sign off').should('exist');
        cy.get('i.fa-ban').should('exist');
    }

    function completeWorkflow() {
        cy.get('.workflow-top-control').contains('Save and Complete Workflow').scrollIntoView().click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    }

    it('Start new and go through the workflow to completion', function () {
        openWorkflowAndStartNew();

        fillStartTab();
        cy.workflowNext();          // Start -> Consultation

        fillConsultationTab();
        cy.workflowNext();          // Consultation -> Documentation

        fillDocumentationTab();
        verifyConsultationTabPersisted();

        cy.workflowNext();          // Consultation -> Documentation (again)
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.workflowNext();          // Documentation -> Letters

        fillLettersTab();
        cy.workflowNext();          // Letters -> Sign off

        fillSignOffTab();
        completeWorkflow();
    });
});
