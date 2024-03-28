define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/enforcement-workflow/enforcement-summary-step.htm'
], function (ko, SummaryStep, pageTemplate) {
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
      label: 'Enforcement Report',
      reference: {
        label: 'System Reference',
        nodegroupId: 'ba39c036-b551-11ee-94ee-0242ac120006',
        renderNodeIds: ['ba3a083e-b551-11ee-94ee-0242ac120006']
      },
      caseRef: {
        label: 'Case Reference',
        nodegroupId: '074effd0-b5e8-11ee-8e91-0242ac120006',
        renderNodeIds: ['074f0746-b5e8-11ee-8e91-0242ac120006']
      },
      reasonDesc: {
        label: 'Reason Description',
        nodegroupId: '89bf628e-b552-11ee-805b-0242ac120006',
        renderNodeIds: ['89bf6c48-b552-11ee-805b-0242ac120006']
      },
      flaggedDate: {
        label: 'Flagged Date',
        nodegroupId: '229501c2-b552-11ee-805b-0242ac120006',
        renderNodeIds: ['2295085c-b552-11ee-805b-0242ac120006']
      },
      associatedActors: {
        label: 'Flagged By',
        nodegroupId: 'f0b99550-b551-11ee-805b-0242ac120006',
        renderNodeIds: ['f0b9edd4-b551-11ee-805b-0242ac120006']
      },
      associatedResources: {
        label: 'Resources',
        nodegroupId: 'a78e548a-b554-11ee-805b-0242ac120006'
      }
    };

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.consultationNodes);
    };

    this.loadData();
  }

  ko.components.register('enforcement-summary-step', {
    viewModel: viewModel,
    template: pageTemplate
  });
  return viewModel;
});
