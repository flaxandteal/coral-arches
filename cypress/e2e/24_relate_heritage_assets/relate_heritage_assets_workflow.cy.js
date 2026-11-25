describe('Going through the Relate Heritage Assets Workflow', function () {

    beforeEach(() => {
        cy.login();
    });

    // Seeded Heritage Assets with an SMR number (cypress/seed).
    const TARGET = 'SMR-TEST-004 Testing';
    const RELATED = ['SMR-TEST-005 Testing', 'SMR-TEST-006 Testing'];

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const CALENDAR = '.bootstrap-datetimepicker-widget';
    const SMR_NODE = 'd146451b-9140-5f81-b3de-9005acc01e28';

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const firstOfMonth = () => `01-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

    const label = (alias, text) => cy.get(`.widget-wrapper.${alias}`, { timeout: 30000 }).should('contain.text', text);
    const rows = (alias) => cy.get(`.widget-wrapper.${alias} .rr-table-row`, { timeout: 15000 });
    const targetPicker = () => cy.get('[aria-label="Name/SMR of the Heritage Asset"] + .select2 .select2-selection', { timeout: 60000 }).first();

    const termFilter = (value) => encodeURIComponent(JSON.stringify([{ context: '', context_label: '', id: `string${value}`,
        text: value, type: 'string', value, inverted: false, selected: true }]));

    it('Relates Heritage Assets to a target', function () {
        cy.visit('/plugins/relate-two-monuments-workflow', { timeout: 180000 });

        // Select Heritage Asset: step information, and nothing to do until a target is chosen.
        cy.contains('Target Heritage Asset', { timeout: 60000 });
        cy.contains('The monument selected here will be the Heritage Asset that it is related to.');
        cy.contains('dismiss').click();
        cy.contains('Target Heritage Asset').should('not.be.visible');
        cy.get(FOOTER).should('not.contain.text', 'Previous Step').and('not.contain.text', 'Save');
        cy.get(FOOTER).contains('button', 'Next Step').should('have.class', 'disabled');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 2);

        // Only Heritage Assets with an SMR number are offered.
        cy.contains('label', 'Name/SMR of the Heritage Asset');
        cy.intercept('GET', '/search/resources*').as('targets');
        targetPicker().click();
        cy.wait('@targets').its('request.url').then(decodeURIComponent).should('include', SMR_NODE);
        cy.select2Search(TARGET);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(TARGET).click();
        targetPicker().should('contain.text', TARGET);
        cy.contains('button', 'Save and Continue').click();

        // Associate Heritage Asset: back to the target and it is still chosen.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Associate Heritage Asset');
        cy.get(FOOTER).contains('button', 'Previous Step').click();
        targetPicker().should('contain.text', TARGET);
        cy.get(FOOTER).contains('button', /Save and Continue|Next Step/).click();

        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Associate Heritage Asset');
        cy.get(FOOTER).contains('button', 'Previous Step').should('not.have.class', 'disabled');
        cy.get(FOOTER).should('not.contain.text', 'Save');
        cy.get('.workflow-nav-tab').contains('Complete').closest('.workflow-nav-tab').should('have.class', 'disabled');

        // Several assets, searchable, none created from here, none twice.
        // The checklist and the node say "Heritage Asset"; the widget label still reads "Monument".
        label('associated_monument_area_or_artefact', 'Associated Monument, Area or Artefact');
        cy.openRelationship('Associated Monument, Area or Artefact');
        cy.get('.select2-search__field:visible').first().type('xxxxxxx');
        cy.get('.select2-results__option', { timeout: 20000 })
            .should('contain.text', 'No results found').and('not.contain.text', 'Create a new');
        cy.get('body').type('{esc}');
        RELATED.forEach((name) => cy.pickRelationshipSearch('Associated Monument, Area or Artefact', name));
        rows('associated_monument_area_or_artefact').should('have.length', 2);
        cy.pickRelationshipSearch('Associated Monument, Area or Artefact', RELATED[0]);
        rows('associated_monument_area_or_artefact').should('have.length', 2);

        label('association_type', 'Association Type');
        cy.get('.widget-wrapper.association_type .select2-selection').first().click();
        cy.get(REAL_OPTIONS, { timeout: 15000 }).then(($options) =>
            expect($options.toArray().map((o) => o.textContent.trim())).to.deep.equal(['General association', 'Identified as', 'Is referred to by']));
        cy.get(REAL_OPTIONS).contains('General association').click();
        cy.wait(2000);
        cy.contains('button', 'Save and Continue').click();

        // Complete: when, and by whom.
        cy.get('.workflow-nav-tab.active', { timeout: 60000 }).should('contain.text', 'Complete');
        label('association_date_value', 'Association Date');
        cy.scrollToWidget('association_date_value');
        cy.get('.widget-wrapper.association_date_value input.form-control').first().click({ force: true });
        cy.get(`${CALENDAR} td.day.active:visible`).should('have.text', String(now.getDate()));
        cy.get(`${CALENDAR} td.day.active:visible`).nextAll('td.day').each(($day) => expect($day).to.have.class('disabled'));
        cy.get('.workflow-nav-tab.active').click();
        cy.pickCalendarDay('association_date_value', 1);
        cy.get('.widget-wrapper.association_date_value input.form-control').first().should('have.value', firstOfMonth());
        // The admin user has no Person in the four groups Associated By offers.
        cy.contains('Associated By');
        cy.contains('You do not have permission to sign off');

        cy.get(FOOTER).find('button:not([disabled])').contains(/^\s*Save\s*$/).click();
        cy.get(FOOTER, { timeout: 30000 }).should('not.contain.text', 'Save');
        cy.contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 }).should('include', '/plugins/init-workflow');
    });

    it('Shows the related assets on the target report', function () {
        cy.request(`/search/resources?paging-filter=1&tiles=true&language=*&term-filter=${termFilter(TARGET)}`).then((response) => {
            const hit = response.body.results.hits.hits.find((h) => h._source.displayname === TARGET);
            cy.visit(`/report/${hit._id}`, { timeout: 180000 });
        });
        cy.contains(TARGET, { timeout: 60000 });
        RELATED.forEach((name) => cy.contains(name, { timeout: 60000 }));
    });
});
