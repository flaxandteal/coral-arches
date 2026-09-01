describe('Creating a bibliographic named Test Bibliographic if one doesnt exist', function () {
    beforeEach(() => {
        cy.login();
    });

    it('Create an bibliographic source', function () {
        cy.visit('/add-resource/d4a88461-5463-11e9-90d9-000d3ab1e588');
        cy.contains('Bibliographic Source Citation').click();
        cy.wait(2000);
        cy.contains('Add new Relationship').click();
        cy.wait(4000);

        // Use the relationship dropdown itself as the existence check: arches
        // only offers "Create a new Bibliographic Source . . ." when nothing
        // matches. The previous check scraped /search for `.search-listing`,
        // which finds nothing here (the seeded records are provisional), so it
        // always took the create branch and piled up duplicates.
        cy.get('.select2-results').then(($results) => {
            if ($results.text().includes('Create a new Bibliographic Source')) {
                cy.get('.select2-results').contains('Create a new Bibliographic Source').click();
                cy.get('[aria-label="Bibliographic Source Name"]').click().type('Test Bibliographic');
                cy.get('.btn').contains('Add').click();
            } else {
                // Already seeded — assert it really is there rather than passing blindly.
                cy.get('.select2-results').should('contain', 'Test Bibliographic');
            }
        });
    });
});
