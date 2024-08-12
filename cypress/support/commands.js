// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })

Cypress.Commands.add("login", () => {
    cy.visit('localhost:8000/auth/?next=/index.htm');

    cy.get('.input-group > .floating-label-group > input[name="username"].form-control').type(`admin{enter}`);
    cy.get('.input-group > .floating-label-group > input[name="password"].form-control').type(`admin{enter}`);
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test temporary solution but we could log here and debug the uncaught issues
    return false
})
