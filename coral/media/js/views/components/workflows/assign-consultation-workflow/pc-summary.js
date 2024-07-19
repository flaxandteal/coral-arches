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
        renderNodeIds: [{nodeId: 'b4974a58-c768-11ee-a945-0242ac180006', label: 'Reference'}]
      },
      cmRef: {
        label: 'CM Reference',
        nodegroupId: '9d158534-c768-11ee-a945-0242ac180006',
        renderNodeIds: [{nodeId: '9d15ac44-c768-11ee-a945-0242ac180006', label: 'Reference'}]
      },
      difReceivedDate: {
        label: 'DIF Received Date',
        nodegroupId: '04492152-c769-11ee-82c4-0242ac180006',
        renderNodeIds: [{nodeId: '04494bbe-c769-11ee-82c4-0242ac180006', label: 'Date'}]
      },
      applicationType: {
        label: 'Application Type',
        nodegroupId: '54de6acc-8895-11ea-9067-f875a44e0e11',
        renderNodeIds: [{nodeId: '54de6acc-8895-11ea-9067-f875a44e0e11', label: 'Type'}]
      },
      hierarchy: {
        label: 'Hierarchy',
        nodegroupId: '0dd6ccb8-cffe-11ee-8a4e-0242ac180006',
        renderNodeIds: [{nodeId: '0dd6ccb8-cffe-11ee-8a4e-0242ac180006', label: 'Type'}]
      },
      classificationType: {
        label: 'Classification Type',
        nodegroupId: '86caf026-c76c-11ee-bf7c-0242ac180006',
        renderNodeIds: [{nodeId: '86caf026-c76c-11ee-bf7c-0242ac180006', label: 'Type'}]
      },
      developmentType: {
        label: 'Development Type',
        nodegroupId: '73fdfe62-8895-11ea-a058-f875a44e0e11',
        renderNodeIds: [{nodeId: '73fdfe62-8895-11ea-a058-f875a44e0e11', label: 'Type'}]
      },
      contacts: {
        label: 'Contacts',
        nodegroupId: '4ea4a189-184f-11eb-b45e-f875a44e0e11',
        renderNodeIds: ['4ea4a192-184f-11eb-a0d6-f875a44e0e11', '4ea4a19a-184f-11eb-aef8-f875a44e0e11', '4ea4c884-184f-11eb-b64d-f875a44e0e11']
      },
      consultationDates: {
        label: 'Date Consulted',
        nodegroupId: '40eff4c9-893a-11ea-ac3a-f875a44e0e11',
        renderNodeIds: [{nodeId: '40eff4cd-893a-11ea-b0cc-f875a44e0e11', label: 'Date'}]
      },
      consultationDescriptions: {
        label: 'Application Reason',
        nodegroupId: '82f8a163-951a-11ea-b58e-f875a44e0e11',
        renderNodeIds: [{nodeId: '82f8a166-951a-11ea-bdad-f875a44e0e11', label: 'Description'}]
      },
      proposal: {
        label: 'Proposal',
        nodegroupId: '1b0e15e9-8864-11ea-b5f3-f875a44e0e11',
        renderNodeIds: [{nodeId: '1b0e15ec-8864-11ea-8493-f875a44e0e11', label: 'Description'}]
      },
      // name: {
      //   label: 'Heritage Asset Name',
      //   nodegroupId: 'ae8896cd-e16f-44db-97c7-ea412534e3e3',
      //   renderNodeIds: [{nodeId: '987c6b22-42a3-4d76-a683-d3588f5cf7e2', label: 'Name'}]
      // },
      // monumentType: {
      //   label: 'Monument Type',
      //   nodegroupId: '8b94df3e-233f-11ef-89fe-0242ac1a0006',
      //   renderNodeIds: [{nodeId: '8b94df3e-233f-11ef-89fe-0242ac1a0006', label: 'Type'}]
      // },
      // historicalPeriod: {
      //   label: 'Historical Period',
      //   nodegroupId: '6b701e04-1f3d-11ef-bf79-0242ac150006',
      //   renderNodeIds: [{nodeId: '6b701e04-1f3d-11ef-bf79-0242ac150006', label: 'Type'}]
      // },
      // addressesTownland: {
      //   label: 'Townland',
      //   nodegroupId: '38dad285-9014-4c7b-ad81-b0562038ebf2',
      //   renderNodeIds: ['1db0ed52-3521-11ef-850f-0242ac120003']
      // },
      // descriptions: {
      //   label: 'Description',
      //   nodegroupId: '050b959f-c4d8-4a2b-a704-94cc3e00d7ca',
      //   renderNodeIds: [
      //     '1afcb89e-fe8f-463b-bc76-cd2b5e241616',
      //     '2f4a6ae8-2244-4e6f-83ff-652158a245cf'
      //   ]
      // }
    };

    // this.coverLetterHtml = ko.observable();

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.consultationNodes);

      // let digitalFileResourceIds = this.getResourceIds(this.licenseNodes.id, 'digitalFiles');

      // await this.renderResourceIds(
      //   this.getResourceIds(this.licenseNodes.id, 'associatedActivities'),
      //   this.activityNodes
      // );
      // await this.renderResourceIds(
      //   this.getResourceIds(this.activityNodes.id, 'associatedActivities'),
      //   this.activityNodes
      // );

      // digitalFileResourceIds = [
      //   ...digitalFileResourceIds,
      //   ...this.getResourceIds(this.activityNodes.id, 'digitalFiles')
      // ];

      // await this.renderResourceIds(digitalFileResourceIds, this.digitalFilesNodes);

      // this.coverLetterHtml(
      //   this.getDisplayValue(
      //     this.licenseNodes.id,
      //     'coverLetter',
      //     '72e0fc96-53d5-11ee-844f-0242ac130008'
      //   )
      // );

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
