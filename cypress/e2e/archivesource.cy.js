describe('Opens the Workflow', function() {
    it('Shows the workflow page', function() {
        cy.login();
        cy.visit("http://localhost:8000/plugins/init-workflow")
        cy.contains("Workflows")
    })
})