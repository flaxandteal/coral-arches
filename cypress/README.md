# Cypress E2E Testing Guide

This directory contains end-to-end (E2E) tests for the Coral-Arches project using [Cypress](https://www.cypress.io/).

## Prerequisites

- Node.js and npm installed
- Cypress installed (run `npm install cypress` in the project root if not already installed)
- Coral-Arches application running locally (usually at `localhost:8000`)

## Running Tests

1. **Open Cypress UI:**
   ```sh
   npx cypress open
   ```
   This opens the interactive Cypress test runner.

2. **Run Tests Headlessly:**
   ```sh
   npx cypress run --headless
   ```
   This runs all E2E tests in the terminal.

## Test Structure

- Test specs are located in `cypress/e2e/` and cover key user flows.
- Custom commands are defined in `/cypress/support/commands.js`.

## Example Test

To run a specific test file:
```sh
npx cypress run --spec cypress/e2e/sample_spec.js
```

## Writing Tests

- Create new test files in the `cypress/e2e/` directory.
- Use Cypress commands like `cy.visit()`, `cy.get()`, and `cy.request()` to interact with the application.

## Authentication

A custom command `cy.login()` is available for logging in as the default admin user.

## Changing Cypress Base URL

To change the base URL Cypress uses for tests, update the `baseUrl` property in `cypress.config.js`:

```js
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8000', // Change this to your desired URL
    // ...other config...
  },
};
```

Alternatively, you can override the base URL when running tests:

```sh
npx cypress run --config baseUrl=http://your-url:port
```

## Login Command Details

The custom `cy.login()` command is defined in `/cypress/support/commands.js`.  
It automates logging in as the default admin user for your tests.  
You can customize the credentials or login flow in this file as needed.

## More Information

- [Cypress Documentation](https://docs.cypress.io/)