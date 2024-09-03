describe('Going through the Add Garden Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Add Garden').click();
        cy.wait(2000);

        // Add Garden 1st page
        cy.get('[aria-label="Start new or please select from below"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.get('.btn-success').contains('Start New').click();
        cy.wait(2000);

        // Start tab
        cy.wait(4000);
        cy.get('.card_component.resourceid').contains('HA Number');
        cy.get('.form-control').should('be.disabled');
        cy.get('.btn-success').contains('Save and Continue').click();

        // Heritage Asset Details tab
        cy.contains('Site Name');
        cy.get('[aria-label="Site Name"]').click().type('Testing');

        cy.contains('Heritage Asset Type');
        cy.get('[aria-label="Heritage Asset Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Land Use Classification').scrollIntoView();
        cy.get('[aria-label="Land Use Classification"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(4000);

        cy.contains('Bibliographic Source').scrollIntoView();
        cy.wait(2000)
        cy.get(':nth-child(1) > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.contains('Source Number');
        cy.get('[aria-label="Source Number"]').click().type('123456');

        cy.contains('Page(s)');
        cy.get('[aria-label="Page(s)"]').click().type('12');

        cy.contains('Figs.');
        cy.get('[aria-label="Figs."]').click().type('123');

        cy.contains('Plate(s)');
        cy.get('[aria-label="Plate(s)"]').click().type('1');

        cy.contains('Comment').scrollIntoView();
        cy.get('[aria-label="Comment"]').click().type('1');


        cy.get('.card_component.description_type').contains('Description Type').scrollIntoView();
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.btn-success').contains('Add').click();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

        // Location Details tab
        cy.wait(2000);
        cy.get('[aria-label="Building Name"]').click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Building Number"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Street"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Town or City"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Postcode"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('.county_selected').contains('Select an option').scrollIntoView().click();
        cy.get('.townland').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.council').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.area_type').contains('Select an option').scrollIntoView().click();
        cy.wait(2000);
        cy.get('.area_name').contains('Select an option').click();
        cy.wait(2000);
        cy.get('[aria-label="Unique Building ID"]').click().type('01');
        cy.wait(2000);
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoView().click().type('02');
        cy.wait(2000);
        cy.get('[aria-label="BU Fusion ID"').click().type('03');
        cy.wait(2000);

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

        // Map tab
        cy.get('.mapboxgl-canvas');
        cy.get('.workbench-card-sidebar');
        cy.get('#toggle-basemap-panel-button').contains('Basemap').click();
        cy.get('[aria-label="Dark"]').click();
        cy.get('[aria-label="ESRI World"]').click();
        cy.get('[aria-label="ESRI World Topo"]').click();
        cy.get('[aria-label="Light"]').click();
        cy.get('[aria-label="Open Street Map"]').click();
        cy.get('[aria-label="Satellite Streets"]').click();
        cy.get('[aria-label="Stamen Terrain"]').click();
        cy.get('[aria-label="TC-copy"]').click();
        cy.get('[aria-label="satellite"]').click();
        cy.get('.active-basemap').click();

        cy.get('#toggle-overlays-panel-button').contains('Overlays').click();
        cy.get('#toggle-legend-panel-button').contains('Legend').click();

        cy.get('.card_component.feature_shape').contains('Feature Shape').scrollIntoView();
        cy.get('.select2-selection__rendered').contains('Select an option').click();

        cy.get('.select2-results__option').contains('Approx').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Archaeological Event').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Area').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Dispersed Event').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Linear').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Locality').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Named Loc').click();
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        cy.get('.select2-results__option').contains('Unknown').click();

        cy.get('#formatType')

        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').click();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click()

        // Finish tab
        cy.wait(2000);
        cy.get('[aria-label="Input Date Value"]').click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.input_by_value').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Approved Date Value"]').click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.gar_approved_by_value').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.status_type_n1').contains('Select an option').scrollIntoView().click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click()
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();


    })
})