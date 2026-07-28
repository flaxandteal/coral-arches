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

// Open a single-select select2 inside a specific card_component (concept/domain
// or resource-instance dropdowns that show "Select an option") and pick an
// option by index (default the first real option).
Cypress.Commands.add("pickCardOption", (cardClass, index = 0) => {
    cy.get(`.card_component.${cardClass}`).scrollIntoView();
    cy.get(`.card_component.${cardClass}`).find('.select2-selection').first().click();
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .eq(index)
        .click();
});

// Open any select2 whose aria-label STARTS WITH the given prefix and pick an
// option by index. Use for widgets whose aria-label embeds the current value
// ("Condition Score, 2") or that sit on a non-".select2-selection" element, so
// neither a hard-coded full label nor pickCardOption applies.
// `indexOrText` picks by option text when given a string, else by index.
Cypress.Commands.add("pickOptionByLabelPrefix", (labelPrefix, indexOrText = 0) => {
    const sel = `[aria-label^="${labelPrefix}"]`;
    // Scroll before filtering on :visible — select2 renders a zero-size span
    // until the widget is scrolled into view, so a :visible filter finds
    // nothing for below-the-fold widgets.
    cy.get(sel).first().scrollIntoView();
    cy.get(sel).first().click({ force: true });
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    const options = () => cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more');
    if (typeof indexOrText === 'string') {
        options().contains(indexOrText).click();
    } else {
        options().eq(indexOrText).click();
    }
});

// Pick an option from a domain/concept select2 identified by its label. These
// widgets render their aria-label as "<node name>, <current value>", so match on
// the "<node name>, " prefix rather than a hard-coded current value, then choose
// the option by (partial) text.
Cypress.Commands.add("pickDomainByLabel", (labelPrefix, optionText) => {
    const sel = `.select2-selection[aria-label^="${labelPrefix}, "]`;
    cy.get(sel).filter(':visible').first().scrollIntoView();
    cy.get(sel).filter(':visible').first().click();
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .contains(optionText)
        .click();
});

// Advance a tabbed workflow to the next step. The forward footer button is
// labelled "Save and Continue" when the current tab has unsaved edits and
// "Next Step" when it does not, so match either.
// Match only ENABLED forward buttons: on a tab with no edits the footer renders
// a greyed-out "Save and Continue" next to the live "Next Step", and clicking
// the disabled one fails. This must stay a retrying query chain (get/find/
// contains) rather than a .then() snapshot — some transitions (notably
// "Initialise Excavation Licence") only enable the button after a slow backend
// step, so the default 12s timeout is raised here.
Cypress.Commands.add("workflowNext", (options = {}) => {
    const timeout = options.timeout || 60000;
    cy.get('.tabbed-workflow-footer-button-container', { timeout })
        .find('button:not([disabled])', { timeout })
        .contains(/Save and Continue|Next Step/, { timeout })
        .click();
});

// Fill a datepicker widget (`.card_component.<cardClass>.datepicker-widget`).
// Type into the input rather than clicking the `.input-group-addon.date-icon`
// calendar addon — the addon opens no picker and leaves the field empty. The
// widget normalises what it parses to DD-MM-YYYY. Avoid the deep
// `> .row > .form-group > ...` paths: those inline
// `style="display: flex; gap: 8px;"` selectors drifted in arches 8.2.
Cypress.Commands.add("fillDate", (cardClass, date = '28-07-2026') => {
    cy.get(`.card_component.${cardClass}`).filter(':visible').first().as('dateCard');
    cy.get('@dateCard').scrollIntoView();
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .type(`${date}{enter}`, { force: true });
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .should('not.have.value', '');
});

// Open a resource-instance relationship widget (identified by its "<label>, Add
// new Relationship" aria-label) and wait for its select2 dropdown to finish its
// initial load. The widget often sits below the fold, so scroll it into view
// first — a bare .should('be.visible') fails because select2 renders a
// zero-size span until scrolled to.
Cypress.Commands.add("openRelationship", (ariaLabel) => {
    // The "Add new Relationship" select2 box is labelled "<label>, Add new
    // Relationship" while empty, but once a relationship has been added its
    // aria-label collapses to "<label>, " (the add-new box stays, ready for
    // another). Match on the "<label>, " prefix so the same command works for the
    // first and any subsequent relationship on a multi-value widget.
    // Some tabs render more than one widget with the same label (or keep hidden
    // copies from other tabs in the DOM), so always target the first VISIBLE
    // matching add-new box.
    const sel = `.select2-selection[aria-label^="${ariaLabel}, "]`;
    const target = () => cy.get(sel).filter(':visible').first();
    // Scroll the first match into view BEFORE filtering on :visible. select2
    // renders a zero-size span until the widget is scrolled to, so for a
    // below-the-fold widget the :visible filter matches nothing at all.
    cy.get(sel).first().scrollIntoView();
    cy.wait(300);
    target().scrollIntoView();
    // The widget's select2 may still be initialising when the tab first renders;
    // clicking it before it is ready silently does nothing. Give it a moment,
    // then click and retry until the dropdown actually opens.
    cy.wait(600);
    const openOnce = (attempt) => {
        cy.get('body').then(($b) => {
            if ($b.find('.select2-dropdown').length) return; // already open
            target().click();
            cy.wait(600);
            cy.get('body').then(($b2) => {
                if (!$b2.find('.select2-dropdown').length && attempt < 4) {
                    openOnce(attempt + 1);
                }
            });
        });
    };
    openOnce(0);
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    // Wait for the first page of results to actually render, otherwise a
    // subsequent interaction can race the async load.
    cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .should('have.length.greaterThan', 0);
});

// Pick the first real option from an open relationship dropdown.
Cypress.Commands.add("pickRelationshipFirst", (ariaLabel) => {
    cy.openRelationship(ariaLabel);
    cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .first()
        .click();
});

// Select a specific resource by display name from a relationship widget.
// NOTE: the "Flagged by" actor widget does NOT re-render term-filtered results
// when you type into its select2 search box (an arches 8.2 widget quirk), so we
// reach the target by paging through the infinite-scroll list instead of typing.
Cypress.Commands.add("pickRelationshipByName", (ariaLabel, name, maxScrolls = 15) => {
    cy.openRelationship(ariaLabel);
    const exact = new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
    const tryScroll = (n) => {
        cy.get('.select2-results__options').then(($ul) => {
            const found = $ul.find('.select2-results__option').toArray()
                .some((li) => li.textContent.trim() === name);
            if (found) {
                cy.get('.select2-results__option').contains(exact).first().click();
                return;
            }
            if (n <= 0) throw new Error(`relationship option not found after scrolling: ${name}`);
            cy.wrap($ul).scrollTo('bottom', { ensureScrollable: false });
            cy.wait(1000);
            tryScroll(n - 1);
        });
    };
    tryScroll(maxScrolls);
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
        const inst = win.CKEDITOR.instances[name];
        inst.setData(content);
        // setData alone does not notify the knockout binding; without a
        // subsequent blur/change the value never reaches the observable and the
        // tile saves empty. Sync to the underlying element and fire change so the
        // value persists regardless of what the test does next.
        inst.updateElement();
        inst.fire('change');
    });
});
  