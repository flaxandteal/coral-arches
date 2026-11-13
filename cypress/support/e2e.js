// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')
const failures = [];

export function recordFailure(entry) {
  failures.push({ test: Cypress.currentTest?.titlePath?.join(' > '), ...entry });
}

const isNoise = (url) => /\/(static|media|mvt|tileserver)\//.test(url);

beforeEach(() => {
  cy.intercept({ url: '**' }, (req) => {
    req.on('response', (res) => {
      if (res.statusCode < 400 || isNoise(req.url)) return;
      recordFailure({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        body: String(typeof res.body === 'string' ? res.body : JSON.stringify(res.body)).slice(0, 2000),
      });
    });
  });
});

Cypress.on('window:before:load', (win) => {
  const original = win.console.error;
  win.console.error = (...args) => {
    recordFailure({ console: args.map(String).join(' ') });
    original.apply(win.console, args);
  };
});

afterEach(function () {
  if (failures.length) {
    cy.task('logFailures', { spec: Cypress.spec.name, entries: failures.splice(0) });
  }
  if (Cypress.env('FAST') && this.currentTest.state === 'failed') {
    Cypress.runner.stop();
  }
});
