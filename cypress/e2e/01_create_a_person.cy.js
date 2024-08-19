describe('Creating a person named Test Person if one doesnt exist', function () {
    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&resource-type-filter=%5B%7B%22graphid%22%3A%2222477f01-1a44-11e9-b0a9-000d3ab1e588%22%2C%22name%22%3A%22Person%22%2C%22inverted%22%3Afalse%7D%5D');
        // cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&resource-type-filter=%5B%7B%22graphid%22%3A%22b9e0701e-5463-11e9-b5f5-000d3ab1e588%22%2C%22name%22%3A%22Activity%22%2C%22inverted%22%3Afalse%7D%5D');
    });

    it('Create a person', function () {
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if ($el.find('.search-listing').length > 0) {
                    // A caveat to this is that it will only look at the first page (which shouldn't be a problem with a fresh instance) since the search was failing locally to find Test Person (probably a permissions issue as all objects were created as Provisional)
                    if (!$el.text().includes('Test Person')) {
                        cy.visit('http://localhost:8000/add-resource/22477f01-1a44-11e9-b0a9-000d3ab1e588')
                        cy.contains('Names').click();
                        cy.get('[aria-label="Full Name"]').should('be.visible').type('Test Person');
                        cy.get('button').contains('Add').click();
                    }
                } else {
                    cy.visit('http://localhost:8000/add-resource/22477f01-1a44-11e9-b0a9-000d3ab1e588')
                    cy.contains('Names').click();
                    cy.get('[aria-label="Full Name"]').should('be.visible').type('Test Person');
                    cy.get('button').contains('Add').click();
                }
            })
        });
    });
});
