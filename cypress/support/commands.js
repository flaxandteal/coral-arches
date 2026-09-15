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

// Log in as the non-superuser seeded into a given coral Group, e.g.
//   cy.loginAs('HB Planning Users')
// `admin` is a superuser and short-circuits every permission check, so it is
// useless for asserting that a workflow is hidden or a save is refused — use
// this instead. The accounts come from `manage.py seed_test_permissions`, which
// also writes the fixture read here; see cypress/seed/README.md.
Cypress.Commands.add("loginAs", (groupName) => {
    cy.fixture('permission_users').then((seed) => {
        const username = seed.users[groupName];
        if (!username) {
            throw new Error(
                `No E2E login is seeded for group "${groupName}". ` +
                `Seeded groups: ${Object.keys(seed.users).join(', ')}`
            );
        }

        // One device per user, so distinct users never trip each other's TOTP
        // replay protection — but a single user logging in twice inside one
        // 30s step does, hence the cached session.
        cy.session(username, () => {
            cy.visit('/auth/');

            cy.get('#username').type(username);
            cy.get('#password').type(`${seed.password}{enter}`);

            cy.get('input[name="otp_token"]').should('be.visible').then(($input) => {
                cy.task('generateOtp').then((otp) => {
                    cy.wrap($input).type(`${otp}{enter}`);
                });
            });

            cy.location('pathname', { timeout: 20000 }).should('not.include', '/auth');
        }, { cacheAcrossSpecs: true });
    });
});

// .widget-wrapper (not .card_component) is the selector here: .card_component
// only gets added by default.htm's componentCssClasses binding, which
// default-card-util and file-template cards (e.g. Records NI, HMC Reference,
// Letters) never apply. .widget-wrapper comes from the widget's own template
// and is present no matter which card component renders it.
Cypress.Commands.add("pickCardOption", (cardClass, indexOrText = 0) => {
    cy.get(`.widget-wrapper.${cardClass}`).scrollIntoView();
    cy.get(`.widget-wrapper.${cardClass}`).find('.select2-selection').first().click();
    cy.get('.select2-dropdown', { timeout: 10000 }).should('be.visible');
    const options = () => cy.get('.select2-results__option')
        .not('.loading-results')
        .not('.select2-results__option--load-more')
        .not('.select2-results__message');
    // Pass text when the first option will not do -- an assignee, say, has to be
    // someone the Update Response Assignee function accepts. Resource pickers page
    // their results, so search first: the wanted row is usually not rendered yet,
    // and "Searching..."/"No results" are themselves .select2-results__option li's.
    if (typeof indexOrText === 'string') {
        cy.select2Search(indexOrText);
        options().contains(indexOrText).click();
    } else {
        options().eq(indexOrText).click();
    }
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
        .not('.select2-results__message')
        .contains(optionText)
        .click();
});

Cypress.Commands.add("workflowNext", (options = {}) => {
    const timeout = options.timeout || 60000;

    const stepIndex = () =>
        cy.get('.step-counter span', { timeout }).first({ timeout }).invoke('text')
            .then((text) => parseInt(text.trim(), 10));

    stepIndex().then((from) => {
        cy.get('.tabbed-workflow-footer-button-container', { timeout })
            .find('button:not([disabled]):not(.disabled)', { timeout })
            .contains(/Save and Continue|Next Step/, { timeout })
            .click();

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
    cy.get(`.widget-wrapper.${cardClass}`).first().as('dateCard');
    cy.get('@dateCard').scrollIntoView();
    cy.get('@dateCard').filter(':visible').should('exist');
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .type(`${date}{enter}`, { force: true });
    cy.get('@dateCard').find('input.form-control').filter(':visible').first()
        .should('not.have.value', '');
});


Cypress.Commands.add("typeInCard", (cardClass, text) => {
    const input = () =>
        cy.get(`.widget-wrapper.${cardClass} input.form-control`).filter(':visible').first();
    input().scrollIntoView();
    input().clear({ force: true });
    input().type(text, { force: true });
    input().should('have.value', text);
});

Cypress.Commands.add("setBooleanTrue", (cardClass) => {
    const card = `.widget-wrapper.${cardClass}`;
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

    cy.get(
        '.select2-results__option:not(.loading-results)' +
        ':not(.select2-results__option--load-more)'
    ).should('have.length.greaterThan', 0);
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
    const tryScroll = (n) => {
        cy.get('.select2-results__options').then(($ul) => {
            const match = $ul.find('.select2-results__option').toArray()
                .find((li) => li.textContent.trim() === name);
            if (match) {
                cy.wrap(match).click();
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
    // A CKEDITOR instance is registered as soon as creation starts, well
    // before its iframe document finishes loading. Calling setData() on a
    // not-yet-ready instance gets silently discarded once CKEditor finishes
    // initializing and loads the field's original (empty) value, leaving
    // the editor visibly empty even though this command reported success.
    // So wait for a ready, on-screen instance before touching it, not just
    // for any instance to be registered.
    const findVisibleReady = (win) => {
        const names = Object.keys(win.CKEDITOR.instances);
        return names.find((n) => {
            const inst = win.CKEDITOR.instances[n];
            const el = inst && inst.container && inst.container.$;
            return inst.status === 'ready' && el && el.offsetParent !== null;
        });
    };
    cy.window().should((win) => {
        expect(win.CKEDITOR, 'CKEDITOR global to exist').to.exist;
        const preferred = win.CKEDITOR.instances[element];
        const ready = (preferred && preferred.status === 'ready') || findVisibleReady(win);
        expect(ready, 'a visible, ready CKEDITOR instance to exist').to.be.ok;
    }).then((win) => {
        const preferred = win.CKEDITOR.instances[element];
        const name = (preferred && preferred.status === 'ready') ? element : findVisibleReady(win);
        const inst = win.CKEDITOR.instances[name];
        inst.setData(content);
        inst.updateElement();
        inst.fire('change');
    });
});
  
Cypress.Commands.add("typeRichText", (cardClass, content) => {
    cy.get(`.widget-wrapper.${cardClass}`).should('exist');
    cy.window().should((win) => {
        expect(win.CKEDITOR, 'CKEDITOR global to exist').to.exist;
        expect(
            Object.keys(win.CKEDITOR.instances).length,
            'at least one CKEDITOR instance'
        ).to.be.greaterThan(0);
    }).then((win) => {
        const name = Object.keys(win.CKEDITOR.instances).find((n) => {
            const el = win.CKEDITOR.instances[n]?.container?.$;
            return el && el.closest(`.widget-wrapper.${cardClass}`);
        });
        expect(name, `CKEDITOR instance inside .widget-wrapper.${cardClass}`).to.exist;
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

    cy.get(
        '.select2-results__option:not(.loading-results)' +
        ':not(.select2-results__option--load-more)' +
        ':not(.select2-results__message)',
        { timeout: 20000 }
    ).should('have.length.greaterThan', 0);
});
