describe('Going through the Add Building Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new HA and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Building').click();
        cy.wait(2000);

        // Add Building 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Heritage Asset Details tab
        cy.contains('Heritage Asset Name').should('be.visible');
        cy.get('[aria-label="Heritage Asset Name"]').click().type('Testing');

        // coral/plugins/add-building-workflow.json relabels this card to
        // "Monument Type" via the "labels" param, but that param is only read
        // by default-card-util/workflow-builder-initial-step - this card uses
        // plain "default-card" (see card-component.js), which never applies
        // it, so the field still renders under its underlying node name.
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

        // Contacts (cardinality "n" - Owner/Occupier/Applicant/Agent/Field
        // Worker are all resource-instance-list relationships to Person/Org)
        cy.contains('Owner').scrollIntoView();
        cy.pickRelationshipFirst('Owner');
        cy.wait(2000);

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

        cy.workflowNext();

        // Descriptions tab
        cy.get('.card_component.description_type').contains('Description Type').scrollIntoView();
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.control-label').contains('Description');
        // Whatever CKEDITOR instance is actually ready and visible gets
        // targeted (see cy.type_ckeditor fallback in commands.js) - the
        // instance name/number isn't stable across pages.
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

        // Finish tab - Sign Off (generic, shared with other workflows) +
        // generate-hb-number (auto-fills "Generated HB" on save, no input)
        cy.wait(2000);
        cy.get('[aria-label="Reference Number"]').click().type('HB-TEST-01');
        cy.wait(2000);
        cy.get('input[aria-label="Status Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.form-control.input-lg').first().click();
        cy.get('.form-control.input-lg').eq(1).click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
