describe('Going through the Merge Workflow', function () {

    beforeEach(() => {
        cy.login();
    });

    // Merge Workflow (coral/media/js/views/components/plugins/merge-workflow.js)
    // irreversibly merges one Heritage Asset's data into another - its own
    // "Approval" step text warns "This process cannot easily be undone".
    // To avoid ever touching shared fixture resources (e.g. the "Garden
    // Test" HAs other specs in this suite depend on), this test creates two
    // brand-new, uniquely-named, throwaway Heritage Assets via the Add
    // Garden workflow first and merges those instead. Only the Start step
    // is required on Add Garden, so everything past Site Name is skipped to
    // keep setup fast - reaching "Save and Complete Workflow" is what
    // actually gets the resource indexed and searchable for the merge
    // picker (see coral/management/commands/seed_test_scheduled_monument.py
    // for the same reindex-before-search requirement in a different context).
    const createThrowawayHeritageAsset = (siteName) => {
        cy.visit('/plugins/init-workflow');
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Garden').click();
        cy.wait(2000);
        cy.get('.btn-success').contains('Start New').click();

        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.workflowNext();

        cy.contains('Site Name').should('be.visible');
        cy.get('[aria-label="Site Name"]').click().type(siteName);
        cy.workflowNext();

        cy.workflowNext(); // Location Details - not required, nothing filled
        cy.workflowNext(); // Map - manually tested, see 01_add_garden
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext(); // Digital Files

        cy.wait(2000);
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.wait(3000);
    };

    it('Merge two Heritage Assets and go through the workflow', function () {
        const suffix = Date.now();
        const baseName = `Merge Test Base ${suffix}`;
        const mergeName = `Merge Test Merge ${suffix}`;

        createThrowawayHeritageAsset(baseName);
        createThrowawayHeritageAsset(mergeName);

        // Merge Workflow has config.show=false like Relate Heritage Assets,
        // so it's reached by direct URL rather than the workflow tile list.
        cy.visit('/plugins/merge-workflow');
        cy.wait(2000);

        // Search tab - select-resource-id widgets, not the usual
        // relationship picker, so they're driven with select2Search.
        cy.contains('Base Heritage Asset').should('be.visible');
        cy.get('.select2-selection').first().click();
        cy.select2Search(baseName);
        cy.get('.select2-results__option').contains(baseName).click();
        cy.wait(2000);

        cy.workflowNext();

        // Merging tab
        cy.contains('Merge Heritage Asset').should('be.visible');
        cy.get('.select2-selection').first().click();
        cy.select2Search(mergeName);
        cy.get('.select2-results__option').contains(mergeName).click();
        cy.wait(2000);

        cy.workflowNext();

        // Map of Locations tab - shows both resources' geometry, nothing to
        // input since neither throwaway resource has a geometry tile.
        cy.workflowNext();

        // Information tab - the two "* HA Number" cards just redisplay each
        // resource's already-generated, disabled HA Number; only the notes
        // card needs input, and it's mandatory per the step's own
        // information box text.
        cy.contains('Base HA Number').should('be.visible');
        cy.contains('Merged HA Number').should('be.visible');
        cy.get('input[aria-label="Description Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Notes"]').click().type(`Merging ${mergeName} into ${baseName} for testing.`);

        cy.workflowNext();

        // Approval tab - "Report Updated By" is meant to be restricted to
        // sign-off groups via user-to-model-select, but works as a plain
        // resource-instance-list picker either way.
        cy.contains('Report Updated By').scrollIntoView();
        cy.pickRelationshipFirst('Report Updated By');
        cy.wait(2000);

        // Widget label here is "Reference ID", not "ResourceID" like the
        // node's own name suggests.
        cy.contains('Reference ID').scrollIntoView();
        cy.get('[aria-label="Reference ID"]').click().type(`MERGE-${suffix}`);

        cy.get('.card_component.date_of_submission_value input.form-control').first().click();
        cy.get('.card_component.date_of_submission_value .input-group-addon').click();

        cy.workflowNext();

        // Submit Merge tab - domain-checkbox-widget is a newer web-component
        // widget (part of the v8 Vue component migration) rather than a
        // knockout-bound one, so this targets its checkbox input generically
        // rather than a class name verified against the others in this
        // suite's commands.js helpers.
        cy.contains('acknowledging the process').scrollIntoView();
        cy.get('input[type="checkbox"]').first().click({ force: true });
        cy.get('button').contains('Submit').should('not.be.disabled').click();
    });
});
