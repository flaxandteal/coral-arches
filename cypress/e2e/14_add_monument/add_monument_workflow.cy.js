describe('Going through the Add Monument Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new HA and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Monument').click();
        cy.wait(2000);

        // Add Monument 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab - unlike Garden/Building/IHR, this workflow does not
        // override the label on generate-ha-number, so it keeps the node's
        // default "SMR Number" label instead of "HA Number".
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('SMR Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Heritage Asset Details tab
        cy.contains('Site Name').should('be.visible');
        cy.get('[aria-label="Site Name"]').click().type('Testing');

        cy.contains('Heritage Asset Type').should('be.visible');
        cy.wait(2000);
        cy.get('input[aria-label="Heritage Asset Type"]').click();
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Historical Period Type').scrollIntoView();
        cy.wait(2000);
        cy.get('input[aria-label="Historical Period Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Condition Type').scrollIntoView();
        cy.wait(2000);
        cy.get('input[aria-label="Condition Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Category Type').scrollIntoView();
        cy.wait(2000);
        cy.get('input[aria-label="Category Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Bibliographic Source').scrollIntoView();
        cy.wait(2000);
        cy.get('[aria-label="Citations, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Source Number').should('be.visible');
        cy.get('[aria-label="Source Number"]').click().type('123456');

        cy.contains('Page(s)').should('be.visible');
        cy.get('[aria-label="Page(s)"]').click().type('12');

        cy.contains('Figs.').should('be.visible');
        cy.get('[aria-label="Figs."]').click().type('123');

        cy.contains('Plate(s)').should('be.visible');
        cy.get('[aria-label="Plate(s)"]').click().type('1');

        cy.contains('Comment').scrollIntoView();
        cy.get('[aria-label="Comment"]').click().type('1');

        cy.get('.btn-success').contains('Add').click();
        cy.wait(2500);

        // "Other Reference" (default-card-util relabels "Cross Reference" ->
        // "Other Reference" here, and this card does apply the labels param)
        cy.contains('Other Reference').scrollIntoView();
        cy.get('[aria-label="External Cross Reference"]').click().type('XREF-01');
        cy.wait(2000);
        cy.get('[aria-label="External Cross Reference Description"]').click().type('test xref');
        cy.wait(2000);
        cy.get('[aria-label="URL"]').click().type('https://example.com');

        cy.contains('Excavation Licence').scrollIntoView();
        cy.pickRelationshipFirst('Excavation Licence');
        cy.wait(2000);
        cy.get('[aria-label="Excavation Licence Reference Number"]').click().type('EXC-01');

        cy.workflowNext();

        // Descriptions tab
        cy.get('.card_component.description_type').contains('Description Type').scrollIntoView();
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.control-label').contains('Description');
        cy.type_ckeditor('editor1', 'test, Description');

        cy.get('.btn-success').contains('Add').click();
        cy.wait(2500);

        cy.workflowNext();

        // Location Details tab - same underlying nodegroups/graph as the Add
        // Garden workflow (see 01_add_garden/add_garden_workflow.cy.js)
        cy.wait(2000);
        cy.get('[aria-label="Building Name"]').click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Street"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Town or City"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Postcode"]').first().click().type('Testing Labs');
        cy.wait(2000);

        cy.pickRelationshipFirst('County');
        cy.wait(2000);
        cy.pickRelationshipFirst('Townland');
        cy.wait(2000);

        cy.pickRelationshipFirst('Area Type');
        cy.wait(2000);
        cy.pickRelationshipFirst('Area Name');
        cy.wait(2000);

        cy.get('.council').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.control-label').contains('Location Description');
        cy.type_ckeditor('editor6', 'test, Location Description');
        cy.get('[aria-label="Unique Building ID"]').click().type('01');
        cy.wait(2000);
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoView().click().type('02');
        cy.wait(2000);
        cy.get('[aria-label="BU Fusion ID"').click().type('03');
        cy.wait(2000);

        cy.workflowNext();

        // Map tab - manually tested, see 01_add_garden
        cy.workflowNext();

        // Digital Files tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.workflowNext();

        // Finish tab - Sign Off (generic, shared with Add Building) +
        // generate-smr-number (auto-fills "Generated SMR" on save)
        cy.wait(2000);
        cy.get('[aria-label="Reference Number"]').click().type('SMR-TEST-01');
        cy.wait(2000);
        cy.get('input[aria-label="Status Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.form-control.input-lg').first().click();
        cy.get('.form-control.input-lg').eq(1).click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
