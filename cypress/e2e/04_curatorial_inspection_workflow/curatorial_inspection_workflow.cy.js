describe('Going through the Incident Report', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.widget-input-label').contains('Consultation ID');
        cy.get('.widget-input').should('be.disabled');

        cy.get('.workflow-nav-tab').contains('Asset Details').click();
        cy.get('.workflow-nav-tab').contains('Attendees Details').click();
        cy.get('.workflow-nav-tab').contains('Comments').click();
        cy.get('.workflow-nav-tab').contains('Upload').click();
        cy.get('.workflow-nav-tab').contains('Sign Off').click();

        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.tabbed-workflow-footer').contains('Previous Step');
        cy.get('.tabbed-workflow-footer').contains('Next Step');
        cy.wait(2000);

        cy.get('.control-label').contains('SMR Number');
        cy.get('.select2-selection__rendered').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();

        cy.get('.control-label').contains('B File Reference');
        cy.get('[aria-label="B File Reference"]').click().type('Testing');

        cy.get('.control-label').contains('BDLO Reference').scrollIntoView();
        cy.get('[aria-label="BDLO Reference"]').click().type('Testing');

        cy.get('.control-label').contains('HPRM Reference').scrollIntoView();
        cy.get('[aria-label="HPRM Reference"]').click().type('Testing');

        cy.get('.control-labx').contains('Date Consulted');
        cy.get('[aria-label="Date Consulted"]').click();
        cy.get('.card_component.log_date > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.btn-danger').contains('Undo');
        cy.get('.btn-success').contains('Save and Continue').click();

        // Attendees Details tab
        cy.get('.tabbed-workflow-footer').contains('Previous Step');
        cy.get('.tabbed-workflow-footer').contains('Next Step');
        cy.wait(2000);

        cy.get('.control-label').contains('CWT Area Supervisor');
        cy.get('.card_component.cwt_area_supervisor > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('Archaeologist');
        cy.get('.card_component.archaeologist > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('CWT Area Manager');
        cy.get('.card_component.cwt_area_manager > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('Owner').scrollIntoView();
        cy.get('.card_component.owner > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('HED Staff');
        cy.get('.card_component.hed_staff_value > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.btn-danger').contains('Undo');
        cy.get('.btn-success').contains('Save and Continue').click();

        // Comments tabs
        cy.get('.control-label').contains('Curatorial Description Type');
        cy.get('.select2-selection__rendered').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Comments');
        cy.get('.select2-results__option').contains('Further Recommendations');
        cy.get('.select2-results__option').contains('Items Discussed');
        cy.get('.select2-results__option').contains('Action');

        cy.get('.select2-results__option').contains('Comments').click();
        cy.get('.cke_contents').click().type('Testing');
        cy.get('.btn-success').contains('Add').click();

        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.btn-danger').contains('Undo');
        cy.get('.btn-success').contains('Save and Continue').click();

        // Upload tab
        cy.wait(2000);
        cy.get('.bord-top > .btn').contains('Select Files')
        //cy.get('.media-block').selectFile('cypress/e2e/04_curatorial_inspection_workflow/testFileForUpload.txt');
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign Off
        cy.wait(2000);
        cy.get('.control-labx').contains('Signed Off On');
        cy.get('[aria-label="Signed Off On"]').click();
        cy.get('.input-group-addon').click();

        cy.get('.control-label').contains('Report Submitted By');       
        cy.get('.card_component.report_submitted_by_value > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save').click();

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
    })

     it('Asset Details populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.tabbed-workflow-footer').contains('Previous Step');
        cy.get('.tabbed-workflow-footer').contains('Next Step');
        cy.wait(2000);

        cy.get('.control-label').contains('SMR Number');
        cy.get('.select2-selection__rendered').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();

        cy.get('.control-label').contains('B File Reference');
        cy.get('[aria-label="B File Reference"]').click().type('Testing');

        cy.get('.control-label').contains('BDLO Reference').scrollIntoView();
        cy.get('[aria-label="BDLO Reference"]').click().type('Testing');

        cy.get('.control-label').contains('HPRM Reference').scrollIntoView();
        cy.get('[aria-label="HPRM Reference"]').click().type('Testing');

        cy.get('.control-labx').contains('Date Consulted');
        cy.get('[aria-label="Date Consulted"]').click();
        cy.get('.card_component.log_date > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
     })

      it('Attendees Details populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.btn-primary').contains('Next Step').click();

        // Attendees Details tab
        cy.get('.tabbed-workflow-footer').contains('Previous Step');
        cy.get('.tabbed-workflow-footer').contains('Next Step');
        cy.wait(2000);

        cy.get('.control-label').contains('CWT Area Supervisor');
        cy.get('.card_component.cwt_area_supervisor > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('Archaeologist');
        cy.get('.card_component.archaeologist > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('CWT Area Manager');
        cy.get('.card_component.cwt_area_manager > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('Owner').scrollIntoView();
        cy.get('.card_component.owner > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.control-label').contains('HED Staff');
        cy.get('.card_component.hed_staff_value > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();
    })

     it('Comment tab populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step');

        // Attendees Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step');

        // Comments tabs
        cy.get('.control-label').contains('Curatorial Description Type');
        cy.get('.select2-selection__rendered').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Comments');
        cy.get('.select2-results__option').contains('Further Recommendations');
        cy.get('.select2-results__option').contains('Items Discussed');
        cy.get('.select2-results__option').contains('Action');

        cy.get('.select2-results__option').contains('Comments').click();
        cy.get('.cke_contents').click().type('Testing');
        cy.get('.btn-success').contains('Add').click();
    })

     it('Upload tab and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.widget-input-label').contains('Consultation ID');
        cy.get('.widget-input').should('be.disabled');

        cy.get('.workflow-nav-tab').contains('Asset Details').click();
        cy.get('.workflow-nav-tab').contains('Attendees Details').click();
        cy.get('.workflow-nav-tab').contains('Comments').click();
        cy.get('.workflow-nav-tab').contains('Upload').click();
        cy.get('.workflow-nav-tab').contains('Sign Off').click();

        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step').click();

        // Attendees Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step').click();

        // Comments tabs
        cy.get('.btn-primary').contains('Next Step').click();

        // Upload tab
        cy.wait(2000);
        cy.get('.bord-top > .btn').contains('Select Files')
        //cy.get('.media-block').selectFile('cypress/e2e/04_curatorial_inspection_workflow/testFileForUpload.txt');
    })

     it('Sign Off tab and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Curatorial Inspection').click();

        // Curatorial Inspection opening screen
        cy.get('.select2-selection__rendered').contains('Start new or please select from below');
        cy.get('.btn-success').contains('Start New');
        cy.get('.btn-primary').contains('Open Selected');
        cy.get('.btn-danger').contains('Clear Recents');

        cy.get('.btn-success').contains('Start New').click();
        
        // Start tab
        cy.get('.tabbed-workflow-footer').contains('Save and Continue').click();

        // Asset Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step').click();

        // Attendees Details tab
        cy.get('.tabbed-workflow-footer').contains('Next Step').click();

        // Comments tabs
        cy.get('.btn-primary').contains('Next Step').click();

        // Upload tab
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Sign Off
        cy.wait(2000);
        cy.get('.control-labx').contains('Signed Off On');
        cy.get('[aria-label="Signed Off On"]').click();
        cy.get('.input-group-addon').click();

        cy.get('.control-label').contains('Report Submitted By');       
        cy.get('.card_component.report_submitted_by_value > .widget-wrapper > .form-group > .row > .col-xs-12 > .select2 > .selection > .select2-selection').contains('Add new Relationship').click();
        cy.wait(2000);
        cy.get('.select2-results__option').contains('Test Person').click();

        cy.get('.tabbed-workflow-footer-button-container').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container').contains('Save').click();
    })
})