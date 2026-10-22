describe('Going through the Add Garden Workflow', function () {

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
    const DATE_FORMAT = /^\d{2}-\d{2}-\d{4}$/;
    const CITATION = '[aria-label="Source Number"]';
    const DESCRIPTION = '.widget-wrapper.description_type';
    const AREA = '.widget-wrapper.area_type';
    const GENERATED = '[aria-label="Generated Historic Parks and Garden"]';
    const COUNTIES = ['Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone'];
    const COUNTY_PREFIX = { Antrim: 'AN', Armagh: 'A', Down: 'D', Fermanagh: 'F', Londonderry: 'L', Tyrone: 'T' };

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

    const openDropdown = (alias) => {
        cy.scrollToWidget(alias);
        cy.get(`.widget-wrapper.${alias} .select2-selection`).first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    };

    // The dropdown lists these options (and exactly `count` of them when given).
    const offers = (alias, expected, count) => {
        openDropdown(alias);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).should(($o) => {
            const texts = $o.toArray().map((o) => o.textContent.trim());
            expect(texts).to.include.members(expected);
            if (count) expect(texts).to.have.length(count);
        });
        cy.get('body').type('{esc}');
        cy.get('.select2-dropdown').should('not.exist');
    };

    const pickByText = (alias, text) => {
        openDropdown(alias);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(text).click();
    };

    // The last page of results offers "Create a new ...", which opens a panel over the footer.
    const pickExistingResource = (selector) => {
        cy.get(selector, { timeout: 60000 }).scrollIntoCentre().click();
        cy.get(REAL_OPTIONS, { timeout: 30000 }).not(':contains("Create a new")').first().click();
    };

    // Citations and Descriptions share one step, so the Add/Clear buttons and the entry list are
    // found through the card that holds the given widget.
    const block = (anchor) => cy.get(anchor).first().closest('.workflow-component').parent();
    const manyButton = (anchor, text) => block(anchor).contains(MANY_BUTTONS, text);
    const noManyButtons = (anchor) => block(anchor).find(MANY_BUTTONS).should('not.exist');
    const addIsDisabled = (anchor) => manyButton(anchor, 'Add').should('have.class', 'disabled');
    const addIsEnabled = (anchor) => manyButton(anchor, 'Add').should('not.have.class', 'disabled');
    const addEntry = (anchor) => {
        addIsEnabled(anchor);
        manyButton(anchor, 'Add').click();
    };
    const entries = (anchor) => block(anchor).find(TILE_CARDS);

    const dateInput = (alias) => cy.get(`.widget-wrapper.${alias} input.form-control`).first();
    const dateAddon = (alias) => cy.get(`.card_component.${alias} > .row > .form-group > .col-xs-12 > :nth-child(1) > .input-group > .input-group-addon`);

    // Opens an existing garden through the launcher's search.
    const openGarden = (search, optionText) => {
        cy.contains('Add Garden', { timeout: 60000 }).click();
        cy.get('.select2-selection', { timeout: 60000 }).first().click();
        cy.select2Search(search);
        cy.get(REAL_OPTIONS, { timeout: 30000 }).contains(optionText).click();
        cy.contains('button', 'Open Selected').click();
        cy.get('.card_component.resourceid', { timeout: 60000 }).contains('HA Number').should('be.visible');
    };

    let generatedNumber;

    it('Offers a list of heritage assets and only enables Open Selected for a chosen one', function () {
        cy.contains('Workflows').should('be.visible');
        cy.contains('Add Garden', { timeout: 60000 }).click();

        cy.contains('button', 'Start New', { timeout: 60000 }).should('be.visible');
        cy.contains('button', 'Open Selected').should('be.disabled');
        cy.get('.widget-input-label').should('not.exist');
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

    const startNew = () => {
        cy.contains('Add Garden', { timeout: 60000 }).click();
        cy.contains('button', 'Start New', { timeout: 60000 }).click();
        cy.get('.card_component.resourceid', { timeout: 60000 }).contains('HA Number').should('be.visible');
    };

    // A fresh garden, advanced with Next Step to the named step; nothing is saved on the way.
    // Moving on before the last card of a step has rendered breaks the step, so each is awaited.
    const STEP_LOADED = [
        () => cy.get('.widget-wrapper.description_type', { timeout: 60000 }),
        () => cy.get('[aria-label="BU Fusion ID"]', { timeout: 60000 }),
        () => cy.contains('Geospatial Coordinates', { timeout: 60000 }),
        () => cy.contains('Upload Documents', { timeout: 60000 }),
        () => cy.get(GENERATED, { timeout: 60000 }),
    ];
    const startNewAt = (stepsForward) => {
        startNew();
        for (let i = 0; i < stepsForward; i++) {
            cy.workflowNext();
            STEP_LOADED[i]();
        }
    };

    it('Create new HA and go through the workflow and populate all fields', function () {
        startNew();

        // Start: the HA number is generated into a locked input and the later steps stay locked.
        cy.get('.card_component.resourceid .form-control', { timeout: 60000 })
            .should('be.disabled')
            .and(($input) => expect($input.val()).to.match(/^HA\/\d+$/));
        cy.get('.workflow-nav-tab.disabled').should('have.length', 5);
        footer({ previous: false, save: true });
        cy.workflowNext();

        // Heritage Asset Details
        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('be.visible').and('be.enabled');
        footer({ next: true });
        cy.get('[aria-label="Site Name"]').type('Testing');
        footer({ save: true });
        // Clearing the text brings Next Step back.
        cy.get('[aria-label="Site Name"]').clear();
        footer({ next: true });
        cy.get('[aria-label="Site Name"]').type('Testing');

        cy.pickCardOption('monument_type');
        cy.pickCardOption('land_use_classification', 'Arable');
        pickExistingResource('.widget-wrapper.bibliographic_source_citation .select2-selection');
        cy.get(CITATION).scrollIntoCentre().type('123456');
        cy.get('[aria-label="Page(s)"]').scrollIntoCentre().type('12');
        cy.get('[aria-label="Figs."]').scrollIntoCentre().type('123');
        cy.get('[aria-label="Plate(s)"]').scrollIntoCentre().type('1');
        cy.get('[aria-label="Comment"]').scrollIntoCentre().type('1');
        addEntry(CITATION);
        entries(CITATION).should('have.length', 1);
        cy.pickCardOption('description_type');
        cy.typeRichText('description', 'test, Description');
        addEntry(DESCRIPTION);
        entries(DESCRIPTION).should('have.length', 1);
        cy.workflowNext();

        // Location Details
        cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('be.visible').and('be.enabled');
        cy.get('[aria-label="Building Name"]').type('Testing Labs');
        cy.get('[aria-label="Street"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Town or City"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Postcode"]').first().scrollIntoCentre().type('Testing Labs');
        pickByText('county_value', 'Antrim');
        cy.pickCardOption('townland');
        cy.pickCardOption('council');
        cy.pickCardOption('area_type');
        cy.pickCardOption('area_name');
        addEntry(AREA);
        entries(AREA).should('have.length', 1);
        cy.typeRichText('location_description', 'test, Location Description');
        cy.get('[aria-label="Unique Building ID"]').scrollIntoCentre().type('01');
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoCentre().type('02');
        cy.get('[aria-label="BU Fusion ID"]').scrollIntoCentre().type('03');
        footer({ save: true });
        cy.workflowNext();

        // Map. Values survive a trip back one step.
        cy.contains('Geospatial Coordinates', { timeout: 60000 });
        footer({ next: true });
        cy.get(FOOTER).contains('button', 'Previous Step').click();
        cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('have.value', 'Testing Labs');
        selectedText('county_value').should('contain', 'Antrim');
        cy.get('[aria-label="Unique Building ID"]').should('have.value', '01');
        entries(AREA).should('have.length', 1);
        cy.workflowNext();
        cy.contains('Geospatial Coordinates', { timeout: 60000 });
        cy.pickCardOption('feature_shape');
        footer({ save: true });
        cy.workflowNext();

        // Digital Files: uploading is optional.
        cy.contains('Upload Documents', { timeout: 60000 });
        footer({ next: true });
        cy.workflowNext();

        // Finish
        cy.get('[aria-label="Reference Code"]', { timeout: 60000 })
            .should('be.disabled')
            .and('not.have.value', '');
        cy.pickCardOption('status_type_n1');
        cy.pickCalendarDay('input_date_value', 1);
        cy.pickCalendarDay('gar_approved_date_value', 1);
        cy.contains('button', 'Generate').should('not.be.disabled').click();
        cy.get(GENERATED, { timeout: 30000 }).invoke('val').should('match', /^AN-\d{3}$/).then((number) => {
            generatedNumber = number;
        });

        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();
        cy.get('.workflow-select-card', { timeout: 60000 }).should('have.length.greaterThan', 0);
    });

    it('Heritage Asset Details step: types, citations and descriptions', function () {
        startNewAt(1);
        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('be.visible').and('be.enabled');
        footer({ next: true });
        label('monument_type', 'Heritage Asset Type');
        label('land_use_classification', 'Land Use Classification');

        // Descriptions: a type and a description are both needed before an entry can be added.
        label('description_type', 'Description Type');
        label('description', 'Description');
        block(DESCRIPTION).find('.wf-step-multi-tile-container h4').should('have.text', 'Descriptions');
        entries(DESCRIPTION).should('not.exist');
        block(DESCRIPTION).find('.wf-multi-tile-step-list-empty').should('exist');
        noManyButtons(DESCRIPTION);

        replaceSingle('description_type');
        manyButton(DESCRIPTION, 'Clear').should('exist');
        addIsDisabled(DESCRIPTION);
        cy.get('.widget-wrapper.description_type .select2-selection__clear').click();
        cy.get('.widget-wrapper.description_type .select2-selection__placeholder').should('exist');
        noManyButtons(DESCRIPTION);
        footer({ next: true });

        cy.typeRichText('description', 'test, Description');
        manyButton(DESCRIPTION, 'Clear').should('exist');
        addIsDisabled(DESCRIPTION);
        footer({ next: true });
        manyButton(DESCRIPTION, 'Clear').click();
        noManyButtons(DESCRIPTION);

        cy.pickCardOption('description_type');
        cy.typeRichText('description', 'test, Description two');
        addIsEnabled(DESCRIPTION);
        manyButton(DESCRIPTION, 'Clear').click();
        noManyButtons(DESCRIPTION);
        cy.get('.widget-wrapper.description_type .select2-selection__placeholder').should('exist');

        cy.pickCardOption('description_type');
        cy.typeRichText('description', 'test, Description three');
        addEntry(DESCRIPTION);
        entries(DESCRIPTION).should('have.length', 1).and('contain.text', 'test, Description');
        entries(DESCRIPTION).should('contain.text', 'Remove').and('contain.text', 'Edit');
        noManyButtons(DESCRIPTION);
        footer({ save: true });

        cy.pickCardOption('description_type', 1);
        cy.typeRichText('description', 'test, second Description');
        addEntry(DESCRIPTION);
        entries(DESCRIPTION).should('have.length', 2);

        // The newest entry is listed first, so the oldest is the last. Editing loads it back into the inputs; Save overwrites it, Clear abandons it.
        entries(DESCRIPTION).last().contains('Edit').click();
        manyButton(DESCRIPTION, 'Save').should('exist');
        manyButton(DESCRIPTION, 'Clear').should('exist');
        cy.typeRichText('description', 'test, changed Description');
        manyButton(DESCRIPTION, 'Save').click();
        entries(DESCRIPTION).should('have.length', 2);
        entries(DESCRIPTION).last().should('contain.text', 'changed Description');
        noManyButtons(DESCRIPTION);

        entries(DESCRIPTION).last().contains('Edit').click();
        manyButton(DESCRIPTION, 'Clear').click();
        noManyButtons(DESCRIPTION);
        entries(DESCRIPTION).should('have.length', 2);

        entries(DESCRIPTION).last().contains('Remove').click();
        entries(DESCRIPTION).should('have.length', 1);
        entries(DESCRIPTION).first().contains('Remove').click();
        entries(DESCRIPTION).should('not.exist');
        block(DESCRIPTION).find('.wf-multi-tile-step-list-empty').should('exist');
        footer({ next: true });

        // Citations need a Bibliographic Source: the other fields alone cannot be added.
        block(CITATION).find('.wf-step-multi-tile-container h4').should('have.text', 'Citations');
        entries(CITATION).should('not.exist');
        cy.get(CITATION).scrollIntoCentre().type('123456');
        manyButton(CITATION, 'Clear').should('exist');
        addIsDisabled(CITATION);
        manyButton(CITATION, 'Clear').click();
        cy.get(CITATION).should('have.value', '');
        noManyButtons(CITATION);

        // The selection is listed with info, edit and delete controls; deleting it empties the field.
        pickExistingResource('.widget-wrapper.bibliographic_source_citation .select2-selection');
        cy.get('.widget-wrapper.bibliographic_source_citation .rr-table-row').should('have.length', 1);
        cy.get('.widget-wrapper.bibliographic_source_citation .rr-table-row button').should('have.length.at.least', 2);
        cy.get('.widget-wrapper.bibliographic_source_citation .rr-table-row button:has(.fa-trash)').click();
        cy.get('.widget-wrapper.bibliographic_source_citation .rr-table-row').should('not.exist');
        // Add and Clear stay; Add is disabled again until a source is chosen.
        manyButton(CITATION, 'Clear').should('exist');
        addIsDisabled(CITATION);
        pickExistingResource('.widget-wrapper.bibliographic_source_citation .select2-selection');

        cy.get(CITATION).scrollIntoCentre().should('have.attr', 'placeholder', 'Enter text').type('123456');
        cy.get('[aria-label="Page(s)"]').scrollIntoCentre().type('12');
        cy.get('[aria-label="Figs."]').scrollIntoCentre().type('123');
        cy.get('[aria-label="Plate(s)"]').scrollIntoCentre().type('1');
        cy.get('[aria-label="Comment"]').scrollIntoCentre().type('1');
        addIsEnabled(CITATION);
        addEntry(CITATION);
        entries(CITATION).should('have.length', 1);
        noManyButtons(CITATION);
        entries(CITATION).should('contain.text', 'Remove').and('contain.text', 'Edit');
        cy.get(CITATION).should('have.value', '');

        entries(CITATION).contains('Edit').click();
        cy.get(CITATION).should('have.value', '123456');
        cy.get('[aria-label="Page(s)"]').should('have.value', '12');
        manyButton(CITATION, 'Save').should('exist');
        cy.get(CITATION).clear().type('654321');
        manyButton(CITATION, 'Save').click();
        entries(CITATION).should('have.length', 1).and('contain.text', '654321');
        noManyButtons(CITATION);
        entries(CITATION).contains('Edit').click();
        manyButton(CITATION, 'Clear').click();
        noManyButtons(CITATION);
        entries(CITATION).should('have.length', 1);

        // Types and land uses take several values, each removable.
        cy.pickCardOption('monument_type');
        cy.get('.widget-wrapper.monument_type .select2-selection__placeholder').should('not.exist');
        cy.pickCardOption('monument_type', 'Charnel House');
        cy.get('.widget-wrapper.monument_type .select2-selection__choice').should('have.length', 2);
        cy.get('.widget-wrapper.monument_type .select2-selection__choice__remove').last().click();
        cy.get('.widget-wrapper.monument_type .select2-selection__choice').should('have.length', 1);
        cy.get('body').type('{esc}');

        cy.pickCardOption('land_use_classification', 'Arable');
        cy.pickCardOption('land_use_classification', 'Army barracks');
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice').should('have.length', 2);
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice__remove').last().click();
        cy.get('.widget-wrapper.land_use_classification .select2-selection__choice').should('have.length', 1);
        cy.get('body').type('{esc}');
    });

    it('Location Details step: address, areas, county and identifiers', function () {
        startNewAt(2);
        cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('be.visible').and('be.enabled');
        ['Full Address', 'Sub-Street', 'Building Number Sub-Street', 'Locality', 'Address Status', 'Address Currency']
            .forEach((hidden) => cy.get(`[aria-label="${hidden}"]`).filter(':visible').should('not.exist'));
        // Building Number is deliberately hidden on this step.
        cy.get('[aria-label="Building Number"]:visible').should('not.exist');
        footer({ next: true });

        cy.contains('a', 'Help').click();
        cy.get('.card-help-panel:visible').should('contain.text', 'Addresses');
        cy.get('.card-help-panel:visible .help-close').click({ force: true });

        // Area Type and Area Name are both needed before an area can be added.
        label('area_type', 'Area Type');
        label('area_name', 'Area Name');
        block(AREA).find('.wf-step-multi-tile-container h4').should('have.text', 'Location Details');
        entries(AREA).should('not.exist');
        offers('area_type', ['Barony', 'District', 'Parish', 'Ward'], 4);
        replaceSingle('area_type');
        manyButton(AREA, 'Clear').should('exist');
        addIsDisabled(AREA);
        cy.get('.widget-wrapper.area_type .select2-selection__clear').click();
        noManyButtons(AREA);
        footer({ next: true });

        cy.pickCardOption('area_name');
        manyButton(AREA, 'Clear').should('exist');
        addIsDisabled(AREA);
        cy.pickCardOption('area_type');
        addIsEnabled(AREA);
        manyButton(AREA, 'Clear').click();
        noManyButtons(AREA);
        cy.get('.widget-wrapper.area_type .select2-selection__placeholder').should('exist');
        cy.get('.widget-wrapper.area_name .select2-selection__placeholder').should('exist');

        cy.pickCardOption('area_type');
        cy.pickCardOption('area_name');
        addEntry(AREA);
        entries(AREA).should('have.length', 1);
        noManyButtons(AREA);
        entries(AREA).should('contain.text', 'Remove').and('contain.text', 'Edit');
        footer({ save: true });

        entries(AREA).first().contains('Edit').click();
        manyButton(AREA, 'Save').should('exist');
        manyButton(AREA, 'Clear').should('exist');
        selectedText('area_type').should('match', /\S/);
        cy.pickCardOption('area_type', 1);
        manyButton(AREA, 'Save').click();
        entries(AREA).should('have.length', 1);
        noManyButtons(AREA);

        cy.pickCardOption('area_type', 2);
        cy.pickCardOption('area_name', 2);
        addEntry(AREA);
        entries(AREA).should('have.length', 2);
        entries(AREA).last().contains('Remove').click();
        entries(AREA).first().contains('Remove').click();
        entries(AREA).should('not.exist');
        footer({ next: true });

        cy.get('[aria-label="Building Name"]').scrollIntoCentre().should('have.attr', 'placeholder', 'Enter text');
        cy.get('[aria-label="Building Name"]').type('Testing Labs');
        footer({ save: true });
        // Clearing the text brings Next Step back.
        cy.get('[aria-label="Building Name"]').clear();
        footer({ next: true });
        cy.get('[aria-label="Building Name"]').type('Testing Labs');
        cy.get('[aria-label="Street"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Town or City"]').first().scrollIntoCentre().type('Testing Labs');
        cy.get('[aria-label="Postcode"]').first().scrollIntoCentre().type('Testing Labs');

        // County: six counties, one selection that a second pick replaces.
        label('county_value', 'County');
        offers('county_value', COUNTIES, 6);
        pickByText('county_value', 'Down');
        pickByText('county_value', 'Antrim');
        selectedText('county_value').should('contain', 'Antrim').and('not.contain', 'Down');
        cy.get('.widget-wrapper.county_value .select2-selection__choice').should('not.exist');
        cy.get('.widget-wrapper.county_value .select2-selection__clear').should('exist');

        label('townland', 'Townland');
        cy.pickCardOption('townland');
        cy.get('.widget-wrapper.townland .select2-selection__placeholder').should('not.exist');
        // Townland holds several values; the checklist's single-value expectation is out of date.
        cy.pickCardOption('townland', 1);
        cy.get('.widget-wrapper.townland .select2-selection__choice').should('have.length', 2);

        label('council', 'Council');
        offers('council', ['LA06 - Ards and North Down Borough Council'], 11);
        replaceSingle('council');
        cy.get('.widget-wrapper.council .select2-selection__clear').should('exist');

        // Irish Grid Reference: a bad coordinate is refused, a good one is previewed.
        const coordinate = () => cy.get('[data-bind*="tm65Val"]', { timeout: 30000 }).filter(':visible').first();
        cy.contains('Long/Lat: -6.2960237,54.566080').scrollIntoView();
        cy.get('#formatType option').should(($o) => {
            expect($o.toArray().map((o) => o.textContent)).to.include.members(
                ['Alphanumeric TM65', 'Absolute TM65', 'Long/Lat']);
        });
        coordinate().type('ZZ99', { force: true }).blur();
        cy.contains('Input coordinate did not pass validation. Please check it is in one of the approved formats and try again');
        coordinate().clear({ force: true });
        coordinate().type('J1025169962', { force: true }).blur();
        coordinate().closest('.widget-wrapper').find('#previewPoint').should('have.value', 'J1025169962');

        label('location_description', 'Location Description');
        cy.typeRichText('location_description', 'test, Location Description');

        // The ID fields stop accepting characters at their limits.
        label('unique_building_id_number', 'Unique Building ID');
        label('lp_fusion_id_number', 'LP Fusion ID');
        label('bu_fusion_id_number', 'BU Fusion ID');
        cy.get('[aria-label="Unique Building ID"]').scrollIntoCentre().type('1234567890123').should('have.value', '123456789012');
        cy.get('[aria-label="LP Fusion ID"]').scrollIntoCentre().type('a'.repeat(40)).should('have.value', 'a'.repeat(36));
        cy.get('[aria-label="BU Fusion ID"]').scrollIntoCentre().type('b'.repeat(40)).should('have.value', 'b'.repeat(36));
        footer({ save: true });
    });

    it('Map and Digital Files steps', function () {
        startNewAt(3);
        cy.contains('Geospatial Coordinates', { timeout: 60000 });
        footer({ next: true });
        ['Basemap', 'Overlays', 'Legend'].forEach((tab) => {
            cy.contains('.workbench-card-sidebar-tab', tab).should('exist');
        });
        label('feature_shape', 'Feature Shape');
        offers('feature_shape', ['Dispersed Event', 'Point', 'Unknown'], 9);
        replaceSingle('feature_shape');
        cy.get('.widget-wrapper.feature_shape .select2-selection__clear').should('exist');
        footer({ save: true });
        cy.workflowNext();

        // Digital Files: uploading is optional.
        cy.contains('Upload Documents', { timeout: 60000 });
        cy.contains('Adding documents to this record is optional');
        cy.contains('.bord-top > .btn', 'Select Files').should('not.be.disabled');
        footer({ next: true });
    });

    it('Finish step: sign-off, status, dates and numbering', function () {
        startNewAt(5);
        label('reference_number_n1', 'Reference Code');
        cy.get('[aria-label="Reference Code"]', { timeout: 60000 })
            .should('be.disabled')
            .and('not.have.value', '');
        label('input_date_value', 'Input Date');
        label('gar_approved_date_value', 'Approved Date');
        label('status_type_n1', 'Status');

        // Input By and Approved By are sign-off rows that admin cannot sign.
        label('input_by_value', 'Input By');
        label('gar_approved_by_value', 'Approved By');
        cy.get('.input_by_value', { timeout: 30000 }).should('contain.text', 'You do not have permission to sign off');
        cy.get('.gar_approved_by_value').should('contain.text', 'You do not have permission to sign off');

        offers('status_type_n1', ['Provisional', 'Approved'], 2);
        replaceSingle('status_type_n1');
        cy.get('.widget-wrapper.status_type_n1 .select2-selection__clear').should('exist');

        // Opening a date picker puts today's date in; the calendar icon closes it again.
        ['input_date_value', 'gar_approved_date_value'].forEach((alias) => {
            dateInput(alias).should('have.value', '');
            dateInput(alias).click();
            dateAddon(alias).click();
            dateInput(alias).invoke('val').should('match', DATE_FORMAT);

            // Dates after today cannot be picked.
            dateInput(alias).click({ force: true });
            cy.get('.bootstrap-datetimepicker-widget td.day.disabled:visible').should('have.length.greaterThan', 0);
            dateAddon(alias).click();

            cy.get(`.widget-wrapper.${alias}`).contains('button', 'Clear').click();
            dateInput(alias).should('have.value', '');

            cy.pickCalendarDay(alias, 1);
            dateInput(alias).invoke('val').should('match', /^01-/);
            cy.pickCalendarDay(alias, 2);
            dateInput(alias).invoke('val').should('match', /^02-/);
        });

        // Without a county there is nothing to number a garden from.
        cy.contains('Generated Historic Parks and Garden');
        cy.get(GENERATED).should('be.disabled');
        cy.contains('No county was selected on the Location Details step.').scrollIntoCentre().should('be.visible');
        cy.contains('button', 'Generate').should('be.disabled');
    });

    it('Reopens a completed garden by its generated number with its saved values', function () {
        if (!generatedNumber) this.skip();
        openGarden(generatedNumber, generatedNumber);
        cy.workflowNext();
        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('have.value', 'Testing');
        cy.get('.workflow-nav-tab').contains('Finish').click();
        cy.get(GENERATED, { timeout: 60000 }).should('have.value', generatedNumber);
    });

    it('Opens an existing garden with all steps available', function () {
        openGarden('Garden Test', 'HA/07 Garden Test');
        cy.get('.card_component.resourceid .form-control', { timeout: 60000 }).should('be.disabled').and('have.value', 'HA/07');
        cy.workflowNext();

        cy.get('[aria-label="Site Name"]', { timeout: 60000 }).should('have.value', 'Garden Test');
        footer({ next: true });

        cy.get('.workflow-nav-tab').contains('Location Details').click();
        cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('be.visible');
        cy.get('.workflow-nav-tab').contains('Finish').click();
        cy.get('[aria-label="Reference Code"]', { timeout: 60000 }).should('be.disabled');
    });

    // Antrim is generated in the full walk above; the garden gets a different county each time.
    COUNTIES.slice(1).forEach((county) => {
        it(`Generates a ${COUNTY_PREFIX[county]}- number for a garden in ${county}`, function () {
            openGarden('Garden Test', 'HA/08 Garden Test');
            cy.workflowNext();

            cy.get('.workflow-nav-tab').contains('Location Details').click();
            cy.get('[aria-label="Building Name"]', { timeout: 60000 }).should('be.visible');
            // HA/08 is reused across runs, so it may already hold this county; then nothing changes and nothing saves.
            selectedText('county_value').then((before) => {
                pickByText('county_value', county);
                selectedText('county_value').should('contain', county);
                // The number is worked out from the saved county, so the save has to land first.
                if (before.includes(county)) {
                    cy.workflowNext();
                } else {
                    cy.watchTileSaves();
                    cy.workflowNext();
                    cy.waitForTileSaves(1);
                }
            });

            cy.get('.workflow-nav-tab').contains('Finish').click();
            cy.contains('button', 'Generate', { timeout: 60000 }).should('not.be.disabled').click();
            cy.get(GENERATED, { timeout: 30000 })
                .invoke('val')
                .should('match', new RegExp(`^${COUNTY_PREFIX[county]}-\\d{3}$`));
        });
    });
});
