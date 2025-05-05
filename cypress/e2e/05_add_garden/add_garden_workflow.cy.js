describe('Going through the Add Garden Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    it('Create new HA and Go through the workflow and populate all fields', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Garden').click();
        cy.wait(2000);

        // Add Garden 1st page
        cy.get('.btn-success').contains('Start New').click();

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.get('.btn-success').contains('Save and Continue').click();

        // Heritage Asset Details tab
        cy.contains('Site Name').should('be.visible');
        cy.get('[aria-label="Site Name"]').click().type('Testing');

        cy.contains('Heritage Asset Type').should('be.visible');
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
        cy.get('.select2-results__option').contains('Test Bibliographic').click();

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


        cy.get('.card_component.description_type').contains('Description Type').scrollIntoView();
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.control-label').contains('Description');
        cy.type_ckeditor('editor3', 'test, Description');

        cy.get('.btn-success').contains('Add').click();

        cy.wait(2500);

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

        // Location Details tab
        cy.wait(2000);
        cy.get('[aria-label="Building Name"]').click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Street"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Town or City"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('[aria-label="Postcode"]').first().click().type('Testing Labs');
        cy.wait(2000);
        // missing concepts 
        // cy.get('[aria-label="County, Select an option"]').contains('Select an option').click().contains('Down').click();
        // cy.wait(2000);
        // cy.get('[aria-label="Townland, Select an option"]').contains('Select an option').click().contains(" LITTLE MINNIS'S ISLAND").click();
        cy.wait(2000);
        cy.get('.council').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.get('.area_type').contains('Select an option').scrollIntoView().click();
        cy.wait(2000);
        cy.get('.area_name').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.control-label').contains('Location Description');
        cy.type_ckeditor('editor6', 'test, Location Description');
        cy.get('[aria-label="Unique Building ID"]').click().type('01');
        cy.wait(2000);
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoView().click().type('02');
        cy.wait(2000);
        cy.get('[aria-label="BU Fusion ID"').click().type('03');
        cy.wait(2000);

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

        // // Map tab
        // cy.get('.mapboxgl-canvas');
        // cy.get('.workbench-card-sidebar');
        // cy.get('#toggle-basemap-panel-button').contains('Basemap').click();
        // cy.get('[aria-label="Dark"]').click();
        // cy.get('[aria-label="ESRI World"]').click();
        // cy.get('[aria-label="ESRI World Topo"]').click();
        // cy.get('[aria-label="Light"]').click();
        // cy.get('[aria-label="Open Street Map"]').click();
        // cy.get('[aria-label="Satellite Streets"]').click();
        // cy.get('[aria-label="Stamen Terrain"]').click();
        // cy.get('[aria-label="TC-copy"]').click();
        // cy.get('[aria-label="satellite"]').click();
        // cy.get('.active-basemap').click();

        // cy.get('#toggle-overlays-panel-button').contains('Overlays').click();
        // cy.get('#toggle-legend-panel-button').contains('Legend').click();

        // cy.get('.card_component.feature_shape').contains('Feature Shape').scrollIntoView();
        // cy.get('.select2-selection__rendered').contains('Select an option').click();

        // cy.get('.select2-results__option').contains('Approx').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Archaeological Event').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Area').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Dispersed Event').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Linear').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Locality').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Named Loc').click();
        // cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        // cy.get('.select2-results__option').contains('Unknown').click();

        // cy.get('#formatType')

        cy.get('.btn').contains('Next Step').click();

        // Documentation tab
        cy.get('.bord-top > .btn').contains('Select Files').click();
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click()

        // Finish tab
        cy.wait(2000);
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.input_by_value').should('be.visible');
        cy.wait(2000);
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.gar_approved_by_value').should('be.visible');
        cy.wait(2000);
        cy.get('[aria-label="Provisional"]').click();
        cy.get('.select2-results__option').contains('Approved').click();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click()
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    })

    it('Heritage Asset Details tab specific tests', function () {
        cy.contains('Workflows');
        cy.contains('Add Garden').click();
        cy.wait(2000);

        // Add Garden 1st page
        cy.get('[aria-label="Start new or please select from below"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.wait(2000);
        cy.get('.btn-primary').contains('Open Selected').click();

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.get('.btn-primary').contains('Next Step').click();

        // Heritage Asset Details tab
        cy.contains('Site Name');
        cy.get('[aria-label="Site Name"]').click().type('Testing');
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Site Name"]').click().clear();
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        cy.contains('Heritage Asset Type').should('be.visible');
        cy.get('[aria-label="Heritage Asset Type"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').eq(2).click();
        cy.wait(2000)
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        cy.contains('Land Use Classification').scrollIntoView();
        cy.get('[aria-label="Land Use Classification"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').eq(1).click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Land Use Classification"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').eq(3).click();
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');

        cy.contains('Bibliographic Source').scrollIntoView();
        cy.wait(2000)
        cy.get(':nth-child(1) > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
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

        cy.get('.btn-success').contains('Add').should('be.visible');
        cy.get('.btn-danger').contains('Clear').should('be.visible');
        cy.get('.btn-success').contains('Add').click();

        cy.get(':nth-child(1) > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
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

        cy.contains('Comment').scrollIntoView().should  ;
        cy.get('[aria-label="Comment"]').click().type('1');
         
        cy.get('.btn-danger').contains('Clear').click();

        cy.get('.card_component.description_type').contains('Description Type').scrollIntoView();
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.type_ckeditor('editor3', 'test, Description');

        cy.get('.btn-success').contains('Add').click();
    })

    it('Location Details tab specific tests', function () {
        cy.contains('Workflows');
        cy.contains('Add Garden').click();
        cy.wait(2000);

        // Add Garden 1st page
        cy.get('[aria-label="Start new or please select from below"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.wait(2000);
        cy.get('.btn-primary').contains('Open Selected').click();
        cy.wait(2000);

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number').should('be.visible');
        cy.get('.form-control').should('be.disabled');
        cy.get('.btn-primary').contains('Next Step').click();

        // Heritage Asset Details tab
        cy.wait(2000);
        cy.get('.workflow-nav-tab').contains('Location Details').click();
        cy.wait(2000);

        // Location Details tab
        cy.wait(2000);

        // Building Name
        cy.get('[aria-label="Building Name"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Building Name"]').first().click().clear();
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        // Street
        cy.get('[aria-label="Street"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Street"]').first().click().clear();
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        // Town or City
        cy.get('[aria-label="Town or City"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Town or City"]').first().click().clear();
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        // Postcode
        cy.get('[aria-label="Postcode"]').first().click().type('Testing Labs');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');
        cy.get('[aria-label="Postcode"]').first().click().clear();
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step').should('be.visible');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible');

        // County
        // concept missing
        // cy.get('.county_selected').contains('Select an option').scrollIntoView().click();

        // Townland
        // concept missing
        // cy.get('.townland').contains('Select an option').click();
        // cy.wait(2000);

        // Council
        cy.get('[aria-label="LA01 - Causeway Coast and Glens Borough Council"]').click({force: true});
        cy.wait(2000);
        cy.get('.select2-results__option').contains('LA01 - Causeway Coast and Glens Borough Council').scrollIntoView();
        cy.get('.select2-results__option').contains('LA02 - Mid and East Antrim Borough Council');
        cy.get('.select2-results__option').contains('LA03 - Antrim and Newtownabbey Borough Council');
        cy.get('.select2-results__option').contains('LA04 - Belfast City Council');
        cy.get('.select2-results__option').contains('LA05 - Lisburn and Castlereagh City Council');
        cy.get('.select2-results__option').contains('LA06 - Ards and North Down Borough Council').scrollIntoView();
        cy.get('.select2-results__option').contains('LA07 - Newry, Mourne and Down District Council');
        cy.get('.select2-results__option').contains('LA08 - Armagh City, Banbridge and Craigavon Borough Council');
        cy.get('.select2-results__option').contains('LA09 - Mid Ulster District Council');
        cy.get('.select2-results__option').contains('LA10 - Fermanagh and Omagh District Council').scrollIntoView();
        cy.get('.select2-results__option').contains('LA11 - Derry City and Strabane District Council');
        cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
        
        // Area type
        cy.get('.area_type').contains('Select an option').scrollIntoView().click();
        cy.wait(2000);

        // Area name
        cy.get('.area_name').contains('Select an option').click();
        cy.wait(2000);

        // Location Description
        cy.get('.control-label').contains('Location Description');
        cy.type_ckeditor('editor4', 'test, Location Description');

        // Unique Building ID
        cy.get('[aria-label="Unique Building ID"]').click().type('01');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue')
        cy.get('[aria-label="Unique Building ID"]').first().click().clear();
        // cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        // cy.get('.tabbed-workflow-footer-button-container').contains('Next Step');

        // LP Fusion ID
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoView().click().type('02');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue')
        cy.get('[aria-label="LP Fusion ID"]').first().click().clear();
        // cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        // cy.get('.tabbed-workflow-footer-button-container').contains('Next Step');

        // BU Fusion ID
        cy.get('[aria-label="BU Fusion ID"').click().type('03');
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Undo');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue')
        cy.get('[aria-label="BU Fusion ID"]').first().click().clear();
        // cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        // cy.get('.tabbed-workflow-footer-button-container').contains('Next Step');
    })

    // Map section is to be manually tested, keeping in encase needed in future

    // it('Map tab', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Add Garden').click();
    //     cy.wait(2000);

    //     // Add Garden 1st page
    //     cy.get('[aria-label="Start new or please select from below"]').click();
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').contains('HA/01').click();
    //     cy.get('.btn-success').contains('Start New').click();
    //     cy.wait(2000);

    //     // Start tab
    //     cy.wait(4000);
    //     cy.get('.card_component.resourceid').contains('HA Number');
    //     cy.get('.form-control').should('be.disabled');
    //     cy.get('.btn-success').contains('Save and Continue').click();

    //     // Heritage Asset Details tab
    //     cy.wait(2000);
    //     cy.get('.workflow-nav-tab').contains('Map').click();
    //     cy.wait(2000);

    //     // Map tab
    //     cy.get('.mapboxgl-canvas');
    //     cy.get('.workbench-card-sidebar');
    //     cy.get('#toggle-basemap-panel-button').contains('Basemap').click();
    //     cy.get('[aria-label="Dark"]').click();
    //     cy.get('[aria-label="ESRI World"]').click();
    //     cy.get('[aria-label="ESRI World Topo"]').click();
    //     cy.get('[aria-label="Light"]').click();
    //     cy.get('[aria-label="Open Street Map"]').click();
    //     cy.get('[aria-label="Satellite Streets"]').click();
    //     cy.get('[aria-label="Stamen Terrain"]').click();
    //     cy.get('[aria-label="TC-copy"]').click();
    //     cy.get('[aria-label="satellite"]').click();
    //     cy.get('.active-basemap').click();

    //     cy.get('#toggle-overlays-panel-button').contains('Overlays').click();
    //     cy.get('[aria-label="Heritage Asset - Geospatial Coordinates"]').click();
    //     cy.get('[aria-label="Consultation - Geospatial Coordinates"]').click();
    //     cy.get('[aria-label="Heritage Asset Revision - Geospatial Coordinates"]').click();
    //     cy.get('#toggle-legend-panel-button').contains('Legend').click();

    //     cy.get('#toggle-editor-panel-button').contains('Edit').click();
    //     cy.get('.chosen-single').contains('Add a new feature');
    //     cy.get('[aria-label="Drag GeoJSON or KML files here to add"]');
    //     cy.get('.map-card-zoom-tool').contains('Edit GeoJSON');
    //     cy.get('.map-card-zoom-tool').contains('Edit Coordinates').should('be.disabled');
    //     cy.get('.map-card-zoom-tool').contains('Add Buffer').should('be.disbaled');

    //     cy.get('.card_component.feature_shape').contains('Feature Shape').scrollIntoView();
    //     cy.get('.select2-selection__rendered').contains('Select an option').click();

    //     cy.get('.select2-results__option').contains('Approx').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Archaeological Event').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Area').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Dispersed Event').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Linear').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Locality').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Named Loc').click();
    //     cy.get('.select2-selection__rendered > .select2-selection__clear').first().click({force: true});
    //     cy.get('.select2-results__option').contains('Unknown').click();

    //     cy.get('#formatType')
    // })

    it('Finish tab specific tests', function () {

        cy.contains('Workflows');
        cy.contains('Add Garden').click();
        cy.wait(2000);

        // Add Garden 1st page
        cy.get('[aria-label="Start new or please select from below"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.wait(2000);
        cy.get('.btn-primary').contains('Open Selected').click();
        cy.wait(2000);

        // Start tab
        cy.wait(2500);
        cy.get('.card_component.resourceid').contains('HA Number');
        cy.get('.form-control').should('be.disabled');
        cy.get('.btn-primary').contains('Next Step').click();

        // Heritage Asset Details tab
        cy.wait(2000);
        cy.get('.workflow-nav-tab').contains('Finish').click();
        cy.wait(2000);

        // Finish tab
        cy.wait(2000);
        cy.get('.form-control.input-lg').first().click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        // cy.get('.input_by_value').contains('Input By');
        // cy.get('.input_by_value').contains('Add new Relationship').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.get('.form-control.input-lg').eq(1).click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        // cy.get('.gar_approved_by_value').contains('Approved By Value');
        // cy.get('.gar_approved_by_value').contains('Add new Relationship').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.get('[aria-label="Provisional"]').contains('Provisional').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Approved').click();
        cy.wait(2000);

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    })
})
