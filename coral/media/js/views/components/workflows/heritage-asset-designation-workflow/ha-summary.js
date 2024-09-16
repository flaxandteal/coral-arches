define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/heritage-asset-designation-workflow/ha-summary.htm'
], function (ko, SummaryStep, licenceFinalStepTemplate) {
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

    this.heritageAssetNodes = {
      id: 'heritage-asset',
      label: 'Heritage Asset',
      systemRef: {
        label: 'HA References',
        nodegroupId: '2948f54a-3aaf-11ef-91fd-0242ac120003',
        renderNodeIds: [
          {nodeId: '7968e094-3aaf-11ef-91fd-0242ac120003', label: 'IHR Number'},
          {nodeId: 'e7ee4eaa-3aaf-11ef-a2d0-0242ac120003', label: 'Historic Parks and Gardens Number'},
          {nodeId: 'b6ec253e-3aaf-11ef-a2d0-0242ac120003', label: 'HB Number'},
          {nodeId: '59a7f542-3aaf-11ef-a2d0-0242ac120003', label: 'SMR Number'}

        ]
      },
      name: {
        label: 'Heritage Asset Name',
        nodegroupId: 'ae8896cd-e16f-44db-97c7-ea412534e3e3',
        renderNodeIds: [{nodeId: '987c6b22-42a3-4d76-a683-d3588f5cf7e2', label: 'Name'}]
      },
      monumentType: {
        label: 'Monument Type',
        nodegroupId: '8b94df3e-233f-11ef-89fe-0242ac1a0006',
        renderNodeIds: [{nodeId: '8b94df3e-233f-11ef-89fe-0242ac1a0006', label: 'Type'}]
      },
      historicalPeriod: {
        label: 'Historical Period',
        nodegroupId: '6b701e04-1f3d-11ef-bf79-0242ac150006',
        renderNodeIds: [{nodeId: '6b701e04-1f3d-11ef-bf79-0242ac150006', label: 'Type'}]
      },
      addressesTownland: {
        label: 'Townland',
        nodegroupId: '38dad285-9014-4c7b-ad81-b0562038ebf2',
        renderNodeIds: ['1db0ed52-3521-11ef-850f-0242ac120003']
      },
      irishGridReference: {
        label: 'Irish Grid Reference (TM65)',
        nodegroupId: 'e290279d-9857-441e-a511-50d9d4dc4210',
        renderNodeIds: ['86057658-1685-11ef-b341-0242ac120006']
      },
      descriptions: {
        label: 'Description',
        nodegroupId: '050b959f-c4d8-4a2b-a704-94cc3e00d7ca',
        renderNodeIds: [
          '1afcb89e-fe8f-463b-bc76-cd2b5e241616',
          '2f4a6ae8-2244-4e6f-83ff-652158a245cf'
        ]
      }
    };

    // this.coverLetterHtml = ko.observable();

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.heritageAssetNodes);

      // let digitalFileResourceIds = this.getResourceIds(this.licenceNodes.id, 'digitalFiles');

      // await this.renderResourceIds(
      //   this.getResourceIds(this.licenceNodes.id, 'associatedActivities'),
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
      //     this.licenceNodes.id,
      //     'coverLetter',
      //     '72e0fc96-53d5-11ee-844f-0242ac130008'
      //   )
      // );

      console.log('HA Summary: ', this.renderedNodegroups());
    };

    this.loadData();
  }

  ko.components.register('ha-summary', {
    viewModel: viewModel,
    template: licenceFinalStepTemplate
  });
  return viewModel;
});
