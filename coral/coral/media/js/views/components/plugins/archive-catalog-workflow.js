define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/related-document-upload'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('archive-catalog-workflow', {
    viewModel: function (params) {
      this.componentName = 'archive-catalog-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Archive Source',
          name: 'init-step',
          required: true,
          informationboxdata: {
            heading: 'Important Information',
            text: 'Please note that it could take up to a minute to complete the initialisation for the License application. If something goes wrong during the process an error will be displayed to you.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '3bdc39f8-9a93-11ea-b807-f875a44e0e11',
                    hiddenNodes: [
                      '3bdc39fd-9a93-11ea-83f6-f875a44e0e11',
                      '3bdc39fb-9a93-11ea-b4fe-f875a44e0e11',
                      '3bdc39fe-9a93-11ea-a936-f875a44e0e11',
                      '3bdc3a00-9a93-11ea-8254-f875a44e0e11'
                    ],
                    labels: [['ResourceID', 'File ID (key)']]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Archive Source Details',
          name: 'app-details-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'source-title',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                    hiddenNodes: [
                      '145f9619-9ad2-11ea-83ec-f875a44e0e11',
                      '145f961a-9ad2-11ea-948a-f875a44e0e11',
                      '145f9618-9ad2-11ea-925e-f875a44e0e11'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    labels: [['Archive Source Name', 'File title']],
                    prefilledNodes: [
                      [
                        '145f9618-9ad2-11ea-925e-f875a44e0e11',
                        '500a41d4-e52b-4448-9c08-fe9f0de7d8da'
                      ]
                    ]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'source-subtitle',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                    hiddenNodes: [
                      '145f9619-9ad2-11ea-83ec-f875a44e0e11',
                      '145f961a-9ad2-11ea-948a-f875a44e0e11',
                      '145f9618-9ad2-11ea-925e-f875a44e0e11'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    labels: [['Archive Source Name', 'Subtitle']],
                    prefilledNodes: [
                      [
                        '145f9618-9ad2-11ea-925e-f875a44e0e11',
                        'c109d688-2ff4-45c5-873c-1a2ebc93d4fa'
                      ]
                    ]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'archive-name',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '145f9618-9ad2-11ea-925e-f875a44e0e11', // archive_source_name_use_type,
                      '145f9619-9ad2-11ea-83ec-f875a44e0e11', // archive_source_name_currency,
                      '145f961a-9ad2-11ea-948a-f875a44e0e11', // archive_source_name_type,
                      // '145f961b-9ad2-11ea-bf90-f875a44e0e11', // archive_source_name,
                      '145f961c-9ad2-11ea-a0f2-f875a44e0e11', // archive_source_name_metatype,
                      '145f961d-9ad2-11ea-bb96-f875a44e0e11', // archive_source_name_use_metatype,
                      '145f961e-9ad2-11ea-bbd1-f875a44e0e11' // archive_source_name_currency_metatype
                    ]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'archive-type',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: 'c78190bf-1aba-11ec-8bb8-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'archive-description',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '6a7f6b8b-9ad3-11ea-a265-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: ['6a7f9283-9ad3-11ea-992b-f875a44e0e11']
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'archive-holding',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '66576cda-9b69-11ea-9143-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '66576cda-9b69-11ea-9143-f875a44e0e11',
                      'e31709dd-b469-11ea-ae1c-f875a44e0e11',
                      'c69aa19d-fe7b-11ea-9e10-f875a44e0e11',
                      '3001afdf-b46a-11ea-a528-f875a44e0e11'
                    ],
                    hiddenCard: true
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Archive Source Creation',
          name: 'app-creation-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'source-creation',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '3001afdf-b46a-11ea-a528-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['app-details-step']['archive-holding'][0]['tileId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Repository Storage Location',
          name: 'app-location-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'source-location',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: 'c69aa19d-fe7b-11ea-9e10-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['app-details-step']['archive-holding'][0]['tileId']",
                    labels: [['Repository owner', 'Responsible Team(s)']]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Repository Loan History',
          name: 'loan-history',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'source-loan-history',
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: '557ea8f6-8d37-11ee-9a1b-0242ac130004',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['app-details-step']['archive-holding'][0]['tileId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Audit Information',
          name: 'loan-history',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'audit-step',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                    nodegroupid: 'a919d0f9-ee15-11eb-aef6-a87eeabdefba',
                    semanticName: 'Audit Metadata'
                    // "hiddenNodes": [
                    //   'a919d0fc-ee15-11eb-a3c0-a87eeabdefba', // creator_name_type,
                    //   'a919d0fd-ee15-11eb-acd0-a87eeabdefba', // creation_date_qualifier_metatype,
                    //   'a919d0fe-ee15-11eb-ab36-a87eeabdefba', // creation_end_date,
                    //   'a919d0ff-ee15-11eb-8376-a87eeabdefba', // audit_notes_metatype,
                    //   'a919d101-ee15-11eb-86b7-a87eeabdefba', // update_name_metatype,
                    //   'a919d102-ee15-11eb-941c-a87eeabdefba', // creation_date,
                    //   'a919d103-ee15-11eb-b718-a87eeabdefba', // updater_name_type,
                    //   'a919d104-ee15-11eb-9bf1-a87eeabdefba', // creator_name_use_metatype,
                    //   'a919d105-ee15-11eb-a8e4-a87eeabdefba', // update_date_qualifier_metatype,
                    //   'a919d107-ee15-11eb-8238-a87eeabdefba', // creator_name_use_type,
                    //   'a919d108-ee15-11eb-bd9e-a87eeabdefba', // creator_name_currency,
                    //   'a919d109-ee15-11eb-bd82-a87eeabdefba', // creator_name_metatype,
                    //   'a919d10a-ee15-11eb-9405-a87eeabdefba', // validation,
                    //   'a919d10b-ee15-11eb-b0a5-a87eeabdefba', // updater_name_use_metatype,
                    //   'a919d10d-ee15-11eb-b28c-a87eeabdefba', // audit_note,
                    //   'a919d10f-ee15-11eb-b927-a87eeabdefba', // audit_notes_type,
                    //   'a919d110-ee15-11eb-82a3-a87eeabdefba', // update_end_date,
                    //   'a919d111-ee15-11eb-9308-a87eeabdefba', // date_of_last_update,
                    //   'a919d112-ee15-11eb-96b8-a87eeabdefba', // updater_name_currency,
                    //   'a919e57a-ee15-11eb-b478-a87eeabdefba', // creator_name,
                    //   'a919e57b-ee15-11eb-bb3a-a87eeabdefba', // updater_name_use_type,
                    //   'a919e57c-ee15-11eb-9949-a87eeabdefba', // creator_name_currency_metatype,
                    //   'a919e57f-ee15-11eb-95f1-a87eeabdefba', // creation_date_qualifier,
                    //   'a919e581-ee15-11eb-bf25-a87eeabdefba', // update_date_qualifier,
                    //   'a919e582-ee15-11eb-a76d-a87eeabdefba', // updater_name,
                    //   'a919e583-ee15-11eb-9afe-a87eeabdefba', // updater_name_currency_metatype,
                    //   'a919e584-ee15-11eb-9162-a87eeabdefba', // validation_metatype
                    // ]
                  }
                }
              ]
            }
          ]
        }
      ];

      this.safeArrayAccesses = ['resourceInstanceId', 'tileId'];

      EditableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
