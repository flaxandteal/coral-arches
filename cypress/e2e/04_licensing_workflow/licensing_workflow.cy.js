describe('Going through the licensing Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    // Launch the licensing workflow and advance to the Application Details tab.
    // "Start New" drops straight onto step 1 of 11, "Initialise Excavation
    // Licence" (info-only), so there is exactly ONE forward step to take before
    // the Application Details fields appear. Stepping twice here used to fire
    // licence-initial-step's save a second time before the first had finished,
    // which 500s on POST /api/tiles (the tile ids are still being allocated),
    // raises "Something went wrong ... during initialization" and lands the
    // workflow on Location Details (3/11) with no planning_reference card.
    function startLicensing() {
        cy.get('[href="/plugins/open-workflow?workflow-slug=licensing-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(2000);
        cy.get('[style="display: flex"] > .fa > span').click();
        cy.wait(4000);
        // Initialisation runs server-side and gets slower as licences
        // accumulate, so it can take minutes on a loaded machine or a
        // long-lived database; its forward button stays disabled until it
        // finishes. On a fresh CI database it takes ~13s, but the tests below
        // run after this spec's first test has created a whole licence, so give
        // it plenty of room. If it still times out here, suspect the
        // environment (memory, accumulated Licence resources), not the spec.
        cy.workflowNext({ timeout: 360000 });     // Initialise -> Application Details
        cy.get('.card_component.planning_reference', { timeout: 90000 }).should('exist');
        cy.wait(2000);
    }

    it('Run through all licensing workflow fields', function () {
        startLicensing();

        cy.typeInCard('planning_reference', 'test ref');
        cy.typeInCard('cm_reference_number', 'cm num');
        cy.pickRelationshipFirst('Applicant');
        cy.wait(1000);
        cy.pickRelationshipFirst('Nominated Excavation Director(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Employing Body/Bodies');
        cy.wait(1000);
        cy.fillDate('received_date_n1');
        cy.fillDate('acknowledged_date_n1');
        cy.fillDate('proposed_start_date_n1');
        cy.get('.card_component.duration input').filter(':visible').first().type('2');
        cy.fillDate('actual_start_date');
        cy.fillDate('actual_end_date');
        cy.type_ckeditor('editor3', 'test, Description');
        cy.wait(2000);
        cy.get('[aria-label="Stage of Application, Received"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        // issue with multi select 
        // cy.get('[label="Excavation Reason(s)"]').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.get('[type="radio"]').first().click({force: true});
        // Use workflowNext() rather than clicking the footer selector directly:
        // it waits for the step counter to change, so the next tab's cards are
        // guaranteed to be on screen. The raw click returned while the
        // Application Details save was still in flight and the spec then looked
        // for Location Details cards on a page still showing 2/11.
        cy.workflowNext();          // Application Details -> Location Details
        cy.wait(4000);

        // Location Details address fields.
        cy.typeInCard('building_name_value', 'test building');
        cy.typeInCard('street_value', 'street');
        cy.typeInCard('town_or_city_value', 'city');
        cy.typeInCard('postcode_value', 'bt561ag');
        cy.get('.council').filter(':visible').first().scrollIntoView();
        cy.get('.council').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Causeway Coast and Glens').click();
        cy.get(':nth-child(3) > span > ul > :nth-child(1)').click();
        cy.get('#coordinatePoint').clear('J1025169962');
        cy.get('#coordinatePoint').type('J1025169962');
        cy.type_ckeditor('editor7', 'test, Description');

        cy.workflowNext();          // Location Details   -> Geospatial Details
        cy.wait(4000);
        cy.workflowNext();          // Geospatial Details -> Additional Files
        cy.wait(4000);
        cy.setBooleanTrue('application_form');
        cy.setBooleanTrue('pow');
        cy.setBooleanTrue('council_letter');
        cy.setBooleanTrue('developer_funding_form');
        cy.workflowNext();          // Additional Files   -> Communications
        cy.wait(4000);
        cy.get('.col-xs-12 > .form-control').filter(':visible').first().clear({force: true});
        cy.get('.col-xs-12 > .form-control').filter(':visible').first().type('test', {force: true});
        cy.workflowNext();          // Communications     -> Record Decision
        cy.wait(4000);

        cy.get('[aria-label="Cur Grade E Decision, Grant licence"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        // this select doesn't work for some reason 
        // cy.get('[aria-label="Cur Grade D Decision, Approved"]').click();
        // cy.wait(2000);
        // cy.get('.select2-results__option').first().click();
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.type_ckeditor('editor11', 'test, Description');

        // No issue_date widget on this workflow — Record Decision ends at the
        // decision notes, then the (card-less) Letter tab, then Amendments.
        cy.workflowNext();          // Record Decision    -> Letter
        cy.wait(4000);
        cy.workflowNext();          // Letter             -> Amendments
        cy.wait(6000);

        cy.pickRelationshipFirst('Transfer of Licence');
        cy.wait(1000);
        cy.pickRelationshipFirst('New Applicant');
        cy.wait(1000);
        cy.pickRelationshipFirst('Former Employing Body');
        cy.wait(1000);
        cy.fillDate('date_requested_value');
        // Match the decision widgets by aria-label prefix — the label carries
        // the current value, which differs from the hard-coded one.
        cy.pickDomainByLabel('Cur Grade E Decision', 'Do not approve transfer');
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.pickDomainByLabel('Cur Grade D Decision', 'Decline');
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);

        cy.fillDate('issued_date_value');
        cy.workflowNext();          // Amendments         -> Final Report
        cy.wait(4000);

        cy.get('.col-xs-12 > .form-control').filter(':visible').first().clear({force: true});
        cy.get('.col-xs-12 > .form-control').filter(':visible').first().type('test', {force: true});
        cy.fillDate('report_submitted');
        cy.get(':nth-child(1) > .workflow-component > .workflow-component-element').click({force: true});
        // Classification Type defaults to "Unclassified", so pick by card
        // rather than by a hard-coded aria-label value.
        cy.pickCardOption('classification_type');
        cy.wait(1000);
        cy.fillDate('classification_date_value');
        cy.pickRelationshipFirst('Classified By');
        cy.wait(1000);
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('[type="radio"]').first().click({force: true});
        cy.get('[type="radio"]').first().click({force: true});
        cy.fillDate('date_reported_value');
        // NB: click() takes a SINGLE options object — click({force:true},
        // {multiple:true}) is read as (position, options), so `multiple` is
        // dropped and the call throws on a multi-element subject.
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success')
            .click({ force: true, multiple: true });
        cy.wait(2000);
        // Finish the workflow. Target the footer button explicitly — a blanket
        // `.btn-success` click races the completion re-render and detaches.
        cy.get('.tabbed-workflow-footer-button-container')
            .contains(/Save and Complete|Save and Continue|Next Step/)
            .click({ force: true });
        cy.wait(4000);
        // Confirm the completion alert if one is shown.
        cy.get('body').then(($b) => {
            if ($b.find('.ep-form-alert-buttons .btn').length) {
                cy.get('.ep-form-alert-buttons .btn').first().click();
            }
        });
    })

    it('Should transfer licence', function () {
        startLicensing();

        cy.typeInCard('planning_reference', 'test ref');
        cy.typeInCard('cm_reference_number', 'cm num');
        cy.pickRelationshipByName('Applicant', 'John Smith');
        cy.wait(1000);
        cy.pickRelationshipByName('Nominated Excavation Director(s)', 'John Smith');
        cy.wait(1000);
        cy.pickRelationshipFirst('Employing Body/Bodies');
        cy.wait(1000);
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();
        cy.get(':nth-child(2) > .verbose').click();

        cy.pickRelationshipByName('Transfer of Licence', 'John Smith');
        cy.wait(2000);
        cy.pickRelationshipByName('New Applicant', 'Test Person');
        cy.wait(1000);
        cy.pickRelationshipByName('Nominated Excavation Director(s)', 'John Smith');
        cy.wait(1000);
        cy.pickRelationshipFirst('Former Employing Body');
        cy.wait(1000);
        cy.pickRelationshipFirst('Employing Body/Bodies');
        cy.wait(1000);
        cy.get('.card_component.date_requested_value > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click({force: true});
        cy.get('.card_component.date_requested_value > .row').click({force: true});
        cy.pickDomainByLabel('Cur Grade E Decision', 'Approve transfer of licence');
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.pickDomainByLabel('Cur Grade D Decision', 'Approved');
        cy.pickRelationshipFirst('Made By');
        cy.wait(1000);
        cy.pickRelationshipByName('Made By', 'John Smith');
        cy.pickRelationshipByName('Made By', 'John Smith');
        cy.get('[style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').contains('Add').click({ multiple: true });
        cy.wait(2000);
        cy.get('.tabbed-workflow-footer-button-container').contains('Save and Continue').should('be.visible').click({force: true});
    })

    it('Should extend licence', function () {
        startLicensing();

        cy.typeInCard('planning_reference', 'test ref');
        cy.typeInCard('cm_reference_number', 'cm num');
        cy.pickRelationshipByName('Applicant', 'John Smith');
        cy.pickRelationshipByName('Nominated Excavation Director(s)', 'John Smith');
        cy.get('[aria-label="Employing Body/Bodies, Add new Relationship"]').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        // Walk Application Details -> Amendments. A bare ':nth-child(2) > .verbose'
        // matches the footer save button, which is disabled on tabs with no
        // edits; workflowNext() picks whichever forward label is live.
        cy.workflowNext();          // Application Details -> Location Details
        cy.wait(4000);
        // Location Details is required — the footer forward button stays
        // disabled until the address is filled in.
        cy.get('.card_component.building_name_value input').filter(':visible').first().type('test building');
        cy.get('.card_component.street_value input').filter(':visible').first().type('street');
        cy.get('.card_component.town_or_city_value input').filter(':visible').first().type('city');
        cy.get('.card_component.postcode_value input').filter(':visible').first().type('bt561ag');
        cy.get('.council').filter(':visible').first().scrollIntoView();
        cy.get('.council').filter(':visible').first().find('.select2-selection').first().click();
        cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
        cy.get('.select2-results__option').contains('Causeway Coast and Glens').click();
        cy.workflowNext();          // Location Details  -> Geospatial Details
        cy.wait(4000);
        cy.workflowNext();          // Geospatial Details -> Additional Files
        cy.wait(4000);
        cy.workflowNext();          // Additional Files  -> Communications
        cy.wait(4000);
        cy.workflowNext();          // Communications    -> Record Decision
        cy.wait(4000);
        cy.workflowNext();          // Record Decision   -> Letter
        cy.wait(4000);
        cy.workflowNext();          // Letter            -> Amendments
        cy.wait(6000);

        cy.get(':nth-child(1) > .row > .form-group > .col-xs-12 > .pad-hor > [data-bind="css: { \'active\': value() === true, \'disabled\': disabled }, onEnterkeyClick, onSpacekeyClick, click: function(e){setValue(true)}, attr: {\'aria-checked\': value() === true}"]').click();
        cy.get(':nth-child(2) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click( {force: true});
        cy.get(':nth-child(2) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click( {force: true});
        cy.pickDomainByLabel('Cur Grade E Decision', 'Approve extension');
        cy.pickRelationshipByName('Made By', 'John Smith');
        cy.pickDomainByLabel('Cur Grade D Decision', 'Approved');
        cy.pickRelationshipByName('Made By', 'John Smith');
        cy.get(':nth-child(19) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click( {force: true});
        cy.get(':nth-child(19) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"]').click( {force: true});
        cy.get(':nth-child(20) > .row > .form-group > .col-xs-12 > [style="display: flex; gap: 8px;"] > .input-group > .form-control').click( {force: true});
        cy.get(':nth-child(2) > .workflow-component > .workflow-component-element > .card-component > .new-provisional-edit-card-container > .card > .widgets > :nth-child(1) > :nth-child(20) > .row > .form-group').click( {force: true});
        cy.get(':nth-child(2) > .workflow-component > [style="display: flex; justify-content: flex-end; padding: 0 18px;"] > .btn-success').click();
        cy.get('.tabbed-workflow-footer-button-container > .btn-success > .verbose').click();
    })
})
