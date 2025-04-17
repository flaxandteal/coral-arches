describe('Creating a organisation named Test Organisation if one doesnt exist', function () {
    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=125&language=*&term-filter=%5B%7B%22context%22%3A%22%22%2C%22context_label%22%3A%22Organization%20-%20Names%22%2C%22id%22%3A%22termTest%20OrganisationOrganization%20-%20Names%22%2C%22text%22%3A%22Test%20Organisation%22%2C%22type%22%3A%22term%22%2C%22value%22%3A%22Test%20Organisation%22%2C%22inverted%22%3Afalse%2C%22selected%22%3Atrue%7D%5D');
    });

    it('Create an organisation', function () {
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if ($el.find('.search-listing').length > 0) {
                    // A caveat to this is that it will only look at the first page (which shouldn't be a problem with a fresh instance) since the search was failing locally to find Test Organisation (probably a permissions issue as all objects were created as Provisional)
                    if (!$el.text().includes('Test Organisation')) {
                        cy.visit('http://localhost:8000/add-resource/d4a88461-5463-11e9-90d9-000d3ab1e588')
                        cy.contains('Names').click();
                        cy.get('[aria-label="Organization Name"]').should('be.visible').type('Test Organisation');
                        cy.get('button').contains('Add').click();
                    }
                } else {
                    cy.visit('http://localhost:8000/add-resource/d4a88461-5463-11e9-90d9-000d3ab1e588')
                    cy.contains('Names').click();
                    cy.get('[aria-label="Organization Name"]').should('be.visible').type('Test Organisation');
                    cy.get('button').contains('Add').click();
                }
            })
        });
    });
});
