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

        // Heritage Asset Details tab - "Heritage Asset Name" is a substring
        // of this card's own title ("Heritage Asset Names"), and the card
        // title (h4.card-title) sits earlier in the DOM than the widget
        // label, so a bare cy.contains resolves to the card title rather
        // than the visible input; scope directly to the input instead.
        cy.get('[aria-label="Heritage Asset Name"]').should('be.visible').click().type('Testing');

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

        // Widget label is "Historical Period", not the underlying node's
        // own name "Historical Period Type".
        cy.contains('Historical Period').scrollIntoView();
        cy.wait(2000);
        cy.get('input[aria-label="Historical Period"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // Contacts (cardinality "n" - Owner/Occupier/Applicant/Agent/Field
        // Worker are all resource-instance-list relationships to Person/Org).
        // The aria-label-based pickRelationshipFirst couldn't find these
        // visible, so scope via each widget's own alias class instead.
        cy.pickCardOption('occupier');
        cy.wait(2000);
        cy.pickCardOption('owner');
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

        // County is actually single-select with a working comma-suffixed
        // aria-label (its own alias class is "county_value" anyway, not
        // "county"), so pickRelationshipFirst is correct there.
        cy.pickRelationshipFirst('County');
        cy.wait(2000);
        cy.pickCardOption('townland');
        cy.wait(2000);

        cy.pickCardOption('area_type');
        cy.wait(2000);
        cy.pickCardOption('area_name');
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
        // generate-hb-number (auto-fills "Generated HB" on save, no input).
        // "Reference Code" (widget label for the "Reference Number" node) is
        // itself disabled/auto-generated ("This field should automatically
        // be generated"), same idea as HA Number on the Start tab - nothing
        // to type there. Status widget label is "Status", not "Status Type".
        cy.wait(2000);
        cy.get('[aria-label="Reference Code"]').should('be.disabled');
        // input[aria-label=...] isn't reliable for single-select
        // reference-select-widget fields (its "input" only exists inside
        // the dropdown once open, not on the closed selection) - scope by
        // alias class instead, same as county/townland/etc above.
        cy.pickCardOption('status_type_n1');
        cy.wait(2000);

        // Clicking the input opens the datepicker; clicking the calendar
        // icon addon closes it again before moving to the next field,
        // otherwise the still-open calendar overlaps and blocks the next
        // click (see 01_add_garden's identical Sign Off card handling).
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.wait(2000);
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
