define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/flag-enforcement-workflow/flag-enforcement-summary.htm'
], function (ko, SummaryStep, flagEnforcementSummaryTemplate) {
  function viewModel(params) {
    SummaryStep.apply(this, [params]);

    /**
     * {
     *    name: 'example-1',
     *    exampleNodegroup: {
     *      label: String, // Appears as group title
     *      nodegroupId: UUID, // Finds the nodegroup
     *      // Provide the string ids or an object with nodeId and additional propertys
     *      renderNodeIds: Array<String | Object>, // Leave null to render all from the group
     *      data: Array // Data from the nodes provided in renderNodeIds will appear here
     *    }
     * }
     */

    this.consultationNodes = {
      id: 'consultation',
      label: 'Consultation',
      enforcement: {
        label: 'Enforcement',
        nodegroupId: '8e5cdd80-7fc9-11ee-b550-0242ac130008'
      }
    };

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.consultationNodes);

      console.log('Enforcement Summary Step: ', this.renderedNodegroups());
    };

    this.loadData();
  }

  ko.components.register('flag-enforcement-summary', {
    viewModel: viewModel,
    template: flagEnforcementSummaryTemplate
  });
  return viewModel;
});
