import ko from 'knockout';
import SummaryStep from 'views/components/workflows/summary-step';
import template from 'templates/views/components/workflows/assign-consultation-workflow/pc-summary.htm';

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
      nodegroupId: 'f7aa45ad-8811-5bcf-b9cf-ac24b4a593ec',
      renderNodeIds: [{ nodeId: '8be0fb93-164a-5d51-904f-61a81b8f8b77', label: 'Reference' }]
    },
    cmRef: {
      label: 'CM Reference',
      nodegroupId: '82b4d25a-e6d1-5c54-b2a5-0ecfcd55f9c6',
      renderNodeIds: [{ nodeId: '92775edc-b192-5b1d-bd64-f2ad5befb8fa', label: 'Reference' }]
    },
    difReceivedDate: {
      label: 'DfI Received Date',
      nodegroupId: '4b195f82-50eb-5030-9f82-acdd3f7ba6c9',
      renderNodeIds: [{ nodeId: '932dee8f-ebc8-57ea-bac3-18920b43f4a6', label: 'Date' }]
    },
    applicationType: {
      label: 'Application Type',
      nodegroupId: '54de6acc-8895-11ea-9067-f875a44e0e11',
      renderNodeIds: [{ nodeId: '54de6acc-8895-11ea-9067-f875a44e0e11', label: 'Type' }]
    },
    targetDate: {
      label: 'Target Date',
      nodegroupId: 'a5e15f5c-51a3-11eb-b240-f875a44e0e11',
      renderNodeIds: [{ nodeId: '345e7fda-7f62-5e55-8fed-85e68b13dade', label: 'Date' }]
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
      nodegroupId: 'f4908c19-4196-5af0-964c-aa01f61acf4d',
      renderNodeIds: [
        { nodeId: '9e55221a-64dc-53df-808d-78239337f189', label: 'Building Name' },
        { nodeId: '99c2f475-8b28-548b-908d-e3d8be9ee299', label: 'Street' },
        { nodeId: 'c662b678-849d-53ba-89be-3f961fcb7a19', label: 'Town or City' },
        { nodeId: '083fafe2-ca61-11ee-afca-0242ac180009', label: 'County' },
        { nodeId: '70d69cb7-26a9-5234-ac38-4b968846247e', label: 'Postcode' },
        { nodeId: '083fafe2-345c-11ef-a5b7-0242ac120003', label: 'Townland' }
      ]
    },
    council: {
      label: 'Council',
      nodegroupId: '69500360-d7c5-11ee-a011-0242ac120006',
      renderNodeIds: [{ nodeId: '69500360-d7c5-11ee-a011-0242ac120006', label: 'Selection' }]
    },
    irishGridRef: {
      label: 'Irish Grid Reference',
      nodegroupId: 'ea3cf6bc-4cd8-5eb3-b9aa-dc81e3a0bc2a',
      renderNodeIds: [{ nodeId: 'ed684560-b4f7-5e43-ade8-33ed3bb699c4', label: 'Reference (TM65)' }]
    },
    areaNames: {
      label: 'Localities/Administrative Areas',
      nodegroupId: '1448f713-2d3d-5a71-8029-351537e5cadf',
      renderNodeIds: [
        { nodeId: '083f0db2-ca61-11ee-afca-0242ac180006', label: 'Area Type' },
        { nodeId: '083ea3ae-ca61-11ee-afca-0242ac180006', label: 'Area Name' }
      ]
    },
    locationDescription: {
      label: 'Location Description',
      nodegroupId: '8c2f532a-1a1b-5fd0-a9f7-fb66a934832e',
      renderNodeIds: [{ nodeId: '41dfc72c-2b8f-5462-b05d-76c588ac0b05', label: 'Description' }]
    },
    assignment: {
      label: 'Assignment',
      nodegroupId: '9898db6b-1a2f-5163-9df6-bf9cb92bf559',
      renderNodeIds: [
        { nodeId: '6b8f5866-2f0d-11ef-b37c-0242ac140006', label: 'Team' },
        // { nodeId: '7b4b1596-5592-544b-9651-ecf800202f98', label: 'Re-Assigned To' },
        { nodeId: '16b43c47-0513-5c96-b817-030d200d113b', label: 'Assigned To' }
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

export default viewModel;
