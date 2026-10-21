describe('Going through the Curatorial Inspection Workflow', function () {

    beforeEach(() => {
        cy.login();
        // A cold load fetches ~250 webpack chunks and can exceed the 90s default.
        cy.visit('/plugins/init-workflow', { timeout: 180000 });
    });

    // File uploads stay commented out: the upload buckets differ per environment.
    // cy.get('input.dz-hidden-input').first().selectFile('cypress/fixtures/test-upload.txt', { force: true });

    const footer = () => cy.get('.tabbed-workflow-footer-button-container');
    const now = new Date();
    const today = [now.getDate(), now.getMonth() + 1, now.getFullYear()]
        .map((part) => String(part).padStart(2, '0')).join('-');

    it('Shows the start and open controls on the launcher', function () {
        cy.contains('Curatorial Inspection', { timeout: 60000 }).click();
        cy.contains('Start New').should('be.visible');
        cy.contains('Open Selected').should('be.visible');
    });

    it('Create new inspection and go through the workflow and populate all fields', function () {
        cy.contains('Workflows', { timeout: 60000 });
        cy.contains('Curatorial Inspection', { timeout: 60000 }).click();
        cy.contains('Start New').click();

        // Start tab: the ID is generated into a locked input before the step can be saved.
        cy.get('[aria-label="Consultation ID"]', { timeout: 30000 })
            .should(($id) => expect($id.val()).to.match(/^CIN\/\d{4}\/\w+$/))
            .and('be.disabled');
        cy.workflowNext();

        // Asset Details tab. The "Monument or Area" picker is relabelled "SMR Number".
        cy.contains('SMR Number', { timeout: 60000 }).scrollIntoView();
        cy.get('.select2-selection', { timeout: 60000 }).should('exist');
        cy.wait(4000);
        cy.pickRelationshipFirst('SMR Number');
        cy.get('.rr-table-row', { timeout: 30000 }).should('have.length', 1);
        cy.get('div[style*="background: #eee"]', { timeout: 30000 }).should('have.length', 1).within(() => {
            ['Monument Name', 'Designation Type', 'Townland', 'B File(s)'].forEach((label) => {
                cy.contains(label);
            });
        });

        cy.contains('BDLO Reference').scrollIntoView();
        cy.get('[aria-label="BDLO Reference"]').click().type('BDLO test reference');
        cy.contains('HPRM Reference').scrollIntoView();
        cy.get('[aria-label="HPRM Reference"]').click().type('HPRM test reference');

        // Date Consulted starts empty and fills with today on first click.
        cy.contains('Date Consulted').scrollIntoView();
        cy.get('.widget-wrapper.log_date input.form-control').first().should('have.value', '');
        cy.get('.widget-wrapper.log_date input.form-control').first().click();
        cy.get('.widget-wrapper.log_date input.form-control').first().should('have.value', today);

        // Reason is a rich-text widget, so it is driven through CKEditor.
        cy.contains('Reason').scrollIntoView();
        cy.typeRichText('reason_description', 'Curatorial inspection reason');

        footer().contains('Save and Continue');
        cy.workflowNext();

        // Attendees Details tab. Historian, Architect and Occupier(s) are hidden in this workflow.
        cy.contains('Owner(s)', { timeout: 60000 }).scrollIntoView();
        ['Historian', 'Architect', 'Occupier(s)'].forEach((label) => {
            cy.get(`.select2-selection[aria-label^="${label}, "]`).filter(':visible').should('not.exist');
        });
        ['CWT Area Supervisor(s)', 'Archaeologist(s)', 'CWT Area Manager(s)', 'Owner(s)', 'HED Staff'].forEach((label) => {
            cy.contains(label);
        });
        cy.pickRelationshipFirst('CWT Area Supervisor(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Archaeologist(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('CWT Area Manager(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('Owner(s)');
        cy.wait(1000);
        cy.pickRelationshipSecond('Owner(s)');
        cy.wait(1000);
        cy.pickRelationshipFirst('HED Staff');
        cy.wait(2000);
        footer().contains('Save and Continue');
        cy.workflowNext();

        // Comments tab. A description needs both its text and its type before it can be added.
        cy.contains('Curatorial Description', { timeout: 60000 }).scrollIntoView();
        cy.pickCardOption('curatorial_description_type');
        cy.wait(2000);
        cy.typeRichText('curatorial_description', 'Test curatorial comment');
        cy.get('.btn-success').contains('Add').click();
        cy.contains('Test curatorial comment', { timeout: 30000 });
        cy.wait(1500);
        cy.workflowNext();

        // Upload tab: optional.
        cy.get('.bord-top > .btn', { timeout: 30000 }).contains('Select Files');
        cy.workflowNext();

        // Sign Off tab. Send Papers, Within Deadline, Cur E and Reviewed By are hidden;
        // Report Submitted By is a sign-off row that admin cannot sign.
        cy.contains('Signed Off On', { timeout: 60000 });
        // innerText leaves out display:none, unlike cy.contains.
        cy.document().then((doc) => {
            ['Send Papers', 'Within Deadline', 'Cur E', 'Reviewed By'].forEach((label) => {
                expect(doc.body.innerText, label).not.to.include(label);
            });
        });
        cy.pickCalendarDay('sign_off_date_value', now.getDate());
        cy.contains('You do not have permission to sign off');
        cy.get('.btn-primary').contains('Previous Step');
        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save').click();
        cy.get('.workflow-top-control > .btn-success').contains('Save and Complete Workflow').click();

        cy.location('pathname', { timeout: 20000 }).should('include', '/plugins/init-workflow');
        cy.get('.workflow-select-card', { timeout: 20000 }).should('have.length.greaterThan', 0);
    });
});
