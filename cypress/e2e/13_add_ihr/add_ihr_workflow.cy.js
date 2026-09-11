describe('Going through the Add IHR Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new HA and go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add IHR').click();
        cy.wait(2000);

        // Add IHR 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.workflowNext();

        // Asset Details tab
        cy.contains('Site Name').should('be.visible');
        cy.get('[aria-label="Site Name"]').click().type('Testing');

        cy.contains('Heritage Asset Type').should('be.visible');
        cy.wait(2000);
        cy.get('input[aria-label="Heritage Asset Type"]').click();
        cy.wait(4000);
        cy.get('.select2-results__option').first().click();

        // coral/plugins/add-ihr-workflow.json also configures a default-card
        // for nodegroup aa629840-d23e-11ee-9ae7-0242ac180006 here, but that
        // nodegroup does not exist in node_groups on this DB (0 rows) - the
        // same class of bug as the missing Council nodegroup diagnosed on the
        // Add Garden Location Details tab. Rendering this card throws
        // "Cannot set properties of undefined (setting 'hideEmptyNodes')" in
        // card-component.js and the field never appears, so there is nothing
        // to interact with.

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

        // Finish tab - configures a "Garden Sign Off" default-card for
        // nodegroup 3897b87a-1902-11ef-aa9f-0242ac150006, which - like
        // aa629840 above - does not exist in node_groups on this DB. Only
        // the second card (Heritage Asset References) actually renders.
        cy.wait(2000);
        cy.get('[aria-label="IHR Number"]').click().type('IHR-TEST-01');
        cy.wait(2000);
        cy.get('[aria-label="SMR Number"]').click().type('SMR-TEST-01');

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
