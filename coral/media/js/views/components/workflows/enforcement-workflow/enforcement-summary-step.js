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
      },
      name: {
        label: 'Name',
        nodegroupId: '2a6b7040-b555-11ee-baf6-0242ac120006',
        renderNodeIds: ['2a6b9840-b555-11ee-baf6-0242ac120006']
      },
      status: {
        label: 'Status',
        nodegroupId: 'ac823b90-b555-11ee-805b-0242ac120006',
        renderNodeIds: ['c9711ef6-b555-11ee-baf6-0242ac120006']
      },
      cMRef: {
        label: 'CM Reference',
        nodegroupId: '25e2611c-b557-11ee-805b-0242ac120006',
        renderNodeIds: ['25e26afe-b557-11ee-805b-0242ac120006']
      },
      crimeRef: {
        label: 'Crime References',
        nodegroupId: '0674ff12-b5e6-11ee-a372-0242ac120006',
        renderNodeIds: ['06750cf0-b5e6-11ee-a372-0242ac120006']
      },
      agreedAction: {
        label: 'Agreed Action Description',
        nodegroupId: '7b7c6466-b556-11ee-baf6-0242ac120006',
        renderNodeIds: ['7b7c6b00-b556-11ee-baf6-0242ac120006']
      },
      currentPosition: {
        label: 'Current Position Description',
        nodegroupId: 'b6cef4d4-b556-11ee-805b-0242ac120006',
        renderNodeIds: ['b6cefcb8-b556-11ee-805b-0242ac120006']
      },
      result: {
        label: 'Result Description',
        nodegroupId: 'f3fbe146-b556-11ee-805b-0242ac120006',
        renderNodeIds: ['f3fbe7b8-b556-11ee-805b-0242ac120006']
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
