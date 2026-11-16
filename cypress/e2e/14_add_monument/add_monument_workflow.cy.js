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

        // Start tab - the resourceid widget's own label in
        // cards_x_nodes_x_widgets is already "HA Number" (Add IHR's "SMR
        // Number" -> "HA Number" labels override is a no-op that happens to
        // match this), and this workflow applies no override of its own, so
        // it renders the same "HA Number" label.
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
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

        // The card heading is "Historical Period Type" (its nodegroup's
        // name), but the widget's own label in cards_x_nodes_x_widgets is
        // "Historical Period" - one word shorter, so it needs its own
        // selector rather than reusing the heading text.
        cy.contains('Historical Period Type').scrollIntoView();
        cy.wait(2000);
        cy.get('input[aria-label="Historical Period"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        // Condition Type/Category Type are single-select reference widgets:
        // the element actually carrying the "Condition Type"/"Category Type"
        // aria-label is a hidden <select aria-hidden="true"> backing the
        // visible select2 span, not an <input> - unlike the multiValue
        // fields above (Heritage Asset Type, Historical Period Type), which
        // do render a real aria-labelled <input>. Scope by the widget's own
        // alias class and drive the visible select2 span instead.
        cy.contains('Condition Type').scrollIntoView();
        cy.wait(2000);
        cy.pickCardOption('condition_type');
        cy.wait(2000);

        cy.contains('Category Type').scrollIntoView();
        cy.wait(2000);
        cy.pickCardOption('category_type');
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

        // default-card-util relabels this field's underlying widget label
        // ("Cross Reference") to "Other Reference", and since this card uses
        // default-card-util (which does apply "labels" overrides), the
        // actual rendered aria-label is "Other Reference", not the node's
        // own name "External Cross Reference". "External Cross Reference
        // Description" and "URL" are both in this card's hiddenNodes list,
        // so there's nothing to interact with for either of them.
        cy.contains('Other Reference').scrollIntoView();
        cy.get('[aria-label="Other Reference"]').click().type('XREF-01');

        // "Excavation Licence" is a resource-instance-list relationship; the
        // sibling "Excavation Licence Reference Number" string field shares
        // its nodegroup but is explicitly listed in this step's own
        // hiddenNodes (add-monument-workflow.json, nodegroup 2537611a...),
        // so it never renders - nothing to interact with there.
        cy.pickCardOption('excavation_licence');
        cy.wait(2000);

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

        // Townland/Area Type/Area Name render as multi-value select2, which
        // doesn't get the comma-suffixed aria-label pickRelationshipFirst
        // needs - scope by alias class instead (see 12_add_building).
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

        // Finish tab - Sign Off (generic, shared with Add Building) +
        // generate-smr-number (auto-fills "Generated SMR" on save).
        // "Reference Code" is disabled/auto-generated (same as HA Number),
        // and its widget label is "Reference Code" not "Reference Number".
        // Status widget label is "Status", rendered as single-select
        // reference-select-widget, so scope via alias class rather than an
        // input[aria-label] selector (see 12_add_building).
        cy.wait(2000);
        cy.get('[aria-label="Reference Code"]').should('be.disabled');
        cy.pickCardOption('status_type_n1');
        cy.wait(2000);

        // Clicking a date input opens its datepicker; clicking the calendar
        // icon addon closes it before the next field (see 12_add_building).
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.wait(2000);
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    });
});
