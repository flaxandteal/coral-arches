describe('Going through the Archive Cataloguing Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const MANY_BUTTONS = '.btn-workflow-tile';
    const TILE_CARDS = '.wf-multi-tile-step-card';

    // Set by the first test and used by the ones after it.
    const archive = {};

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const todayString = () => `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
    };

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('contain.text', text);
    const input = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).filter(':visible').first();
    const manyButton = (text) => cy.contains(MANY_BUTTONS, text);
    const entries = () => cy.get(TILE_CARDS);

    const optionTexts = (alias) => {
        cy.get(`.widget-wrapper.${alias}`).scrollIntoView();
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        return cy.get(REAL_OPTIONS, { timeout: 15000 }).should('have.length.greaterThan', 0)
            .then(($options) => $options.toArray().map((o) => o.textContent.trim()));
    };

    const openLauncher = () => {
        cy.contains('Workflows', { timeout: 60000 });
        cy.contains('Archive Catalogu', { timeout: 30000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
    };

    const termFilter = (value) => encodeURIComponent(JSON.stringify([{ context: '', context_label: '', id: `string${value}`,
        text: value, type: 'string', value, inverted: false, selected: true }]));

    // The new resource is indexed a moment after its tiles save, so search again until it shows.
    const findResourceId = (value, attemptsLeft = 6) => {
        cy.request(`/search/resources?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(value)}`).then((response) => {
            const hit = response.body.results.hits.hits.find((h) => h._source.displayname === value);
            if (hit) {
                archive.resourceId = hit._id;
                return;
            }
            expect(attemptsLeft, `${value} in the search results`).to.be.greaterThan(0);
            cy.wait(5000);
            findResourceId(value, attemptsLeft - 1);
        });
    };

    it('Start new and go through the workflow and populate all fields', function () {
        // Open Workflow: no recently opened list, Open Selected waits for a pick, Start New goes straight in.
        openLauncher();
        cy.contains('Recently opened').should('not.exist');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.contains('button', 'Start New').click();

        // Archive Reference: the ID generates into a locked box, and the other tabs stay locked until it is saved.
        label('resourceid', 'Resource ID');
        cy.get('[aria-label="Resource ID"]', { timeout: 60000 }).should('be.disabled').and('not.have.value', '')
            .invoke('val').then((id) => {
                archive.id = id;
                archive.title = `Archive ${id.slice(-6)}`;
            });
        cy.get('.workflow-nav-tab.disabled').should('have.length', 4);
        footer({ previous: false, save: true });
        cy.workflowNext();
        cy.get('.workflow-nav-tab.disabled').should('have.length', 0);

        // Archive Source Details
        label('archive_source_name', 'File Title');
        cy.then(() => input('archive_source_name').type(archive.title).should('have.value', archive.title));
        label('subtitle', 'Subtitle');
        input('subtitle').type('Test Subtitle').should('have.value', 'Test Subtitle');
        label('file_id_number', 'File ID (key)');
        input('file_id_number').type('TestId').should('have.value', 'TestId');

        label('archive_source_type', 'Archive Source Type');
        cy.pickCardOption('archive_source_type', 'Genre');
        cy.get('.widget-wrapper.archive_source_type .select2-selection').should('contain.text', 'Genre');

        label('status', 'File Status');
        optionTexts('status').then((texts) =>
            expect(texts).to.deep.equal(['Closed', 'Destroyed', 'For Review', 'Open']));
        cy.get(REAL_OPTIONS).contains('Destroyed').click();
        cy.get('.widget-wrapper.status .select2-selection').should('contain.text', 'Destroyed');

        label('description', 'Description');
        cy.get('.widget-wrapper.description .cke_wysiwyg_frame', { timeout: 60000 }).should('exist');
        cy.typeRichText('description', 'test description');
        footer({ save: true });
        cy.workflowNext();

        // Archive Source Creation
        label('author_name', 'Author Name');
        input('author_name').type('Test Author Name').should('have.value', 'Test Author Name');
        label('editor_name', 'Editor Name(s)');
        input('editor_name').type('Test Editor Name').should('have.value', 'Test Editor Name');
        label('start_date', 'Start Date');
        cy.pickCalendarDay('start_date', 1);
        input('start_date').should('have.value', firstOfMonth());
        label('end_date', 'End Date');
        cy.fillDate('end_date', todayString());
        input('end_date').should('have.value', todayString());
        label('statement_of_responsibility', 'Statement of Responsibility');
        cy.get('.widget-wrapper.statement_of_responsibility .cke_wysiwyg_frame', { timeout: 60000 }).should('exist');
        cy.typeRichText('statement_of_responsibility', 'test statement of responsibility');
        footer({ save: true });
        cy.workflowNext();

        // Repository Storage Location
        label('repository_owner', 'Responsible Team');
        cy.pickRelationshipSearch('Responsible Team', 'Test Organisation');
        cy.get('.widget-wrapper.repository_owner').should('contain.text', 'Test Organisation');
        label('storage_building_name', 'Storage Building Name');
        optionTexts('storage_building_name').then((texts) =>
            expect(texts).to.deep.equal(['CAP Causeway', 'CAP Oasis', 'HERoNI Oasis', 'HERoNI Titanic Quarter', 'HERoNI War Rooms', 'PRONI']));
        cy.get(REAL_OPTIONS).contains('PRONI').click();
        label('storage_room_name', 'Storage Room Name');
        input('storage_room_name').type('Test Storage Room Name').should('have.value', 'Test Storage Room Name');
        label('storage_shelf_name', 'Storage Shelf Name');
        input('storage_shelf_name').type('Test Storage Shelf Name').should('have.value', 'Test Storage Shelf Name');
        label('storage_box_name', 'Storage Box Name');
        input('storage_box_name').type('Test Storage Box Name').should('have.value', 'Test Storage Box Name');
        footer({ save: true });
        cy.workflowNext();

        // Archive Loan History: entries list on the right, can be removed, and the dates carry to the next entry.
        label('archive_holder', 'Person or Organization');
        label('archive_holder_start_date', 'Start Date');
        label('archive_holder_end_date', 'End Date');
        entries().should('not.exist');
        cy.pickRelationshipSearch('Person or Organization', 'Test Person');
        cy.pickCalendarDay('archive_holder_start_date', 1);
        cy.fillDate('archive_holder_end_date', todayString());
        manyButton('Add').click();
        entries().should('have.length', 1).and('contain.text', 'Test Person');
        // The last entry's dates stay in the inputs for the next one.
        input('archive_holder_start_date').should('have.value', firstOfMonth());
        input('archive_holder_end_date').should('have.value', todayString());

        cy.pickRelationshipSearch('Person or Organization', 'Test Organisation');
        manyButton('Add').click();
        entries().should('have.length', 2);
        // The newest entry is listed first.
        entries().first().contains('Remove').click();
        entries().should('have.length', 1).and('contain.text', 'Test Person');

        cy.contains('Save and Complete Workflow', { timeout: 30000 }).click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });

    it('Opens the new archive source from search with everything entered', function () {
        cy.then(() => {
            findResourceId(archive.title);
            cy.visit(`/search?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(archive.title)}`, { timeout: 180000 });
            cy.contains(archive.title, { timeout: 60000 });
        });
        cy.then(() => {
            cy.visit(`/report/${archive.resourceId}`, { timeout: 180000 });
            const expected = [archive.id, archive.title, 'Test Subtitle', 'TestId', 'Genre', 'Destroyed', 'test description',
                'Test Author Name', 'Test Editor Name', 'test statement of responsibility', 'Test Organisation',
                'PRONI', 'Test Storage Room Name', 'Test Storage Shelf Name', 'Test Storage Box Name', 'Test Person',
            ];
            // APP-BUG: the Names and Identifiers tab reads v7 card names, so it shows "No names" and "No references".
            cy.contains('Names and Identifiers', { timeout: 60000 });
            cy.contains('Full Report').click();
            cy.get('body').should(($body) => {
                const text = $body.text();
                expect(expected.filter((value) => !text.includes(value)), 'values missing from the report').to.deep.equal([]);
            });
        });
    });

    it('Open Selected reopens the workflow with the saved data', function () {
        openLauncher();
        cy.get('.select2-selection', { timeout: 60000 }).first().click();
        cy.then(() => {
            cy.select2Search(archive.title);
            cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(archive.title).click();
        });
        cy.contains('button', 'Open Selected').should('not.be.disabled').click();

        cy.then(() => {
            cy.get('[aria-label="Resource ID"]', { timeout: 90000 }).should('have.value', archive.id);
            cy.get('.workflow-nav-tab.disabled').should('have.length', 0);
            cy.workflowNext();
            input('archive_source_name').should('have.value', archive.title);
            input('subtitle').should('have.value', 'Test Subtitle');
            input('file_id_number').should('have.value', 'TestId');
            cy.get('.widget-wrapper.status .select2-selection').should('contain.text', 'Destroyed');
            cy.get('.workflow-nav-tab-container').contains('Archive Loan History').click();
            entries().should('have.length', 1).and('contain.text', 'Test Person');
        });
    });
});
