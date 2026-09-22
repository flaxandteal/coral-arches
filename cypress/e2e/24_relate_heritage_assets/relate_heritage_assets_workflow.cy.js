describe('Going through the Relate Heritage Assets Workflow', function () {

    beforeEach(() => {
        cy.login();
    });

    it('Relate two Heritage Assets and go through the workflow and populate all fields', function () {
        // This plugin has config.show=false, so it never appears on the
        // /plugins/init-workflow tile list (unlike every other workflow in
        // this suite) - it's a standalone plugin (views/components/plugins/
        // relate-two-monuments-workflow.js) navigated to directly, not one
        // of the JSON-configured "open-workflow?workflow-slug=" launches.
        cy.visit('/plugins/relate-two-monuments-workflow');
        cy.wait(2000);

        // Select Heritage Asset tab - a select-resource-id search widget,
        // not the usual resource-instance relationship picker, so it uses a
        // plain select2 lookup rather than cy.pickRelationshipFirst.
        cy.contains('Name/SMR of the Heritage Asset').should('be.visible');
        cy.get('.select2-selection').first().click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);

        cy.workflowNext();

        // Associate Heritage Asset tab
        cy.contains('Associated Monument, Area or Artefact').scrollIntoView();
        cy.pickRelationshipFirst('Associated Monument, Area or Artefact');
        cy.wait(2000);

        cy.contains('Association Type').scrollIntoView();
        cy.get('input[aria-label="Association Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.workflowNext();

        // Complete tab - this step's two cards originally pointed at
        // nodegroupids from a Feb 2024 graph revision
        // (35d8256a-d7d6-11ee-9916-0242ac120006 and
        // 76fc577c-d7d7-11ee-ade0-0242ac120006) that don't exist in this DB;
        // fixed in relate-two-monuments-workflow.js by remapping to their
        // current equivalents under the same "Associated Heritage Assets,
        // Areas and Artefacts" parent tile - "Association Date"
        // (450ee1c9-8f79-59b6-a064-01bcb6ddbc2a) and "Associated By"
        // (3567a048-599c-5d3e-b9da-332140612855) - confirmed by matching
        // node names and parent nodegroup.
        cy.get('.card_component.association_date_value input.form-control').first().click();
        cy.get('.card_component.association_date_value .input-group-addon').click();

        // "Associated By" is meant to be restricted to sign-off groups via
        // a user-to-model-select widget, but that override's target node id
        // (e561be82...) doesn't match the real "Associated By Value" node
        // id, so it's a no-op and this falls back to a plain relationship
        // picker.
        cy.contains('Associated By').scrollIntoView();
        cy.pickRelationshipFirst('Associated By');
        cy.wait(2000);

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
