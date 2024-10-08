describe('Creating a bibliographic named Test Bibliographic if one doesnt exist', function () {
    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=70&language=*&term-filter=%5B%7B%22inverted%22%3Afalse%2C%22type%22%3A%22string%22%2C%22context%22%3A%22%22%2C%22context_label%22%3A%22%22%2C%22id%22%3A%22Test%20Bibliographic%22%2C%22text%22%3A%22Test%20Bibliographic%22%2C%22value%22%3A%22Test%20Bibliographic%22%2C%22selected%22%3Atrue%7D%5D');
    });

    it('Create an bibliographic source', function () {
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if ($el.find('.search-listing').length > 0) {
                    // A caveat to this is that it will only look at the first page (which shouldn't be a problem with a fresh instance) since the search was failing locally to find Test Organisation (probably a permissions issue as all objects were created as Provisional)
                    if (!$el.text().includes('Test Bibliographic')) {
                    }
                } else {
                    cy.visit('http://localhost:8000/add-resource/d4a88461-5463-11e9-90d9-000d3ab1e588')
                    cy.contains('Bibliographic Source Citation').click();
                    cy.get('[aria-label="Bibliographic Source, Add new Relationship"]').click();
                    cy.wait(10000);
                    cy.get('.select2-results__option').contains(' Create a new Bibliographic Source . . . ').click();
                    cy.get('[aria-label="Bibliographic Source Name"]').click().type('Test Bibliographic');
                    cy.get('.btn').contains('Add').click();
                }
            })
        });
    });
});
