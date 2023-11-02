define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/assign-consultation-workflow.htm',
    'views/components/workflows/related-document-upload',
    'views/components/workflows/licensing-workflow/widget-labeller',
  ], function (ko, arches, Workflow, assignConsultationWorkflowTemplate) {
    return ko.components.register('assign-consultation-workflow', {
      viewModel: function (params) {
        this.componentName = 'assign-consultation-workflow';
        this.stepConfig = [
            {
                title: 'Initialise Consultation',
                name: 'init-step',
                required: true,
                informationboxdata: {
                  heading: 'Important Information',
                  text: 'Please provide a name for the consultation'
                },
                layoutSections: [
                  {
                    componentConfigs: [
                      {
                        componentName: 'default-card',
                        uniqueInstanceName: 'app-id',
                        tilesManaged: 'one',
                        parameters: {
                          graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                          nodegroupid: 'fe1ca5cb-b642-48ae-b680-19a580a76b45',
                          hiddenNodes: [
                            'e4bf04ba-5edd-4b5d-8afe-59fb100773fc',
                            '4d0137d7-1ad9-4b71-ba2c-867f743ae3ce',
                            '7c6a3aea-29bb-4611-8786-4136acd44f10',
                          ],
                        }
                      }
                    ]
                  }
                ]
              },
          {
            title: 'Assign Consultation',
            name: 'application-details',
            required: true,
            workflowstepclass: 'workflow-form-component',
            informationboxdata: {
              heading: 'Applicant Details',
            },
            layoutSections: [
              {
                componentConfigs: [
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'planning-ref',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

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
                        ['a45c0772-01ab-4867-abb7-675f470fd08f', '5fabe56e-ab1f-4b80-9a5b-f4dcf35efc27']
                      ]
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'cm-ref',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

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
                        ['a45c0772-01ab-4867-abb7-675f470fd08f', '19afd557-cc21-44b4-b1df-f32568181b2c']
                      ]
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'received-date',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: 'c0c98765-b217-443d-ba91-cb720cd630aa',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Log Date', 'Dif Received Date'], ['Completion Date', 'Date Consulted']],
                      hiddenNodes: [
                        '1b5b60e1-0a30-429e-b6cd-33c3d6076145',
                        '3b3825f6-db1a-4805-ba5f-6e43fdf15878',
                        '3b3825f6-db1a-4805-ba5f-6e43fdf15878',
                        '9dc3ab87-8bae-48bb-b5d5-9ef3a1ed2a95',
                        '02f674e5-d15a-4499-ad66-d219a0d86f22'
                      ],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'entry-number',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Primary Reference Number', 'Entry Number']],
                      hiddenNodes: [
                        '18436d9e-c60b-4fb6-ad09-9458e270e993',
                        'f3dbc907-f986-4bfd-a47a-e786d905ca76',
                        '10b3143b-628b-426b-8c2d-27caad7e46d0',
                        '9bb26274-eec1-4031-879a-4586810511fd',
                        '6a94dbfc-2d16-4534-8e63-1cbb8d643335',
                        'abb5a463-2979-4e73-a554-6579dcbab33f',
                      ],
                    }
                  },
                  // todo classification
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'developent-type',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '8a5c490f-34ac-4640-9a0e-c739a638ec7a',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'contacts',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '419290e1-331c-4739-beee-c33f3d46341b',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      hiddenNodes: [
                        'd5e6ab32-f73d-409b-983f-805db7e49688'
                      ],
                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'proposal',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '5a067282-4bc7-496f-a947-f647494d0162',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      hiddenNodes: [
                      ],
                    }
                  },

                ]
              }
            ]
          },
          {
            title: 'Area Details',
            name: 'area-details',
            required: true,
            workflowstepclass: 'workflow-form-component',
            informationboxdata: {
              heading: 'Area Details',
            },
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
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'related-activities',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: 'e389a294-c103-4e5c-9012-16b9e60b1ce0',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'related-monuments',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '65ed4765-5f3a-4062-b730-47019f149f72',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                ]
              }
            ]
          },
          {
            title: 'Documentation',
            name: 'assingment-documentation',
            required: false,
            informationboxdata: {
              heading: 'Assignment Documentation',
            },
            layoutSections: [
              {
                componentConfigs: [
                  {
                    componentName: 'related-document-upload',
                    uniqueInstanceName: 'planning-ref',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: 'f5aeaa90-3127-475d-886a-9fc62742de4f',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                ]
              }
            ]
          },
          {
            title: 'Action',
            name: 'consultation-action',
            required: true,
            informationboxdata: {
              heading: 'Action',
            },
            layoutSections: [
              {
                componentConfigs: [
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'consultation-action',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                      nodegroupid: '8d5175ba-e6bc-4f59-ac49-e208168c12cf',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                ]
              }
            ]
          }
        ]
        Workflow.apply(this, [params]);
        this.quitUrl = arches.urls.plugin('init-workflow');
      },
      template: assignConsultationWorkflowTemplate
  });
});
