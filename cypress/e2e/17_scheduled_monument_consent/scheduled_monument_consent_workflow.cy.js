describe('Going through the Scheduled Monument Consent Workflow', function () {

    beforeEach(() => {
        cy.login();
        // A cold load fetches ~250 webpack chunks and can exceed the 90s default.
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // Letters and file uploads stay commented out: the storage buckets differ per environment.
    // Documentation: cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });
    // Letter: choose a letter type and click Generate.

    const clickNext = () => {
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled]):not(.disabled)')
            .contains(/Save and Continue|Next Step/)
            .click();
    };

    // The launcher only lists heritage assets that carry an SMR number.
    const pickHeritageAsset = () => {
        cy.get('.select2-selection', { timeout: 60000 }).first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)', { timeout: 30000 })
            .first().click();
    };

    it('Only enables Start New once a heritage asset is chosen', function () {
        cy.contains('SMC').click();
        cy.contains('button', 'Start New', { timeout: 30000 }).should('be.disabled');
        cy.contains('button', 'Open Selected').should('be.disabled');

        pickHeritageAsset();
        cy.contains('button', 'Start New').should('not.be.disabled');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('SMC').click();
        pickHeritageAsset();
        cy.contains('button', 'Start New').should('not.be.disabled').click();

        // Start Meeting: the reference is generated into a locked input.
        cy.get('[aria-label="SMC Reference Number"]', { timeout: 60000 })
            .should(($id) => expect($id.val()).to.match(/^SMC\/\d{4}\/\w+$/))
            .and('be.disabled');
        clickNext();

        // Details
        cy.get('.widget-wrapper.distinction', { timeout: 60000 }).should('exist');
        cy.wait(8000);
        cy.pickCardOption('distinction');
        cy.get('.widget-wrapper.distinction .select2-selection__placeholder').should('not.exist');

        cy.typeInCard('consultation_name', 'SMC-APP-01');
        cy.typeInCard('cm_reference_number', 'CM-TEST-01');

        // A received date in the future is refused.
        cy.scrollToWidget('dfi_received_date_value');
        cy.get('.widget-wrapper.dfi_received_date_value input.form-control').first()
            .type('28-07-2036{enter}', { force: true });
        cy.get('.widget-wrapper.dfi_received_date_value input.form-control').first()
            .should('not.have.value', '28-07-2036')
            .clear({ force: true });
        cy.fillDate('dfi_received_date_value');

        cy.typeRichText('reason_description', 'Proposed works summary');

        cy.pickCardOption('applicant_n1');
        cy.get('.widget-wrapper.applicant_n1 .rr-table-row').should('have.length', 1);
        cy.pickCardOption('referred_to');
        cy.get('.widget-wrapper.referred_to .rr-table-row').should('have.length', 1);
        clickNext();

        // Relevant Parties: Agent(s), Owner(s), Applicant(s) and Occupier(s) all take several.
        cy.get('.widget-wrapper.agent', { timeout: 60000 }).should('exist');
        cy.wait(8000);
        ['agent', 'owner', 'applicant', 'occupier'].forEach((alias) => {
            cy.scrollToWidget(alias);
            cy.pickCardOption(alias);
            cy.get(`.widget-wrapper.${alias} .rr-table-row`).should('have.length', 1);
        });
        cy.scrollToWidget('agent');
        cy.pickCardOption('agent', 1);
        cy.get('.widget-wrapper.agent .rr-table-row').should('have.length', 2);
        clickNext();

        // Documentation is optional; nothing to upload here.
        cy.get('.workflow-nav-tab-container', { timeout: 60000 }).contains('Letter').should('exist');
        clickNext();

        // Letter generation is optional; go straight to Decision.
        cy.get('.workflow-nav-tab-container').contains('Decision').click();

        // Decision
        cy.get('.widget-wrapper.consent', { timeout: 60000 }).should('exist');
        cy.wait(8000);
        cy.pickCardOption('consent');
        cy.pickCardOption('status_n1');
        cy.typeRichText('works_to_be_carried_out', 'Test works description');
        cy.fillDate('provisional_issued_date');
        cy.fillDate('actual_issued_date');

        // Sign-off is for the logged-in user's Person, and admin has none.
        cy.contains('You do not have permission to sign off').should('exist');

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 })
            .should('not.include', '/scheduled-monument-consent-workflow');
    });
});
