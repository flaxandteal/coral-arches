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
    cy.session('admin', () => {
        cy.visit('/auth/');

        cy.get('#username').type('admin');
        cy.get('#password').type('admin{enter}');

        cy.get('input[name="otp_token"]').should('be.visible').then(($input) => {
            cy.task('generateOtp').then((otp) => {
                cy.wrap($input).type(`${otp}{enter}`);
            });
        });

        // Land on an authenticated page before caching the session.
        cy.location('pathname', { timeout: 20000 }).should('not.include', '/auth');
    }, { cacheAcrossSpecs: true });
});

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

Cypress.Commands.add("pickOptionByLabelPrefix", (labelPrefix, indexOrText = 0) => {
    const sel = `[aria-label^="${labelPrefix}"]`;

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

Cypress.Commands.add("workflowNext", (options = {}) => {
    const timeout = options.timeout || 60000;
    // The footer's step counter ("3 / 11"). Reading it either side of the click
    // makes this command WAIT for the step to actually change instead of
    // returning as soon as the button is clicked. Clicking "Save and Continue"
    // on a slow step leaves the same button on screen while the save is in
    // flight, so a following workflowNext() used to re-click it — running the
    // step's save twice and advancing two tabs. That is what left the licensing
    // workflow on Location Details (3/11) with a "Something went wrong" alert
    // instead of on Application Details.
    // Note the ':not(.disabled)' as well as ':not([disabled])': the "Next Step"
    // button is greyed out with a css class, not the disabled attribute.
    const stepIndex = () =>
        cy.get('.step-counter span', { timeout }).first({ timeout }).invoke('text')
            .then((text) => parseInt(text.trim(), 10));

    stepIndex().then((from) => {
        cy.get('.tabbed-workflow-footer-button-container', { timeout })
            .find('button:not([disabled]):not(.disabled)', { timeout })
            .contains(/Save and Continue|Next Step/, { timeout })
            .click();
        // `.first()` must carry the timeout too. An assertion retries for the
        // timeout of the query it is chained to, not the one before it, so
        // `get({timeout: 240000}).first().should(...)` only ever retried for
        // defaultCommandTimeout (12s) and every slow step failed with
        // "workflow advanced past step N: expected N to be above N" while its
        // save was still in flight. That is what failed all three licensing
        // tests in CI, where the step-1 save takes ~13s.
        cy.get('.step-counter span', { timeout })
            .first({ timeout })
            .should(($el) => {
                expect(
                    parseInt($el.text().trim(), 10),
                    'workflow advanced past step ' + from
                ).to.be.greaterThan(from);
            });
    });
});

Cypress.Commands.add("fillDate", (cardClass, date = '28-07-2026') => {
    cy.get(`.card_component.${cardClass}`).filter(':visible').first().as('dateCard');
    cy.get('@dateCard').scrollIntoView();
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .type(`${date}{enter}`, { force: true });
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .should('not.have.value', '');
});

// Type into a card's text widget. Prefer this over the recorder-generated
// `.card_component.x > .row > .form-group > [style="…"] > .col-xs-12 >
// .form-control` chains — those inline-style hops have all drifted on arches
// 8.2 and match nothing.
Cypress.Commands.add("typeInCard", (cardClass, text) => {
    const input = () =>
        cy.get(`.card_component.${cardClass} input.form-control`).filter(':visible').first();
    input().scrollIntoView();
    input().clear({ force: true });
    input().type(text, { force: true });
    input().should('have.value', text);
});

// Set a radio-boolean card to its true value. The widget renders the state on
// the <label> (aria-checked / .active) and every radio input on the page shares
// name="stat-w-label", so the input is never reliably :checked. The true label
// is the first of the two.
Cypress.Commands.add("setBooleanTrue", (cardClass) => {
    const card = `.card_component.${cardClass}`;
    cy.get(`${card} label[role="radio"]`).filter(':visible').first().scrollIntoView();
    cy.get(`${card} label[role="radio"]`).filter(':visible').first().click({ force: true });
    cy.get(`${card} label[aria-checked="true"]`).should('have.length', 1);
});

Cypress.Commands.add("openRelationship", (ariaLabel) => {
    const sel = `.select2-selection[aria-label^="${ariaLabel}, "]`;
    const target = () => cy.get(sel).filter(':visible').first();

    cy.get(sel).first().scrollIntoView();
    cy.wait(300);
    target().scrollIntoView();

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
        inst.updateElement();
        inst.fire('change');
    });
});
  
// Type into the CKEditor belonging to a specific rich-text card. The widget
// replaces its <textarea> with a CKEditor iframe, so the textarea reports as
// not visible and cy.type() cannot be used; the editor has to be driven through
// the CKEDITOR API. A step can hold several editors (the Agri consultation step
// has two - Comments and CM Reference Description), and they are named
// editor1/editor2 in DOM order, so resolve the instance from the card rather
// than guessing the name.
Cypress.Commands.add("typeRichText", (cardClass, content) => {
    cy.get(`.card_component.${cardClass}`).should('exist');
    cy.window().should((win) => {
        expect(win.CKEDITOR, 'CKEDITOR global to exist').to.exist;
        expect(
            Object.keys(win.CKEDITOR.instances).length,
            'at least one CKEDITOR instance'
        ).to.be.greaterThan(0);
    }).then((win) => {
        const name = Object.keys(win.CKEDITOR.instances).find((n) => {
            const el = win.CKEDITOR.instances[n]?.container?.$;
            return el && el.closest(`.card_component.${cardClass}`);
        });
        expect(name, `CKEDITOR instance inside .card_component.${cardClass}`).to.exist;
        const inst = win.CKEDITOR.instances[name];
        inst.setData(content);
        inst.updateElement();
        inst.fire('change');
    });
});

Cypress.Commands.add("select2Search", (term) => {
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    cy.get('.select2-dropdown').then(($dropdown) => {
        const $field = $dropdown.find('.select2-search__field:visible');
        if (!$field.length) {
            cy.log(`select2Search: search box hidden (<5 results), picking "${term}" from the list`);
            return;
        }
        cy.wrap($field.first()).clear();
        cy.wrap($field.first()).type(term);
    });
    // These dropdowns query the server, and selectWoo renders a
    // `.loading-results` placeholder as a `.select2-results__option` while the
    // request is in flight. Callers pick an option straight after this command,
    // so returning while the placeholder is still there makes them match it
    // instead of a real result ("Expected to find content 'HA/02' within
    // <li.select2-results__option.loading-results>"). Wait for the results to
    // settle rather than leaving it to a fixed cy.wait().
    cy.get('.select2-results__option', { timeout: 20000 })
        .should('not.have.class', 'loading-results');
});
