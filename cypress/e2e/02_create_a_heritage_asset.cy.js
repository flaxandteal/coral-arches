describe('Creating a Heritage Asset named TestAsset if it doesnt exist', function () {
    beforeEach(() => {
        cy.login();
        cy.visit('/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=336&term-filter=%5B%7B%22inverted%22%3Afalse%2C%22type%22%3A%22string%22%2C%22context%22%3A%22%22%2C%22context_label%22%3A%22%22%2C%22id%22%3A%22TestAsset%22%2C%22text%22%3A%22TestAsset%22%2C%22value%22%3A%22TestAsset%22%2C%22selected%22%3Atrue%7D%5D&language=*');
    });

    it('Create a heritage asset', function () {
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if (!$el.find('.search-listing').length > 0) {
                    // If no Heritage Assets exist create an empty heritage asset
                    cy.visit('/add-resource/076f9381-7b00-11e9-8d6b-80000b44d1d9')
                    cy.contains('Heritage Asset Names').click();
                    cy.get('[aria-label="Name"]').should('be.visible').type('TestAsset');
                    cy.get('button').contains('Add').click();
                }; 
            })
        });
    });
});
