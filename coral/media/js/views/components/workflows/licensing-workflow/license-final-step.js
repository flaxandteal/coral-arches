define([
  'knockout',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/licensing-workflow/license-final-step.htm'
], function (ko, SummaryStep, licenseFinalStepTemplate) {
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

    this.licenseNodes = {
      id: 'license',
      label: 'License',
      contacts: {
        label: 'Contacts',
        nodegroupId: '6d290832-5891-11ee-a624-0242ac120004',
        renderNodeIds: [
          '6d292f88-5891-11ee-a624-0242ac120004',
          '6d2924b6-5891-11ee-a624-0242ac120004',
          '6d294784-5891-11ee-a624-0242ac120004',
          '6d292a2e-5891-11ee-a624-0242ac120004'
        ]
      },
      dates: {
        label: 'Dates',
        nodegroupId: '05f6b846-5d49-11ee-911e-0242ac130003'
      },
      status: {
        label: 'Application Status',
        nodegroupId: 'ee5947c6-48b2-11ee-abec-0242ac140007'
      },
      decisionMadeBy: {
        label: 'Decision',
        nodegroupId: '2749ea5a-48cb-11ee-be76-0242ac140007',
        renderNodeIds: [
          '4c58921e-48cc-11ee-9081-0242ac140007',
          '25f04f6c-48cd-11ee-94b3-0242ac140007',
          'f3dcbf02-48cb-11ee-9081-0242ac140007',
          'f6c207ae-5938-11ee-9e74-0242ac130007'
        ]
      },
      report: {
        label: 'Report',
        nodegroupId: 'f060583a-6120-11ee-9fd1-0242ac120003',
        renderNodeIds: [
          'd8f74d42-dc6e-11ee-8def-0242ac120006',
          '59b77af6-dc6f-11ee-8def-0242ac120006',
          '8d13575c-dc70-11ee-8def-0242ac120006',
          'ea6ea7a8-dc70-11ee-b70c-0242ac120006',
          '5707d294-dc72-11ee-b70c-0242ac120006',
          'bcee40e6-dc74-11ee-8def-0242ac120006',
          'dc960c08-dc74-11ee-8def-0242ac120006',
          'cc4c862a-dc78-11ee-b70c-0242ac120006',
          '0a089af2-dc7a-11ee-8def-0242ac120006',
          '39fc595c-dc79-11ee-8def-0242ac120006'
        ]
      },
      systemRef: {
        label: 'System Reference',
        nodegroupId: '991c3c74-48b6-11ee-85af-0242ac140007',
        renderNodeIds: [{ nodeId: '991c49b2-48b6-11ee-85af-0242ac140007', label: 'Application ID' }]
      },
      applicationDetails: {
        label: 'Application Details',
        nodegroupId: '4f0f655c-48cf-11ee-8e4e-0242ac140007',
        renderNodeIds: [
          'aec103a2-48cf-11ee-8e4e-0242ac140007',
          'c2f40174-5dd5-11ee-ae2c-0242ac120008'
        ]
      },
      externalRef: {
        label: 'External Reference',
        nodegroupId: '280b6cfc-4e4d-11ee-a340-0242ac140007',
        renderNodeIds: [{ nodeId: '280b75bc-4e4d-11ee-a340-0242ac140007', label: 'License Number' }]
      },
      excavationType: {
        label: 'Excavation Type',
        nodegroupId: '6e071042-5d45-11ee-88b0-0242ac120008',
        renderNodeIds: ['6e071042-5d45-11ee-88b0-0242ac120008']
      },
      communication: {
        label: 'Email',
        nodegroupId: '6840f820-48ce-11ee-8e4e-0242ac140007',
        renderNodeIds: [
          '684110e4-48ce-11ee-8e4e-0242ac140007',
          '68410b3a-48ce-11ee-8e4e-0242ac140007',
          { nodeId: '684113a0-48ce-11ee-8e4e-0242ac140007', defaultValue: 'None Provided' }
        ]
      },
      associatedActivities: {
        label: 'Associated Activities',
        nodegroupId: 'a9f53f00-48b6-11ee-85af-0242ac140007'
      },
      digitalFiles: {
        label: 'Digital Files',
        nodegroupId: '8c5356f4-48ce-11ee-8e4e-0242ac140007'
      },
      coverLetter: {
        visible: false,
        nodegroupId: '0dcf7c74-53d5-11ee-844f-0242ac130008',
        renderNodeIds: ['72e0fc96-53d5-11ee-844f-0242ac130008']
      }
    };

    this.activityNodes = {
      id: 'activity',
      label: 'Activity',
      name: {
        label: 'Name',
        nodegroupId: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
        renderNodeIds: ['4a7be135-9938-11ea-b0e2-f875a44e0e11']
      },
      systemRef: {
        label: 'System Reference',
        nodegroupId: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
        renderNodeIds: [
          { nodeId: 'e7d69603-9939-11ea-9e7f-f875a44e0e11', label: 'Application ID' },
          { nodeId: 'e7d69604-9939-11ea-baef-f875a44e0e11', label: 'Planning Reference' }
        ]
      },
      externalRef: {
        label: 'External Reference',
        nodegroupId: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
        renderNodeIds: [
          '589d4dc7-edf9-11eb-9856-a87eeabdefba',
          '589d4dca-edf9-11eb-83ea-a87eeabdefba'
        ]
      },
      areaType: {
        label: 'Area',
        nodegroupId: 'a5416b46-f121-11eb-8f2d-a87eeabdefba',
        renderNodeIds: [
          'a5416b53-f121-11eb-a507-a87eeabdefba',
          'a541922e-f121-11eb-b2f6-a87eeabdefba'
        ]
      },
      address: {
        label: 'Address',
        nodegroupId: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
        renderNodeIds: [
          'a5419224-f121-11eb-9ca7-a87eeabdefba',
          'a541e034-f121-11eb-8803-a87eeabdefba',
          'a541e030-f121-11eb-aaf7-a87eeabdefba',
          'a541e029-f121-11eb-802c-a87eeabdefba',
          'a541e027-f121-11eb-ba26-a87eeabdefba',
          'a541e025-f121-11eb-8212-a87eeabdefba',
          'a541e023-f121-11eb-b770-a87eeabdefba',
          'a541b930-f121-11eb-a30c-a87eeabdefba',
          'a541b927-f121-11eb-8377-a87eeabdefba',
          'a541b925-f121-11eb-9264-a87eeabdefba',
          'a541b922-f121-11eb-9fa2-a87eeabdefba'
        ]
      },
      associatedActivities: {
        label: 'Associated Activities',
        nodegroupId: 'ea059ab7-83d7-11ea-a3c4-f875a44e0e11'
      },
      digitalFiles: {
        label: 'Digital Files',
        nodegroupId: '316c7d1e-8554-11ea-aed7-f875a44e0e11'
      }
    };

    this.digitalFilesNodes = {
      id: 'digital-files',
      label: 'Digital Object',
      name: {
        label: 'Name',
        nodegroupId: 'c61ab163-9513-11ea-9bb6-f875a44e0e11',
        renderNodeIds: ['c61ab16c-9513-11ea-89a4-f875a44e0e11']
      },
      files: {
        label: 'Files',
        nodegroupId: '7db68c6c-8490-11ea-a543-f875a44e0e11',
        renderNodeIds: ['96f8830a-8490-11ea-9aba-f875a44e0e11']
      }
    };

    this.coverLetterHtml = ko.observable();

    this.getData = async () => {
      await this.renderResourceIds(this.resourceid, this.licenseNodes);

      let digitalFileResourceIds = this.getResourceIds(this.licenseNodes.id, 'digitalFiles');

      await this.renderResourceIds(
        this.getResourceIds(this.licenseNodes.id, 'associatedActivities'),
        this.activityNodes
      );
      await this.renderResourceIds(
        this.getResourceIds(this.activityNodes.id, 'associatedActivities'),
        this.activityNodes
      );

      digitalFileResourceIds = [
        ...digitalFileResourceIds,
        ...this.getResourceIds(this.activityNodes.id, 'digitalFiles')
      ];

      await this.renderResourceIds(digitalFileResourceIds, this.digitalFilesNodes);

      this.coverLetterHtml(
        this.getDisplayValue(
          this.licenseNodes.id,
          'coverLetter',
          '72e0fc96-53d5-11ee-844f-0242ac130008'
        )
      );

      console.log('License Final Step: ', this.renderedNodegroups());
    };

    this.loadData();
  }

  ko.components.register('license-final-step', {
    viewModel: viewModel,
    template: licenseFinalStepTemplate
  });
  return viewModel;
});
