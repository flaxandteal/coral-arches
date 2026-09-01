describe('Going through the risk assessment Workflow', function () {

    beforeEach(() => {
        cy.login();
        cy.visit('/plugins/init-workflow');
    });

    // BLOCKED - not an empty test.
    //
    // The Risk Assessment launcher (open-risk-assessment-workflow.js,
    // `stateMonumentString`) only lists Heritage Assets whose "Recommended
    // designation, identification and protection" concept-list
    // (node 74ef37e0-37b5-11ef-9263-0242ac150006) equals concept value
    // 8da10724-1bd3-c095-6d4d-fb8657574b40.
    //
    // That concept value does not exist in the loaded reference data - neither
    // it nor the node's rdmCollection (34573061-2a22-decd-e2e3-559791d35efa) is
    // present in the concepts table, and arches refuses to store it
    // ("This UUID is not an available concept value"). So the HA dropdown always
    // returns "No results found" and "Start New" stays disabled - the workflow
    // cannot be entered at all.
    //
    // Unblocking this needs either the missing reference data loaded, or the
    // plugin's hard-coded concept id corrected. Until then this is skipped
    // rather than left as an empty body, which used to report a false pass.
    it.skip('Start new and go through the workflow and populate all fields', function () {
        cy.get('[href="/plugins/open-risk-assessment-workflow?workflow-slug=risk-assessment-workflow"] > .workflow-select-card > .workflow-select-wf-circle').click();
        cy.wait(4000);
        cy.get('.select2-selection').filter(':visible').first().click();
        cy.wait(3000);
        cy.get('.select2-results__option')
            .not('.loading-results')
            .not('.select2-results__option--load-more')
            .first()
            .click();
        cy.wait(2000);
        cy.contains('Start New').click();
        cy.wait(8000);
        cy.workflowNext();
    });
});
