describe('Creating a Heritage Asset named HA/01 if it doesnt exist', function () {
    beforeEach(() => {
        cy.login();
    });

    it('Create a heritage asset', function () {
        cy.visit('/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=1&term-filter=%5B%7B%22inverted%22%3Afalse%2C%22type%22%3A%22string%22%2C%22context%22%3A%22%22%2C%22context_label%22%3A%22%22%2C%22id%22%3A%22%20HA%2F01%20Building1%22%2C%22text%22%3A%22%20HA%2F01%20Building1%22%2C%22value%22%3A%22%20HA%2F01%20Building1%22%2C%22selected%22%3Atrue%7D%5D&language=*&resource-type-filter=%5B%7B%22graphid%22%3A%22076f9381-7b00-11e9-8d6b-80000b44d1d9%22%2C%22name%22%3A%22Heritage%20Asset%22%2C%22inverted%22%3Afalse%7D%5D');
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if (!$el.find('.search-listing').length > 0) {
                    cy.contains('Workflows').click();
                    cy.contains('Add Monument').click();
                    cy.contains('Start New').click();
                    cy.contains('Save and Continue').click();
                    cy.get('[aria-label="Site Name"]').should('be.visible').type('Building1');
                    cy.wait(1000);
                    cy.contains('Save and Complete Workflow').click();                 
                }; 
            })
        });
    });

    it('Create a second heritage asset', function () {
        cy.visit('/search?paging-filter=1&tiles=true&format=tilecsv&reportlink=false&precision=6&total=1&term-filter=%5B%7B%22inverted%22%3Afalse%2C%22type%22%3A%22string%22%2C%22context%22%3A%22%22%2C%22context_label%22%3A%22%22%2C%22id%22%3A%22%20HA%2F02%20Building2%22%2C%22text%22%3A%22%20HA%2F02%20Building2%22%2C%22value%22%3A%22%20HA%2F02%20Building2%22%2C%22selected%22%3Atrue%7D%5D&language=*&resource-type-filter=%5B%7B%22graphid%22%3A%22076f9381-7b00-11e9-8d6b-80000b44d1d9%22%2C%22name%22%3A%22Heritage%20Asset%22%2C%22inverted%22%3Afalse%7D%5D');
        cy.wait(5000).then(() => {
            cy.get('#search-results-list').then(($el) => {
                if (!$el.find('.search-listing').length > 0) {
                    cy.contains('Workflows').click();
                    cy.contains('Add Monument').click();
                    cy.contains('Start New').click();
                    cy.contains('Save and Continue').click();
                    cy.wait(1000);
                    cy.get('[aria-label="Site Name"]').should('be.visible').type('Building2');
                    cy.contains('Save and Complete Workflow').click();                 
                }; 
            })
        });
    });
});
