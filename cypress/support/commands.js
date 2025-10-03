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

Cypress.Commands.add("rewriteHeaders", () => {
  cy.intercept("*", (req) =>
    req.on("response", (res) => {
      const setCookies = res.headers["set-cookie"]
      res.headers["set-cookie"] = (
        Array.isArray(setCookies) ? setCookies : [setCookies]
      )
        .filter((x) => x)
        .map((headerContent) =>
          headerContent.replace(
            /samesite=(lax|strict)/gi,
            "secure; samesite=none"
          )
        )
    })
  )
})

Cypress.Commands.add("login", () => {
    cy.visit('/auth/');

    cy.get('.input-group > .floating-label-group > input[name="username"].form-control').type(`admin{enter}`);
    cy.get('.input-group > .floating-label-group > input[name="password"].form-control').type(`admin{enter}`);

    cy.getCookie("csrftoken").should("exist");
    cy.getCookie("coral").should("exist");
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test temporary solution but we could log here and debug the uncaught issues
    return false
});

Cypress.Commands.add("type_ckeditor", (element, content) => {
    cy.window().then(win => {
        // uncomment this to find the actual instance name you need
        // console.log(win.CKEDITOR.instances);
        win.CKEDITOR.instances[element].setData(content);
    });
});
  