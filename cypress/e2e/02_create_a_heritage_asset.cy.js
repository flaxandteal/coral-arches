describe('Creating a Heritage Asset if none exist', function () {
    beforeEach(() => {
        cy.login();
        cy.visit('http://localhost:8000/search?paging-filter=1&tiles=true&resource-type-filter=%5B%7B%22graphid%22%3A%22076f9381-7b00-11e9-8d6b-80000b44d1d9%22%2C%22name%22%3A%22Heritage%20Asset%22%2C%22inverted%22%3Afalse%7D%5D');
    });

    it('Create a heritage asset', function () {
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if (!$el.find('.search-listing').length > 0) {
                    // If no Heritage Assets exist create an empty heritage asset
                    cy.visit('http://localhost:8000/add-resource/076f9381-7b00-11e9-8d6b-80000b44d1d9')
                    cy.get('button').contains('Add').click();
                }; 
            })
        });
    });
});
