describe('Creating a person named Test Person and a person named John Doe if they dont exist', function () {
    beforeEach(() => {
        cy.login();
    });

    it('Create a person', function () {
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=125&language=*&term-filter=%5B%7B%22context%22%3A%22%22%2C%22context_label%22%3A%22Person%20-%20Name%22%2C%22id%22%3A%22termTest%20PersonPerson%20-%20Name%22%2C%22text%22%3A%22Test%20Person%22%2C%22type%22%3A%22term%22%2C%22value%22%3A%22Test%20Person%22%2C%22inverted%22%3Afalse%2C%22selected%22%3Atrue%7D%5D');
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

    it('Create a second person', function () {
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=329&term-filter=%5B%7B%22context%22%3A%22%22%2C%22context_label%22%3A%22Person%20-%20Name%22%2C%22id%22%3A%22termJohn%20DoePerson%20-%20Name%22%2C%22text%22%3A%22John%20Doe%22%2C%22type%22%3A%22term%22%2C%22value%22%3A%22John%20Doe%22%2C%22inverted%22%3Afalse%2C%22selected%22%3Atrue%7D%5D&language=*');
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if ($el.find('.search-listing').length > 0) {
                    // A caveat to this is that it will only look at the first page (which shouldn't be a problem with a fresh instance) since the search was failing locally to find John Doe (probably a permissions issue as all objects were created as Provisional)
                    if (!$el.text().includes('John Doe')) {
                        cy.visit('http://localhost:8000/add-resource/22477f01-1a44-11e9-b0a9-000d3ab1e588')
                        cy.contains('Names').click();
                        cy.get('[aria-label="Full Name"]').should('be.visible').type('John Doe');
                        cy.get('button').contains('Add').click();
                    }
                } else {
                    cy.visit('http://localhost:8000/add-resource/22477f01-1a44-11e9-b0a9-000d3ab1e588')
                    cy.contains('Names').click();
                    cy.get('[aria-label="Full Name"]').should('be.visible').type('John Doe');
                    cy.get('button').contains('Add').click();
                }
            })
        });
    });
});
