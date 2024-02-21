describe('Logging in', function () {
    it('Log in', function () {
        cy.login(); // Sanity check
    })
})

describe('Test the Flag for Enforcement Workflow', function () {
    

    it('Goes through the Flag for Enforcement', function() {
        cy.login();
        cy.visit('http://localhost:8000/plugins/init-workflow');
        cy.contains('Flag for Enforcement').click();

        // first page
        cy.wait(5000);
        cy.contains('Save and Continue').click();

        // second page
        cy.wait(5000);
        cy.get('[aria-label="Case Reference"]').click().type('Case Reference Test 1');
        cy.contains('Reason for enforcement').click();
        // cy.get('iframe[title="Editor, editor2"]').its('0.contentDocument.body').then(cy.wrap).contains('Enter text').click().type('editor test');
        cy.contains('Save and Complete Workflow').click();
    })
})