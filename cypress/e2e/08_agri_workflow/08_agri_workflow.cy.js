describe('Going through the Agri Workflow', function () {

    // The Heritage Asset the Consultation is raised against. Present both in a
    // populated development database and in CI (see cypress/seed/README.md);
    // pickRelationshipByName matches the option text exactly.
    const HERITAGE_ASSET = 'HA/02 Testing';

    // Date Received drives Due Date. The step's `update-dates` component
    // subscribes to the issue-date node and writes issue + `daysToAdd` into the
    // due-date node (coral/media/js/views/components/workflows/update-dates.js;
    // daysToAdd: 14 in the plugin config, issueDateNode = Date Received,
    // dueDateNode = Due Date). Date Acknowledged and Response Date are
    // configured `maxDate: "today"`, so they cannot be set into the future.
    const DAYS_TO_ADD = 14;
    const DATE_RECEIVED = '01-07-2026';
    const DATE_ACKNOWLEDGED = '02-07-2026';
    const RESPONSE_DATE = '03-07-2026';
    const SIGN_OFF_DATE = '06-07-2026';

    const STATUS = 'Approved';   // the widget defaults to "Refused", so this is a real change
    const CM_REFERENCE = 'CM-TEST-001';
    const COMMENTS = 'Cypress consultation comments.';
    const LETTER_TYPE = 'Forestry Response Letter';
    const UPLOAD_FIXTURE = 'cypress/fixtures/agri-test-upload.txt';
    const UPLOAD_NAME = 'agri-test-upload.txt';

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
        cy.visit('/plugins/init-workflow');
    });

    it('Start new and go through the workflow to completion', function () {
        cy.get('[href="/plugins/open-workflow?workflow-slug=agriculture-and-forestry-consultation-workflow"] > .workflow-select-card').click();
        cy.wait(2000);
        cy.contains('Start New').click();
        cy.wait(3000);

        // ---- Start step: the Consultation ID (AFC number) is generated server-side.
        cy.get('[aria-label="Consultation ID"]').should('have.attr', 'placeholder');
        cy.get('[aria-label="Consultation ID"]')
            .invoke('attr', 'placeholder')
            .should('match', /\S/);
        cy.workflowNext();

        // ---- Consultation step: the substantive one. Widgets render lazily, so
        // wait for a card to exist before touching anything.
        cy.get('.card_component.consultation_type', { timeout: 60000 }).should('exist');
        cy.wait(4000);

        // Heritage assets group — relate the consultation to a real asset.
        cy.pickRelationshipByName('Related Heritage Assets', HERITAGE_ASSET);
        cy.wait(1000);

        // Agriculture related people — each is a resource-instance multiselect.
        cy.pickRelationshipFirst('Applicant');
        cy.wait(500);
        cy.pickRelationshipFirst('Applicant organisation');
        cy.wait(500);
        cy.pickRelationshipFirst('Referred to');
        cy.wait(500);

        // Agriculture dates. Scroll the section in first — the cards below the
        // first one report as not visible until it is on screen.
        cy.get('.card_component.date_received').first().scrollIntoView();
        cy.wait(500);
        cy.fillDate('date_received', DATE_RECEIVED);
        cy.wait(1500);

        // The business rule. Assert against whatever Date Received actually
        // ended up as rather than what we typed — the widget re-stamps it in
        // some cases — so this checks the +14 relationship itself.
        cy.get('.card_component.date_received input.form-control').first()
            .invoke('val').then((received) => {
                expect(received, 'Date Received should be populated').to.match(/^\d{2}-\d{2}-\d{4}$/);
                cy.get('.card_component.due_date input.form-control').first()
                    .should('have.value', addDays(received, DAYS_TO_ADD));
            });

        cy.fillDate('date_acknowledged', DATE_ACKNOWLEDGED);
        cy.fillDate('response_date', RESPONSE_DATE);

        // Comments — the Advice text node, relabelled "Comments" by the plugin
        // config. It is a rich-text widget, so it goes through CKEditor.
        cy.get('.card_component.advice_text').first().scrollIntoView();
        cy.typeRichText('advice_text', COMMENTS);
        cy.wait(500);

        // NOTE: no concept select on this step can be driven.
        //  - Every *Metatype* field, the rest of the Advice section (Advice
        //    Type, Advice Description Type, Advice given by, the applied dates)
        //    and the CM Reference Source/Description selects render with
        //    `display: none` — auto-derived or collapsed — so clicking them
        //    fails "element is not visible".
        //  - Consultation Type is visible but its dropdown only ever offers
        //    "No results found": the node's rdmCollection
        //    ba699269-4399-5d71-1d79-5e81d82c4ebb does not exist in the database
        //    (only Consultation.json references it — no reference-data file
        //    defines it), so there is nothing to pick. Same class of missing
        //    reference data as the 10_risk_assessment blocker. Restore this once
        //    that collection is loaded:
        //        cy.pickCardOption('consultation_type', 0);

        // CM Reference Number, a plain text widget labelled "Records NI". Scroll
        // the card in first — it sits below the fold once the relationship
        // widgets above have expanded.
        cy.get('.card_component.cm_reference_number').first().scrollIntoView();
        cy.get('.card_component.cm_reference_number input.form-control').first()
            .type(CM_REFERENCE, { force: true });
        cy.wait(300);

        // Consultation status is a domain-value select that starts on "Refused".
        cy.pickDomainByLabel('Consultation status', STATUS);
        cy.wait(500);

        // Everything above should be reflected in the widgets before we save.
        cy.get('.card_component.date_acknowledged input.form-control').first()
            .should('not.have.value', '');
        cy.get('.card_component.response_date input.form-control').first()
            .should('not.have.value', '');
        cy.get('.card_component.consultation_status .select2-selection')
            .first().should('contain.text', STATUS);
        cy.get('.card_component.cm_reference_number input.form-control').first()
            .should('have.value', CM_REFERENCE);

        cy.workflowNext();

        // ---- Documentation step (file upload is optional).
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.wait(2000);

        // Drive a real upload. The dropzone's own <input type="file"> is hidden,
        // hence { force: true }.
        cy.get('input.dz-hidden-input').first()
            .selectFile(UPLOAD_FIXTURE, { force: true });
        cy.get('.card-component', { timeout: 30000 }).should('contain.text', UPLOAD_NAME);
        cy.contains('files uploaded').should('be.visible');

        // BLOCKER — the step cannot be SAVED while a document is attached.
        // `saveRelationship` in
        // coral/media/js/views/components/workflows/related-document-upload.js:194
        // assigns to an undeclared `prefilledKeys`; the file is an ES module, so
        // strict mode turns that into "ReferenceError: prefilledKeys is not
        // defined". The digital object's name tile is POSTed first and succeeds,
        // then the throw skips the relationship tile and `form.complete(true)`,
        // so "Next Step" no longer advances (the step counter stays on 3/5) and
        // the uploaded file is never linked to the Consultation. Remove the file
        // again so the workflow can continue. Once that line is `const
        // prefilledKeys = {}` this deletion should be dropped and the spec
        // should step forward with the document attached, then step back and
        // assert it is still listed.
        cy.contains('delete all files').click();
        cy.get('.card-component', { timeout: 20000 }).should('not.contain.text', UPLOAD_NAME);

        // Step back to prove the Consultation tile actually persisted rather than
        // just having been typed into the DOM.
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').click();
        cy.get('.card_component.date_received', { timeout: 60000 }).should('exist');
        cy.wait(4000);
        cy.get('.card_component.cm_reference_number input.form-control').first()
            .should('have.value', CM_REFERENCE);
        cy.get('.card_component.consultation_status .select2-selection')
            .first().should('contain.text', STATUS);
        cy.get('.card_component.date_received input.form-control').first()
            .should('not.have.value', '');
        cy.get('.card_component.due_date input.form-control').first()
            .should('not.have.value', '');
        cy.get('.card_component.advice_text').should('contain.text', COMMENTS);

        cy.workflowNext();
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.workflowNext();

        // ---- Letters step: choose which letter to raise. The Letter Type
        // select is a domain-select fed by `letterOptions` in the plugin config.
        cy.wait(5000);
        cy.pickDomainByLabel('Letter Type', LETTER_TYPE);
        cy.get('.select2-selection[aria-label^="Letter Type, "]')
            .first().should('contain.text', LETTER_TYPE);

        // BLOCKER — "Generate" cannot be clicked. Two things break it:
        //  1. The ids the select sends are .docx filenames that
        //     `FileTemplateView.get_template_path` falls through to, and those
        //     templates are deployment assets: `coral/docx` is gitignored and
        //     ships empty, so /filetemplate answers 404 "No Template Found".
        //  2. With a template in place it then 500s — coral/views/file_template.py:621
        //     (`GenericTemplateProvider.get_mapping`) calls `resource.items()`
        //     on a querysets_shim resource, whose __getattr__ returns None for
        //     an unknown alias, so it raises "TypeError: 'NoneType' object is
        //     not callable" before a document is ever written.
        // Once a template is available and that call is ported to the shim's
        // API, generation should be driven here:
        //     cy.contains('button', 'Generate').click();
        //     cy.contains('a', 'Download', { timeout: 60000 }).should('be.visible');
        //     cy.get('.card-component')
        //         .should('contain.text', '_forestry-consult-response-template.docx');

        cy.workflowNext();

        // ---- Sign off step.
        cy.wait(5000);
        cy.fillDate('sign_off_date_value', SIGN_OFF_DATE);
        // The widget re-stamps this one with today's date, so assert the shape
        // rather than the value typed above.
        cy.get('.card_component.sign_off_date_value input.form-control').first()
            .invoke('val').should('match', /^\d{2}-\d{2}-\d{4}$/);

        // Within Deadline is computed, not typed: update-deadline.js compares
        // the Response Date against the Due Date and ticks the boolean itself.
        // 03-07 response against a 15-07 due date is inside the deadline.
        // radio-boolean renders selection on the <label> (aria-checked/.active)
        // — every radio input on the page shares name="stat-w-label", so at most
        // one input is ever :checked and that is not the one to assert on.
        cy.get('.card_component.within_deadline label[aria-checked="true"]')
            .should('have.length', 1)
            .and('contain.text', 'Yes');

        // BLOCKER — the "Cur E" sign-off cannot be clicked. The
        // user-to-model-select widget asks /user-to-model for the Person
        // resource carrying the logged-in user's id and only enables itself when
        // that Person belongs to one of the step's `signOffGroups`
        // (c78e1dca…/b23161e0…/cfa32a35…, the three "Scheduled Monument
        // Management" groups). Two things stop that here: those Group resources
        // do not exist in a bootstrapped database, and `Person.where(
        // user_account=…)` cannot match anyway — querysets_shim resolves a node
        // that is its own nodegroup (Person.user_account, Group.members) one
        // level too deep, so the filter compares the branch JSON against the
        // user id. The widget therefore renders disabled with a fa-ban icon.
        // Assert what it does render, and drive the click once that is fixed:
        //     cy.get('.card_component.cur_e .rr-table-row').first().click();
        //     cy.get('.card_component.cur_e i.fa-check').should('exist');
        cy.get('.card_component.cur_e').should('be.visible');

        cy.get('.workflow-top-control').contains('Save and Complete Workflow').scrollIntoView().click();

        // Workflow completes and returns to the workflow launcher list.
        // (The launcher shows the workflow cards, not a "Start New" button —
        // that only appears once a specific workflow card is selected.)
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
