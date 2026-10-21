describe('Going through the Add Monument Workflow', function () {

    beforeEach(() => {
        cy.login();
        // A cold load fetches ~250 webpack chunks and can exceed the 90s default.
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // File uploads stay commented out: the storage buckets differ per environment.
    // Digital Files: cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });
    // The map is drawn on a mapbox canvas that has no token in this environment, so drawing is not driven here.

    const FOOTER = '.tabbed-workflow-footer-button-container';
    const REAL_OPTIONS = '.select2-results__option:not(.loading-results):not(.select2-results__option--load-more):not(.select2-results__message)';
    const MANY_BUTTONS = '.btn-workflow-tile';
    const TILE_CARDS = '.wf-multi-tile-step-card';

    // Which footer buttons are showing. Undo is hidden in every step of this workflow.
    const footer = ({ previous = true, next = false, save = false }) => {
        const has = (text, present) => cy.get(FOOTER, { timeout: 30000 })
            .should(present ? 'contain.text' : 'not.contain.text', text);
        has('Previous Step', previous);
        has('Next Step', next);
        has('Save and Continue', save);
        has('Undo', false);
    };

    const label = (alias, text) => cy.get(`.card_component.${alias}, .widget-wrapper.${alias}`).should('contain.text', text);

    const selectedText = (alias) => cy.get(`.widget-wrapper.${alias} .select2-selection__rendered`).first().invoke('text');

    // A second pick in a single-select replaces the first.
    const replaceSingle = (alias) => {
        cy.pickCardOption(alias);
        selectedText(alias).then((first) => {
            cy.pickCardOption(alias, 1);
            selectedText(alias).should('not.eq', first);
        });
    };

    // The last page of results offers "Create a new ...", which opens a panel over the footer.
    const pickExistingResource = (selector) => {
        cy.get(selector, { timeout: 60000 }).scrollIntoCentre().click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).not(':contains("Create a new")').first().click();
    };

    const notShown = (selector) => cy.get('body').should(($body) =>
        expect($body.find(selector).filter(':visible'), selector).to.have.length(0));

    const clickMany = (text) => cy.contains(MANY_BUTTONS, text).click();
    const addIsDisabled = () => cy.contains(MANY_BUTTONS, 'Add').should('have.class', 'disabled');
    const addIsEnabled = () => cy.contains(MANY_BUTTONS, 'Add').should('not.have.class', 'disabled');

    it('Offers a list of heritage assets and only enables Open Selected for a chosen one', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Monument', { timeout: 60000 }).click();

        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
        cy.contains('button', 'Open Selected').should('be.disabled');
        notShown('.widget-input-label');
        cy.get('.select2-selection__placeholder', { timeout: 30000 })
            .should('contain.text', 'Start new or please select from below');

        cy.get('.select2-selection').first().click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).should('have.length.greaterThan', 0);
        cy.get(REAL_OPTIONS).first().click();
        cy.get('.select2-selection__rendered').first().invoke('text').should('match', /\S/);
        cy.contains('button', 'Open Selected').should('not.be.disabled');

        cy.get('.select2-selection__clear').first().click();
        cy.contains('button', 'Open Selected').should('be.disabled');
    });

    it('Create new HA and go through the workflow and populate all fields', function () {
        cy.contains('Add Monument', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).click();

        // Start: the HA number is generated into a locked input and the later steps stay locked.
        cy.get('.card_component.resourceid', { timeout: 60000 }).contains('HA Number').should('be.visible');
        cy.get('.card_component.resourceid .form-control', { timeout: 60000 })
            .should('be.disabled')
            .and('not.have.value', '');
        cy.get('.workflow-nav-tab.disabled').should('have.length', 6);
        footer({ previous: false, save: true });
        // Under load the generated number takes a while to reach the tile and enable saving.
        cy.get(FOOTER, { timeout: 60000 })
            .find('button:not([disabled]):not(.disabled)')
            .contains(/Save and Continue|Next Step/, { timeout: 60000 })
            .should('be.visible');
        cy.workflowNext({ timeout: 60000 });

        // Heritage Asset Details
        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('be.visible');
        footer({ next: true });
        cy.get('[aria-label="Site Name"]').type('Testing');
        footer({ save: true });
        // Clearing the text brings Next Step back.
        cy.get('[aria-label="Site Name"]').clear();
        footer({ next: true });
        cy.get('[aria-label="Site Name"]').type('Testing');

        label('monument_type', 'Heritage Asset Type');
        cy.pickCardOption('monument_type');
        cy.get('.widget-wrapper.monument_type .select2-selection__placeholder').should('not.exist');
        cy.pickCardOption('monument_type', 1);
        cy.get('.widget-wrapper.monument_type .select2-selection__choice').should('have.length', 2);

        label('historical_period_type', 'Historical Period');
        cy.pickCardOption('historical_period_type');
        cy.pickCardOption('historical_period_type', 1);
        cy.get('.widget-wrapper.historical_period_type .select2-selection__choice').should('have.length', 2);

        label('condition_type', 'Condition Type');
        replaceSingle('condition_type');
        label('category_type', 'Category Type');
        replaceSingle('category_type');

        label('b_file_reference_number', 'B File');

        // Citations need a Bibliographic Source: the other fields alone cannot be added.
        cy.get('[aria-label="Source Number"]').scrollIntoCentre().type('123456');
        cy.contains(MANY_BUTTONS, 'Clear').should('exist');
        addIsDisabled();
        cy.contains(MANY_BUTTONS, 'Clear').click();
        cy.get('[aria-label="Source Number"]').should('have.value', '');
        cy.get(MANY_BUTTONS).should('not.exist');

        pickExistingResource('[aria-label="Citations, Add new Relationship"]');
        cy.get('[aria-label="Source Number"]').scrollIntoCentre().type('123456');
        cy.get('[aria-label="Page(s)"]').scrollIntoCentre().type('12');
        cy.get('[aria-label="Figs."]').scrollIntoCentre().type('123');
        cy.get('[aria-label="Plate(s)"]').scrollIntoCentre().type('1');
        cy.get('[aria-label="Comment"]').scrollIntoCentre().type('1');
        addIsEnabled();
        clickMany('Add');
        cy.get(TILE_CARDS).should('have.length', 1);
        cy.get(MANY_BUTTONS).should('not.exist');
        cy.get(TILE_CARDS).should('contain.text', 'Remove').and('contain.text', 'Edit');

        cy.get(TILE_CARDS).contains('Edit').click();
        cy.get('[aria-label="Source Number"]').should('have.value', '123456');
        cy.contains(MANY_BUTTONS, 'Save').should('exist');
        cy.contains(MANY_BUTTONS, 'Clear').click();
        cy.get(MANY_BUTTONS).should('not.exist');
        cy.get(TILE_CARDS).should('have.length', 1);

        // "Cross Reference" is relabelled "Other Reference" by default-card-util.
        cy.get('[aria-label="Other Reference"]').scrollIntoCentre().type('XREF-01');

        // Excluded until the licensing workflow is fixed.
        // label('excavation_licence', 'Excavation Licence');
        // cy.pickCardOption('excavation_licence');
        // cy.get('.widget-wrapper.excavation_licence .rr-table-row').should('have.length', 1);
        // cy.get('.widget-wrapper.excavation_licence .rr-table-row button').should('have.length.at.least', 3);
        // cy.pickCardOption('excavation_licence', 1);
        // cy.get('.widget-wrapper.excavation_licence .rr-table-row').should('have.length', 2);
        // cy.get('.widget-wrapper.excavation_licence .rr-table-row').last()
        // .find('button:has(.fa-trash)').click();
        // cy.get('.widget-wrapper.excavation_licence .rr-table-row').should('have.length', 1);

        footer({ save: true });
        cy.workflowNext();

        // Descriptions
        cy.get('.card_component.description_type', { timeout: 60000 }).contains('Description Type').scrollIntoView();
        footer({ next: true });
        cy.get('.wf-multi-tile-step-list-empty').should('exist');
        cy.get(TILE_CARDS).should('not.exist');

        // Both a type and a description are needed before an entry can be added.
        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).first().click();
        cy.contains(MANY_BUTTONS, 'Clear').should('exist');
        addIsDisabled();
        cy.type_ckeditor('editor1', 'test, Description');
        addIsEnabled();
        cy.contains(MANY_BUTTONS, 'Clear').click();
        cy.get(MANY_BUTTONS).should('not.exist');

        cy.get('.card_component.description_type').contains('Select an option').click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).first().click();
        cy.type_ckeditor('editor1', 'test, Description');
        clickMany('Add');
        cy.get(TILE_CARDS).should('have.length', 1);
        cy.get(MANY_BUTTONS).should('not.exist');
        footer({ save: true });

        cy.get('.card_component.description_type').find('.select2-selection').first().click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).eq(1).click();
        cy.type_ckeditor('editor1', 'test, second Description');
        clickMany('Add');
        cy.get(TILE_CARDS).should('have.length', 2);

        cy.get(TILE_CARDS).first().contains('Edit').click();
        cy.contains(MANY_BUTTONS, 'Save').should('exist');
        cy.contains(MANY_BUTTONS, 'Clear').click();
        cy.get(MANY_BUTTONS).should('not.exist');
        cy.get(TILE_CARDS).last().contains('Remove').click();
        cy.get(TILE_CARDS).should('have.length', 1);

        // Next Step saves the added entries; they and earlier values survive a trip back.
        cy.workflowNext();
        cy.get(FOOTER, { timeout: 60000 }).contains('button', 'Previous Step').click();
        cy.get('.card_component.description_type', { timeout: 60000 }).should('exist');
        cy.get(FOOTER).contains('button', 'Previous Step').click();
        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('have.value', 'Testing');
        cy.workflowNext();
        cy.get('.card_component.description_type', { timeout: 60000 }).should('exist');
        cy.workflowNext();

        // Location Details: the address fields the checklist says must not be offered.
        cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('be.visible');
        ['Full Address', 'Sub-Street', 'Building Number Sub-Street', 'Locality', 'Address Status', 'Address Currency']
            .forEach((hidden) => notShown(`[aria-label="${hidden}"]`));
        // Building Number is deliberately hidden on this step.
        cy.get('[aria-label="Building Number"]:visible').should('not.exist');
        footer({ next: true });

        cy.contains('a', 'Help').click();
        cy.get('.card-help-panel:visible').should('contain.text', 'Addresses');
        cy.contains('.card-help-panel:visible', 'Addresses').find('.help-close').click({ force: true });

        cy.get('[aria-label="Building Name"]').type('Testing Labs');
        footer({ save: true });
        // Clearing the text brings Next Step back.
        cy.get('[aria-label="Building Name"]').clear();
        footer({ next: true });
        cy.get('[aria-label="Building Name"]').type('Testing Labs');
        cy.get('[aria-label="Street"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Town or City"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Postcode"]').first().scrollIntoCentre().type('Testing Labs');

        cy.pickRelationshipFirst('County');
        label('townland', 'Townland');
        cy.pickCardOption('townland');
        cy.get('.widget-wrapper.townland .select2-selection__placeholder').should('not.exist');

        cy.get('.council').contains('Select an option').scrollIntoCentre().click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).first().click();
        label('council', 'Council');

        // Area Type and Area Name are both needed before an area can be added.
        label('area_type', 'Area Type');
        label('area_name', 'Area Name');
        cy.pickCardOption('area_type');
        cy.contains(MANY_BUTTONS, 'Clear').should('exist');
        addIsDisabled();
        cy.pickCardOption('area_name');
        addIsEnabled();
        clickMany('Add');
        cy.get(TILE_CARDS).should('have.length', 1);
        cy.get(MANY_BUTTONS).should('not.exist');

        // Irish Grid Reference: a bad coordinate is refused, a good one is previewed.
        const coordinate = () => cy.get('[data-bind*="tm65Val"]', { timeout: 30000 }).filter(':visible').first();
        cy.contains('Long/Lat: -6.2960237,54.566080');
        cy.get('#formatType option').should(($o) => {
            expect($o.toArray().map((o) => o.textContent)).to.include.members(
                ['Alphanumeric TM65', 'Absolute TM65', 'Long/Lat']);
        });
        coordinate().type('ZZ99', { force: true }).blur();
        cy.contains('Input coordinate did not pass validation');
        coordinate().clear({ force: true });
        coordinate().type('J1025169962', { force: true }).blur();
        coordinate().closest('.widget-wrapper').find('#previewPoint').should('have.value', 'J1025169962');

        cy.get('.control-label').contains('Location Description');
        cy.type_ckeditor('editor6', 'test, Location Description');
        cy.get('[aria-label="Unique Building ID"]').scrollIntoCentre().type('01');
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoCentre().type('02');
        cy.get('[aria-label="BU Fusion ID"]').scrollIntoCentre().type('03');
        cy.workflowNext();

        // Map
        cy.contains('Geospatial Coordinates', { timeout: 60000 });
        footer({ next: true });
        cy.pickRelationshipFirst('Feature Shape');
        cy.workflowNext();

        // Digital Files: uploading is optional.
        cy.contains('Upload Documents', { timeout: 60000 });
        cy.contains('Adding documents to this record is optional');
        cy.contains('.bord-top > .btn', 'Select Files').should('not.be.disabled');
        footer({ next: true });
        cy.workflowNext();

        // Finish
        label('reference_number_n1', 'Reference Code');
        cy.get('[aria-label="Reference Code"]', { timeout: 60000 })
            .should('be.disabled')
            .and('not.have.value', '');
        label('input_date_value', 'Input Date');
        label('gar_approved_date_value', 'Approved Date');
        label('status_type_n1', 'Status');
        replaceSingle('status_type_n1');

        // Opening a date picker puts today's date in; the calendar icon closes it again.
        cy.get('.card_component.input_date_value input.form-control').should('have.value', '');
        cy.get('.card_component.input_date_value input.form-control').click();
        cy.get('.card_component.input_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.card_component.input_date_value input.form-control').invoke('val').should('match', /^\d{2}-\d{2}-\d{4}$/);
        cy.get('.card_component.gar_approved_date_value input.form-control').should('have.value', '');
        cy.get('.card_component.gar_approved_date_value input.form-control').click();
        cy.get('.card_component.gar_approved_date_value > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon').click();
        cy.get('.card_component.gar_approved_date_value input.form-control').invoke('val').should('match', /^\d{2}-\d{2}-\d{4}$/);

        // NISMR numbering: a map sheet has to be chosen before an SMR can be generated.
        cy.contains('NISMR Numbering');
        cy.get('[aria-label="Generated SMR"]').should('be.disabled');
        cy.contains('button', 'Generate SMR').should('be.disabled');
        cy.pickCardOption('nismr_numbering_type');
        cy.contains('button', 'Generate SMR').should('not.be.disabled').click();
        cy.get('[aria-label="Generated SMR"]', { timeout: 30000 }).should('not.have.value', '');

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.location('pathname', { timeout: 60000 }).should('not.include', '/add-monument-workflow');
    });
});
