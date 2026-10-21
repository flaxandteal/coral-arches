describe('Going through the Scheduled Monument Consent Workflow', function () {

    beforeEach(() => {
        cy.login();
        // A cold load fetches ~250 webpack chunks and can exceed the 90s default.
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // Letters and file uploads are not driven: the storage buckets differ per environment.

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const STEP_BODY = '.tabbed-workflow-step-body';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const ROW = '.rr-table-row';

    // Which footer buttons are showing. Undo is hidden in every step of this workflow.
    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
        has('Undo', false);
    };

    // The Decision step is the last one: Previous Step, plus Save once something changed.
    const decisionFooter = (save) => {
        cy.get(FOOTER, { timeout: 30000 }).should('contain.text', 'Previous Step').and('not.contain.text', 'Next Step');
        cy.get(FOOTER).should(save ? 'contain.text' : 'not.contain.text', 'Save');
    };

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`).should('contain.text', text);

    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));

    // A picked resource's row appears once its details have been fetched.
    const rows = (alias) => cy.get(`.widget-wrapper.${alias} ${ROW}`, { timeout: 15000 });

    const selectedText = (alias) => cy.get(`.widget-wrapper.${alias} .select2-selection__rendered`).first().invoke('text');

    // A second pick in a single-select replaces the first.
    const replaceSingle = (alias) => {
        cy.pickCardOption(alias);
        selectedText(alias).then((first) => {
            cy.pickCardOption(alias, 1);
            selectedText(alias).should('not.eq', first);
        });
    };

    const clearSelect = (alias) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection__clear`).click();
        cy.get(`.widget-wrapper.${alias} .select2-selection__placeholder`).should('exist');
    };

    // Clearing a select2 can leave its list open, and a click would then close it.
    const pickAfterClear = (alias) => {
        cy.wait(500);
        cy.get('body').then(($body) => {
            if ($body.find('.select2-dropdown:visible').length) {
                cy.get(REAL_OPTIONS, { timeout: 15000 }).first().click();
            } else {
                cy.pickCardOption(alias);
            }
        });
        cy.get(`.widget-wrapper.${alias} .select2-selection__placeholder`).should('not.exist');
    };

    // The list is read, then closed by choosing its first option: Escape leaves the select2 focused, and a click on a focused one does not reopen it.
    const optionsOf = (alias, expected) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length', expected.length).then(($options) => {
            expect([...$options].map((option) => option.textContent.trim())).to.have.members(expected);
        });
        cy.get(REAL_OPTIONS).first().click();
    };

    const closeDropdown = () => {
        cy.get('body').type('{esc}');
        cy.get('.select2-dropdown').should('not.exist');
        cy.document().then((doc) => doc.activeElement?.blur());
    };

    // A search with no hits still offers to create a new resource of each kind the picker allows.
    const offers = (alias, kinds) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        cy.select2Search('XXXXXX');
        kinds.forEach((kind) => cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(`Create a new ${kind}`));
        closeDropdown();
    };

    // Seeded people. Pickers are searched by name: a sparse database lists "Create a new ..." first, and the list re-renders under a click.
    const FIRST_PERSON = 'Name07';
    const SECOND_PERSON = 'Name29';

    // A picked person gets delete and info buttons; info opens a summary that Return leaves.
    const personRowActions = (alias) => {
        rows(alias).should('have.length', 1);
        rows(alias).find('.rr-table-instance-label').invoke('text').should('match', /\S/);
        rows(alias).find('button').should('have.length', 2);
        rows(alias).find('button:has(.fa-info-circle)').click();
        cy.contains('button', 'Return', { timeout: 15000 }).click();
        cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('exist');
        rows(alias).should('have.length', 1);
    };

    const removeLastRow = (alias) => {
        rows(alias).last().find('button:has(.fa-trash)').click();
    };

    // Resource pickers list people; picking again adds another and a row can be removed.
    const checkPersonPicker = (alias, text, { footerAfterRemove = false } = {}) => {
        label(alias, text);
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length.greaterThan', 0);
        closeDropdown();
        cy.pickCardOption(alias, FIRST_PERSON);
        personRowActions(alias);
        footer({ save: true });
        cy.pickCardOption(alias, SECOND_PERSON);
        rows(alias).should('have.length', 2);
        removeLastRow(alias);
        rows(alias).should('have.length', 1);
        removeLastRow(alias);
        rows(alias).should('not.exist');
        if (footerAfterRemove) footer({ next: true });
    };

    const today = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    };

    const dateInput = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).first();
    const calendar = '.bootstrap-datetimepicker-widget';

    // Empty by default; opening the calendar fills today and leaving it closes the calendar.
    const todayOnOpen = (alias, elsewhere) => {
        cy.scrollToWidget(alias);
        dateInput(alias).should('have.value', '');
        dateInput(alias).click({ force: true });
        cy.get(`${calendar}:visible`).should('exist');
        dateInput(alias).should('have.value', today());
        cy.get(`.widget-wrapper.${elsewhere}`).click({ force: true, position: 'topLeft' });
        notShown(calendar);
        dateInput(alias).should('have.value', today());
    };

    // The launcher only lists heritage assets that carry an SMR number.
    const pickHeritageAsset = () => {
        cy.get('.select2-selection', { timeout: 60000 }).first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get(REAL_OPTIONS, { timeout: 30000 }).first().click();
    };

    const smcReference = {};

    it('Only enables Start New once a heritage asset is chosen', function () {
        cy.contains('SMC').click();
        cy.contains('button', 'Start New', { timeout: 30000 }).should('be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.contains('Selected SMC').should('be.visible');
        cy.contains('Select a SMC or start new').should('be.visible');

        pickHeritageAsset();
        cy.contains('button', 'Start New').should('not.be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('SMC').click();
        pickHeritageAsset();
        cy.contains('button', 'Start New').should('not.be.disabled').click();

        // Start Meeting: the reference is generated into a locked input.
        cy.get('[aria-label="SMC Reference Number"]', { timeout: 60000 })
            .should(($id) => expect($id.val()).to.match(/^SMC\/\d{4}\/\w+$/))
            .and('be.disabled')
            .invoke('val').then((reference) => { smcReference.value = reference; });
        cy.get('.widget-wrapper.resourceid').should('contain.text', 'SMC Reference Number');
        footer({ previous: false, save: true });
        cy.workflowNext();
        cy.location('search').then((search) => { smcReference.id = new URLSearchParams(search).get('resource-id'); });

        // Details: the heritage asset is shown read-only.
        cy.get('.widget-wrapper.distinction .select2-selection', { timeout: 60000 }).should('exist');
        ['Heritage Asset Name', 'SMR Number', 'Heritage Asset Type', 'Townland'].forEach((text) =>
            cy.get(STEP_BODY).should('contain.text', text));
        notShown('[aria-label="Site Name"]');
        footer({ next: true });

        label('cm_reference_number', 'CM Reference');
        cy.get('.widget-wrapper.cm_reference_number input.form-control').first().should('have.value', '');
        cy.scrollToWidget('cm_reference_number');
        cy.typeInCard('cm_reference_number', 'X');
        footer({ save: true });
        cy.get('.widget-wrapper.cm_reference_number input.form-control').first().clear({ force: true });
        footer({ next: true });

        label('reason_description', 'Proposal Summary');
        cy.richTextValue('reason_description').should('match', /^\s*$/);
        cy.typeRichText('reason_description', 'abc');
        footer({ save: true });
        cy.typeRichText('reason_description', '');
        footer({ next: true });

        label('applicant_n1', 'Entered By');
        cy.scrollToWidget('applicant_n1');
        cy.get('.widget-wrapper.applicant_n1 .select2-selection').first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length.greaterThan', 0);
        closeDropdown();
        cy.pickCardOption('applicant_n1', FIRST_PERSON);
        personRowActions('applicant_n1');
        footer({ save: true });
        removeLastRow('applicant_n1');
        rows('applicant_n1').should('not.exist');
        footer({ next: true });

        label('dfi_received_date_value', 'Received Date');
        todayOnOpen('dfi_received_date_value', 'distinction');
        footer({ save: true });
        dateInput('dfi_received_date_value').type('{selectall}{backspace}', { force: true });
        dateInput('dfi_received_date_value').should('have.value', '').blur({ force: true });
        footer({ next: true });

        // A received date in the future is refused.
        dateInput('dfi_received_date_value').type('28-07-2036{enter}', { force: true });
        dateInput('dfi_received_date_value')
            .should('not.have.value', '28-07-2036')
            .clear({ force: true });
        cy.fillDate('dfi_received_date_value');

        label('distinction', 'Distinction');
        cy.pickCardOption('distinction');
        cy.get('.widget-wrapper.distinction .select2-selection__placeholder').should('not.exist');

        label('consultation_name', 'Application Reference');
        cy.scrollToWidget('consultation_name');
        cy.typeInCard('consultation_name', 'SMC-APP-01');
        cy.scrollToWidget('cm_reference_number');
        cy.typeInCard('cm_reference_number', 'CM-TEST-01');
        cy.typeRichText('reason_description', 'Proposed works summary');

        cy.pickCardOption('applicant_n1', FIRST_PERSON);
        rows('applicant_n1').should('have.length', 1);
        // Entered By and Referred to take several people.
        cy.pickCardOption('applicant_n1', SECOND_PERSON);
        rows('applicant_n1').should('have.length', 2);
        label('referred_to', 'Referred to');
        checkPersonPicker('referred_to', 'Referred to');
        cy.pickCardOption('referred_to', FIRST_PERSON);
        rows('referred_to').should('have.length', 1);
        footer({ save: true });
        cy.workflowNext();

        // Relevant Parties: Agent(s), Owner(s), Applicant(s) and Occupier(s) all take several.
        cy.get('.widget-wrapper.agent .select2-selection', { timeout: 60000 }).should('exist');
        footer({ next: true });
        offers('agent', ['Person']);
        offers('owner', ['Person', 'Organization']);
        offers('applicant', ['Person']);
        checkPersonPicker('agent', 'Agent(s)', { footerAfterRemove: true });
        checkPersonPicker('owner', 'Owner(s)', { footerAfterRemove: true });
        checkPersonPicker('applicant', 'Applicant(s)', { footerAfterRemove: true });
        checkPersonPicker('occupier', 'Occupier(s)', { footerAfterRemove: true });
        cy.pickCardOption('agent', FIRST_PERSON);
        rows('agent').should('have.length', 1);
        footer({ save: true });
        cy.workflowNext();

        // Documentation is optional; nothing is uploaded here.
        cy.get(STEP_BODY, { timeout: 60000 }).should('contain.text', 'Select Files');
        footer({ next: true });
        ['Upload Documents', 'Drag & Drop your files onto this panel', 'Adding documents to this record is optional', '200MB', 'Allowed document formats']
            .forEach((text) => cy.get(STEP_BODY).should('contain.text', text));
        cy.contains('button', 'Select Files').should('be.enabled');
        cy.workflowNext();

        // Letter: generating one needs storage, so only the form is checked.
        cy.get(STEP_BODY, { timeout: 60000 }).should('contain.text', 'Letter Type');
        footer({ next: true });
        cy.get(`${STEP_BODY} .select2-selection__placeholder`).should('contain.text', 'Select an Option');
        cy.get(STEP_BODY).should('contain.text', 'PREVIEW IS NOT GUARANTEED TO MATCH');
        cy.contains(`${STEP_BODY} button`, 'Generate').should('exist');
        cy.contains(`${STEP_BODY} button`, 'Generate').should('be.disabled');
        cy.get(`${STEP_BODY} .select2-selection`).first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).then(($options) => {
            expect([...$options].map((option) => option.textContent.trim())).to.have.members([
                'SMC Addendum Letter', 'SMC Provisional Letter', 'SMC Refusal Letter', 'SMC Final Letter',
                'SMC Final No Conditions Letter', 'SMC Provisional No Conditions Letter',
                'SMC-CL Provisional Letter', 'SMC-CL Final Letter',
            ]);
        });
        closeDropdown();
        cy.get('.workflow-nav-tab-container').contains('Decision').click();

        // Decision
        cy.get('.widget-wrapper.consent .select2-selection', { timeout: 60000 }).should('exist');
        decisionFooter(false);

        label('consent', 'Consent');
        optionsOf('consent', ['Accepted', 'Returned']);
        replaceSingle('consent');
        cy.get('.widget-wrapper.consent .select2-selection__clear').should('exist');
        decisionFooter(true);
        clearSelect('consent');
        decisionFooter(false);
        pickAfterClear('consent');

        label('status_n1', 'Status');
        optionsOf('status_n1', [
            'On-going', 'Additional Information Requested', 'Draft sent for approval', 'Provisional issued',
            'Final issued', 'Refused', 'Cancelled / Withdrawn',
        ]);
        replaceSingle('status_n1');
        cy.get('.widget-wrapper.status_n1 .select2-selection__clear').should('exist');
        clearSelect('status_n1');
        pickAfterClear('status_n1');

        label('works_to_be_carried_out', 'Works to be carried out');
        cy.richTextValue('works_to_be_carried_out').should('match', /^\s*$/);
        cy.typeRichText('works_to_be_carried_out', 'Test works description');
        decisionFooter(true);

        label('provisional_issued_date', 'Provisional Issued Date');
        todayOnOpen('provisional_issued_date', 'works_to_be_carried_out');
        decisionFooter(true);
        cy.get('.widget-wrapper.provisional_issued_date').contains('button', 'Clear').click();
        dateInput('provisional_issued_date').should('have.value', '');

        // The Issued Date cannot be in the future.
        label('actual_issued_date', 'Issued Date');
        cy.scrollToWidget('actual_issued_date');
        dateInput('actual_issued_date').should('have.value', '');
        dateInput('actual_issued_date').click({ force: true });
        cy.get(`${calendar}:visible`).should('exist');
        cy.get(`${calendar} td.day.disabled:visible`).should('exist');
        cy.get(`${calendar} td.day.active:visible`).should('have.text', String(new Date().getDate()));
        cy.get('.widget-wrapper.works_to_be_carried_out').click({ force: true, position: 'topLeft' });
        notShown(calendar);
        dateInput('actual_issued_date').should('have.value', today());
        cy.get('.widget-wrapper.actual_issued_date').contains('button', 'Clear').click();
        dateInput('actual_issued_date').should('have.value', '');
        cy.fillDate('provisional_issued_date');
        cy.fillDate('actual_issued_date');

        // Sign-off is for the logged-in user's Person, and admin has none.
        cy.get(STEP_BODY).should('contain.text', 'Issued By');
        cy.contains('You do not have permission to sign off').should('exist');

        // Save and Complete Workflow keeps the Decision entries without a separate Save.
        decisionFooter(true);
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 })
            .should('not.include', '/scheduled-monument-consent-workflow');
    });

    it('Finds the completed consent by its reference and shows what was entered', function () {
        const reference = smcReference.value;
        if (!reference) { this.skip(); return; }
        const term = [{ context: '', context_label: '', id: `string${reference}`, text: reference,
            type: 'string', value: reference, inverted: false, selected: true }];
        const searchUrl = `/search?paging-filter=1&tiles=true&language=*&term-filter=${encodeURIComponent(JSON.stringify(term))}`;
        // The new resource may not be indexed yet, so search again until it shows.
        const searchUntilFound = (attemptsLeft) => {
            cy.intercept('GET', /search\/resources/).as('results');
            cy.visit(searchUrl, { timeout: 180000 });
            cy.wait('@results', { timeout: 60000 });
            cy.wait(2000);
            cy.get('body').then(($body) => {
                if ($body.text().includes(reference)) return;
                expect(attemptsLeft, `${reference} in search results`).to.be.greaterThan(0);
                cy.wait(5000);
                searchUntilFound(attemptsLeft - 1);
            });
        };
        searchUntilFound(6);

        cy.visit(`/report/${smcReference.id}`, { timeout: 180000 });
        ['CM-TEST-01', 'SMC-APP-01', 'Proposed works summary', 'Test works description', reference].forEach((text) =>
            cy.contains(text, { timeout: 60000 }));

        cy.visit(`/resource/${smcReference.id}`, { timeout: 180000 });
        cy.location('pathname').should('include', '/resource/');
        cy.contains(reference, { timeout: 60000 });
    });

    it('Opens an existing consent from the launcher', function () {
        cy.contains('SMC').click();
        cy.contains('button', 'Open Selected', { timeout: 30000 }).should('be.disabled');
        cy.intercept('GET', /search\/resources.*b37552be/).as('smcSearch');
        pickHeritageAsset();
        cy.wait('@smcSearch', { timeout: 30000 });
        cy.contains('button', 'Open Selected').should('be.disabled');

        cy.get('.select2-selection').eq(1).click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).first().click();
        cy.contains('button', 'Open Selected').should('not.be.disabled').click();

        cy.get('.workflow-nav-tab.active', { timeout: 90000 }).should('contain.text', 'Start Meeting');
        footer({ previous: false, next: true });
    });
});
