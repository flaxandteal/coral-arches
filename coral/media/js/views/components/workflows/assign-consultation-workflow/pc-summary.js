define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/assign-consultation-workflow/pc-summary.htm'
], function (ko, SummaryStep, template) {
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
      label: 'Planning Consultation',
      planningRef: {
        label: 'Planning Reference',
        nodegroupId: 'b4974044-c768-11ee-a945-0242ac180006',
        renderNodeIds: [{ nodeId: 'b4974a58-c768-11ee-a945-0242ac180006', label: 'Reference' }]
      },
      cmRef: {
        label: 'CM Reference',
        nodegroupId: '9d158534-c768-11ee-a945-0242ac180006',
        renderNodeIds: [{ nodeId: '9d15ac44-c768-11ee-a945-0242ac180006', label: 'Reference' }]
      },
      difReceivedDate: {
        label: 'DIF Received Date',
        nodegroupId: '04492152-c769-11ee-82c4-0242ac180006',
        renderNodeIds: [{ nodeId: '04494bbe-c769-11ee-82c4-0242ac180006', label: 'Date' }]
      },
      applicationType: {
        label: 'Application Type',
        nodegroupId: '54de6acc-8895-11ea-9067-f875a44e0e11',
        renderNodeIds: [{ nodeId: '54de6acc-8895-11ea-9067-f875a44e0e11', label: 'Type' }]
      },
      targetDate: {
        label: 'Target Date',
        nodegroupId: 'a5e15f5c-51a3-11eb-b240-f875a44e0e11',
        renderNodeIds: [{ nodeId: '06adec44-69b7-11ee-908a-0242ac120002', label: 'Date' }]
      },
      hierarchy: {
        label: 'Hierarchy',
        nodegroupId: '0dd6ccb8-cffe-11ee-8a4e-0242ac180006',
        renderNodeIds: [{ nodeId: '0dd6ccb8-cffe-11ee-8a4e-0242ac180006', label: 'Type' }]
      },
      classificationType: {
        label: 'Classification Type',
        nodegroupId: '86caf026-c76c-11ee-bf7c-0242ac180006',
        renderNodeIds: [{ nodeId: '86caf026-c76c-11ee-bf7c-0242ac180006', label: 'Type' }]
      },
      developmentType: {
        label: 'Development Type',
        nodegroupId: '73fdfe62-8895-11ea-a058-f875a44e0e11',
        renderNodeIds: [{ nodeId: '73fdfe62-8895-11ea-a058-f875a44e0e11', label: 'Type' }]
      },
      contacts: {
        label: 'Contacts',
        nodegroupId: '4ea4a189-184f-11eb-b45e-f875a44e0e11',
        renderNodeIds: [
          '4ea4a192-184f-11eb-a0d6-f875a44e0e11',
          '4ea4a19a-184f-11eb-aef8-f875a44e0e11',
          '4ea4c884-184f-11eb-b64d-f875a44e0e11'
        ]
      },
      consultationDates: {
        label: 'Date Consulted',
        nodegroupId: '40eff4c9-893a-11ea-ac3a-f875a44e0e11',
        renderNodeIds: [{ nodeId: '40eff4cd-893a-11ea-b0cc-f875a44e0e11', label: 'Date' }]
      },
      consultationDescriptions: {
        label: 'Application Reason',
        nodegroupId: '82f8a163-951a-11ea-b58e-f875a44e0e11',
        renderNodeIds: [{ nodeId: '82f8a166-951a-11ea-bdad-f875a44e0e11', label: 'Description' }]
      },
      proposal: {
        label: 'Proposal',
        nodegroupId: '1b0e15e9-8864-11ea-b5f3-f875a44e0e11',
        renderNodeIds: [{ nodeId: '1b0e15ec-8864-11ea-8493-f875a44e0e11', label: 'Description' }]
      },
      addressDetails: {
        label: 'Address Details',
        nodegroupId: '083e14f2-ca61-11ee-afca-0242ac180006',
        renderNodeIds: [
          { nodeId: '083e6c90-ca61-11ee-afca-0242ac180006', label: 'Full Address' },
          { nodeId: '083e8f4a-ca61-11ee-afca-0242ac180006', label: 'Street' },
          { nodeId: '083f8ad0-ca61-11ee-afca-0242ac180006', label: 'Town or City' },
          { nodeId: '083fafe2-ca61-11ee-afca-0242ac180009', label: 'County' },
          { nodeId: '083f8f26-ca61-11ee-afca-0242ac180006', label: 'Postcode' }
        ]
      },
      council: {
        label: 'Council',
        nodegroupId: '69500360-d7c5-11ee-a011-0242ac120006',
        renderNodeIds: [{ nodeId: '69500360-d7c5-11ee-a011-0242ac120006', label: 'Selection' }]
      },
      irishGridRef: {
        label: 'Irish Grid Reference',
        nodegroupId: '083e226c-ca61-11ee-afca-0242ac180006',
        renderNodeIds: [{ nodeId: 'ac3eb490-1682-11ef-b68e-0242ac120006', label: 'Reference (TM65)' }]
      },
      areaNames: {
        label: 'Localities/Administrative Areas',
        nodegroupId: '083dc93e-ca61-11ee-afca-0242ac180006',
        renderNodeIds: [
          { nodeId: '083f0db2-ca61-11ee-afca-0242ac180006', label: 'Area Type' },
          { nodeId: '083ea3ae-ca61-11ee-afca-0242ac180006', label: 'Area Name' }
        ]
      },
      locationDescription: {
        label: 'Location Description',
        nodegroupId: '083e1bb4-ca61-11ee-afca-0242ac180006',
        renderNodeIds: [{ nodeId: '083eae58-ca61-11ee-afca-0242ac180006', label: 'Description' }]
      },
      assignment: {
        label: 'Assignment',
        nodegroupId: 'dc9bfb24-cfd9-11ee-8cc1-0242ac180006',
        renderNodeIds: [
          { nodeId: '6b8f5866-2f0d-11ef-b37c-0242ac140006', label: 'Team' },
          { nodeId: 'fbdd2304-cfda-11ee-8cc1-0242ac180006', label: 'Re-Assigned To' },
          { nodeId: '50d15bec-cfda-11ee-8cc1-0242ac180006', label: 'Assigned To' }
        ]
      }
    };

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.consultationNodes);

      console.log('PC Summary: ', this.renderedNodegroups());
    };

    this.loadData();
  }

  ko.components.register('pc-summary', {
    viewModel: viewModel,
    template: template
  });
  return viewModel;
});
