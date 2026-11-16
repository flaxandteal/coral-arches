describe('Going through the state care Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    const UPLOAD_FIXTURE = 'cypress/fixtures/test-upload.txt';
    const UPLOAD_NAME = 'test-upload.txt';

    function fillDocumentationTab() {
        // Upload a fixture file through the dropzone. The dropzone's own
        // <input type="file"> is hidden, hence { force: true }.
        cy.get('.bord-top > .btn', { timeout: 60000 }).contains('Select Files');
        cy.wait(2000);
        cy.get('input.dz-hidden-input').first().selectFile(UPLOAD_FIXTURE, { force: true });
        cy.get('.card-component', { timeout: 30000 }).should('contain.text', UPLOAD_NAME);
        cy.contains('files uploaded').should('be.visible');
        // An attached-but-unsaved file changes the footer button to "Save and
        // Continue" instead of "Next Step". Clicking it saves/uploads the
        // file and stays on this tab; "Next Step" then appears and actually
        // advances.
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains('Save and Continue')
            .click();
        cy.wait(3000);
    }

    it('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-state-care-condition-survey-workflow?workflow-slug=state-care-condition-survey-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.get('[aria-label="Select Heritage Asset, Please select a Heritage Asset"]').click();
        cy.wait(3000);
        // Skip the loading placeholder - picking it leaves selectedHeritageAsset
        // empty, which keeps the "Start New" button disabled.
        cy.get('.select2-results__option')
            .not('.loading-results')
            .not('.select2-results__option--load-more')
            .first()
            .click();
        cy.wait(2000);

        cy.contains('Start New').click();
        cy.wait(6000);
        cy.workflowNext();
        cy.wait(3000);
        cy.workflowNext();

        cy.wait(4000);
        // These are all domain selects whose aria-label embeds the randomly
        // seeded current value, so target them by card instead.
        cy.pickCardOption('assessment_type');
        cy.wait(1000);
        cy.pickCardOption('works_required');
        cy.wait(1000);
        cy.pickCardOption('condition_score');
        cy.wait(1000);
        cy.pickCardOption('priority');
        cy.wait(3000);
        cy.get('.workflow-component-element').get('.btn.btn-workflow-tile.btn-success').should('be.visible').contains('Add').click();

        cy.typeRichText('notes', 'Notes for automated testing.');

        cy.get(':nth-child(2) > .workflow-component > .workflow-component-element > .card-component').click();
        cy.workflowNext(); // Overall Scored Assessment -> Documentation

        fillDocumentationTab();
        cy.wait(4000);
        cy.workflowNext(); // Documentation -> Sign Off
        
        cy.wait(5000);
        cy.fillDate('completed_on');
        cy.fillDate('signed_off_date');
        // Sign Off is the last tab, so its footer button is a plain "Save"
        // rather than a forward step - workflowNext() would not match it.
        cy.get('.tabbed-workflow-footer-button-container')
            .find('button:not([disabled])')
            .contains(/Save and Continue|Next Step|Save/)
            .click();
        cy.wait(4000);
        cy.get('.workflow-top-control > .btn-success > .verbose').click();

        // Workflow completes and returns to the workflow launcher list.
        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});