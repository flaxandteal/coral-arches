define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/licensing-workflow/widget-labeller'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('hm-consultation-response-workflow', {
    viewModel: function (params) {
      this.componentName = 'hm-consultation-response-workflow';

      this.stepConfig = [
        {
          title: 'Selected Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'con-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    hiddenNodes: [
                      '6a94dbfc-2d16-4534-8e63-1cbb8d643335',
                      '0629475d-a758-4483-8481-8d68025a28a7'
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Assign',
          name: 'assign-step',
          required: true,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'cm-ref',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                    resourceid: "['init-step']['con-id'][0]['resourceInstanceId']",

                    labels: [['Cross Reference', 'CM Reference']],
                    hiddenNodes: [
                      '879c793c-757f-42a4-8951-e6accc35de7e',
                      '52b4cd82-ada8-4ce8-844a-c5325b11e1a4',
                      'e7be1fd8-c6cc-4cdd-951e-e88cae6306a9',
                      'a45c0772-01ab-4867-abb7-675f470fd08f',
                      '89315741-f2df-41e7-90a3-14927751a293',
                      '90b26978-7a09-40de-b0f1-f261fcfbb9b5'
                    ],
                    // set to Heritage Environment number again needs changed to correct bfile id
                    prefilledNodes: [
                      [
                        'a45c0772-01ab-4867 -abb7-675f470fd08f',
                        '19afd557-cc21-44b4-b1df-f32568181b2c'
                      ]
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'consultation-action',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '8d5175ba-e6bc-4f59-ac49-e208168c12cf',
                    resourceid: "['init-step']['con-id'][0]['resourceInstanceId']",
                    hiddenNodes: [
                      '8e27c2f8-e186-4da7-b813-fd1e1dfb2f52',
                      '92d87aa6-3023-4e8c-9792-fe5908180e22',
                      '3a9f8e92-e274-4bd2-9c37-ddbe014a394e',
                      '1b733789-1ca7-422f-ad00-584d1d7a5192',
                      // '87508bf3-04d5-4f32-80e6-3baba8fbaa22' // Date entered
                      '97d88273-b7f6-4b33-95d0-b3427cbf2abb',
                      '107c506f-b7b3-4bf7-af0f-6107bfbdc2b2'
                    ]
                  }
                }
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'received-date',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                //     nodegroupid: 'c0c98765-b217-443d-ba91-cb720cd630aa',
                //     resourceid: "['init-step']['con-id'][0]['resourceInstanceId']",
                //     labels: [
                //       ['Log Date', 'Dif Received Date'],
                //       ['Completion Date', 'Date Consulted']
                //     ],
                //     hiddenNodes: [
                //       '1b5b60e1-0a30-429e-b6cd-33c3d6076145',
                //       '3b3825f6-db1a-4805-ba5f-6e43fdf15878',
                //       '3b3825f6-db1a-4805-ba5f-6e43fdf15878',
                //       '9dc3ab87-8bae-48bb-b5d5-9ef3a1ed2a95',
                //       '02f674e5-d15a-4499-ad66-d219a0d86f22'
                //     ]
                //   }
                // }
              ]
            }
          ]
        },
        {
          title: 'Application Summary',
          name: 'app-sum-step',
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'con-name',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'fe1ca5cb-b642-48ae-b680-19a580a76b45',
                    resourceid: "['init-step']['con-id'][0]['resourceInstanceId']",
                    hiddenNodes: [
                      'e4bf04ba-5edd-4b5d-8afe-59fb100773fc',
                      '4d0137d7-1ad9-4b71-ba2c-867f743ae3ce',
                      '7c6a3aea-29bb-4611-8786-4136acd44f10'
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'plan-ref',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                    resourceid: "['init-step']['con-id'][0]['resourceInstanceId']",

                    labels: [['Cross Reference', 'Planning Reference']],
                    hiddenNodes: [
                      '879c793c-757f-42a4-8951-e6accc35de7e',
                      '52b4cd82-ada8-4ce8-844a-c5325b11e1a4',
                      'e7be1fd8-c6cc-4cdd-951e-e88cae6306a9',
                      'a45c0772-01ab-4867-abb7-675f470fd08f',
                      '89315741-f2df-41e7-90a3-14927751a293',
                      '90b26978-7a09-40de-b0f1-f261fcfbb9b5'
                    ],
                    prefilledNodes: [
                      [
                        'a45c0772-01ab-4867-abb7-675f470fd08f',
                        '5fabe56e-ab1f-4b80-9a5b-f4dcf35efc27'
                      ]
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Map',
          name: 'map-step',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'planning-area',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '54186783-3315-4205-ad1e-87a22157086c',
                    resourceid: "['init-step']['con-id'][0]['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Action',
          name: 'action-step',
          layoutSections: [
            {
              componentConfigs: [
                //
              ]
            }
          ]
        },
        {
          title: 'Complete',
          name: 'complete-step',
          layoutSections: [
            {
              componentConfigs: [
                //
              ]
            }
          ]
        }
      ];

      EditableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
