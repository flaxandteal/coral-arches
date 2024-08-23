describe('Going through the Incident Report', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
    });

    it('Go through the workflow and populate all fields', function () {
        cy.contains('Workflows');
        cy.contains('Incident Report').click();
        cy.wait(2000);
        cy.get('.card-component').contains('Please select a Monument').click();
        cy.get('.select2-results__option');
        cy.wait(2000);
        cy.get('.select2-results__option').contains('HA/01').click();
        cy.get('.card-component').contains('Select an Incident Report or start new').click();
        cy.get('[style="display: flex"] > .fa').contains('Start New').click();
        
        // Inital Step tab
        cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();

        // Incident Reference tab
        cy.get('.tabbed-workflow-footer').scrollIntoView();
        cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

        // Record of the incident
        cy.wait(2000)
        cy.get('[aria-label="Name"]').click();

        cy.get('.card_component.damage_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.material_fabric_damage_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('.card_component.component_damage_type').contains('Select an option').click();
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();

        cy.get('[aria-label="CM Reference"]').click();

        /*
            section for notes rich text editor
        */

        cy.get('.card_component.issue_identifier').contains('Add new Relationship').scrollIntoView().click()
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('.close-new-step').contains('Return').click();

        cy.get('.card_component.area_archaeologist').contains('Add new Relationship').scrollIntoView().click()
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('.close-new-step').contains('Return').click();

        cy.get('.card_component.cwt_area_supervisor').contains('Add new Relationship').scrollIntoView().click()
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('.close-new-step').contains('Return').click();

        cy.get('.card_component.occupier').contains('Add new Relationship').scrollIntoView().click()
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('.close-new-step').contains('Return').click();

        cy.get('.card_component.owner').contains('Add new Relationship').scrollIntoView().click()
        cy.wait(2000);
        cy.get('.select2-results__option').first().click();
        cy.wait(2000);
        cy.get('.close-new-step').contains('Return').click();

        cy.get('.tabbed-workflow-footer-button-container > .btn-success').contains('Save and Continue').click();

    });

    // it('Open workflow steps', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Incident Report').click();

    //     cy.wait(2000);
    //     cy.get('.card-component').contains('Please select a Monument').click();
    //     cy.get('.select2-results__option').first().click();
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('[style="display: flex"] > .fa').contains('Start New').click();
    //     cy.get('.btn-primary').contains('Open Selected').click();
    //     cy.get('.btn-danger').contains('Clear Recents').click();
    // });

    // it('Record of Incident select and unselect', function () {
    //     cy.contains('Workflows');
    //     cy.contains('Incident Report').click();
    //     cy.wait(2000);
    //     cy.get('.card-component').contains('Please select a Monument').click();
    //     cy.get('.select2-results__option');
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').contains('HA/01').click();
    //     cy.get('.card-component').contains('Select an Incident Report or start new').click();
    //     cy.get('[style="display: flex"] > .fa').contains('Start New').click();
        
    //     // Inital Step tab
    //     cy.get('.tabbed-workflow-footer-button-container > .btn').contains('Next Step').click();

    //     // Incident Reference tab
    //     cy.get('.tabbed-workflow-footer').scrollIntoView();
    //     cy.get('.tabbed-workflow-footer-button-container').contains('Next Step').click();

    //     // Record of Incident
    //     cy.wait(4000)
    //     cy.get('.card_component.damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').first().click();
    //     cy.wait(2000)
    //     cy.get('.card_component.damage_type');
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('.card_component.material_fabric_damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.card_component.material_fabric_damage_type').contains('.select2-results__option').first().click();
    //     cy.wait(2000);
    //     cy.get('.select2-selection__clear').click();
    //     cy.get('.card_component.component_damage_type').contains('Select an option').click();
    //     cy.wait(2000);
    //     cy.get('.select2-results__option').first().click();
    //     cy.wait(2000)
    //     cy.get('.select2-selection__clear').click();
    // });
});

