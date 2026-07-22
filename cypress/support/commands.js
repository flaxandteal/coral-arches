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
    // Coral forces two-factor auth on every login, and the seeded TOTP device has
    // replay protection (a code can't be reused within its 30s window). Logging in
    // on every test would collide, so cache the authenticated session and only run
    // the real login flow once for the whole suite.
    cy.session('admin', () => {
        cy.visit('/auth/');

        cy.get('#username').type('admin');
        cy.get('#password').type('admin{enter}');

        // The admin test account has a TOTP device seeded with a known secret, so
        // generate the current code and submit it to complete the login.
        cy.get('input[name="otp_token"]').should('be.visible').then(($input) => {
            cy.task('generateOtp').then((otp) => {
                cy.wrap($input).type(`${otp}{enter}`);
            });
        });

        // Land on an authenticated page before caching the session.
        cy.location('pathname', { timeout: 20000 }).should('not.include', '/auth');
    }, { cacheAcrossSpecs: true });
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test temporary solution but we could log here and debug the uncaught issues
    return false
});

Cypress.Commands.add("type_ckeditor", (element, content) => {
    // CKEditor auto-names instances editor1, editor2, ... in global creation order,
    // which drifts as the workflow renders its tabs. Prefer the requested name, but
    // fall back to whichever editor is currently visible on screen.
    cy.window().should((win) => {
        expect(win.CKEDITOR, 'CKEDITOR global to exist').to.exist;
        expect(
            Object.keys(win.CKEDITOR.instances).length,
            'at least one CKEDITOR instance'
        ).to.be.greaterThan(0);
    }).then((win) => {
        let name = element;
        if (!win.CKEDITOR.instances[name]) {
            const names = Object.keys(win.CKEDITOR.instances);
            name = names.find((n) => {
                const inst = win.CKEDITOR.instances[n];
                const el = inst && inst.container && inst.container.$;
                return el && el.offsetParent !== null;
            }) || names[names.length - 1];
        }
        win.CKEDITOR.instances[name].setData(content);
    });
});
  