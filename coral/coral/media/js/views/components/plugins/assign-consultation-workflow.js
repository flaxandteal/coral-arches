define([
    'knockout',
    'arches',
    'viewmodels/workflow',
    'templates/views/components/plugins/assign-consultation-workflow.htm',
    'views/components/workflows/related-document-upload'
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
                          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                          nodegroupid: '4ad66f55-951f-11ea-b2e2-f875a44e0e11',
                          hiddenNodes: [
                            '4ad66f59-951f-11ea-ab0a-f875a44e0e11',
                            '4ad69681-951f-11ea-b8ab-f875a44e0e11',
                            '4ad66f58-951f-11ea-9c61-f875a44e0e11',
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
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Cross Reference', 'Planning Reference']],
                      hiddenNodes: [
                        '3b50055b-eec2-11eb-b4af-a87eeabdefba',
                        '3b500559-eec2-11eb-af0b-a87eeabdefba',
                        '3b50055a-eec2-11eb-9d5e-a87eeabdefba',
                        '3b50055e-eec2-11eb-8f26-a87eeabdefba',
                        'b37552c2-9527-11ea-8356-f875a44e0e11',
                        '3b50055d-eec2-11eb-8bca-a87eeabdefba'
                      ],
                      prefilledNodes: [
                        ['3b50055e-eec2-11eb-8f26-a87eeabdefba', '5fabe56e-ab1f-4b80-9a5b-f4dcf35efc27']
                      ]
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'cm-ref',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '3b500555-eec2-11eb-b785-a87eeabdefba',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Cross Reference', 'CM Reference']],
                      hiddenNodes: [
                        '3b50055b-eec2-11eb-b4af-a87eeabdefba',
                        '3b500559-eec2-11eb-af0b-a87eeabdefba',
                        '3b50055a-eec2-11eb-9d5e-a87eeabdefba',
                        '3b50055e-eec2-11eb-8f26-a87eeabdefba',
                        'b37552c2-9527-11ea-8356-f875a44e0e11',
                        '3b50055d-eec2-11eb-8bca-a87eeabdefba'
                      ],
                      // set to Heritage Environment number again needs changed to correct bfile id
                      prefilledNodes: [
                        ['3b50055e-eec2-11eb-8f26-a87eeabdefba', '19afd557-cc21-44b4-b1df-f32568181b2c']
                      ]
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'received-date',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '40eff4c9-893a-11ea-ac3a-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Log Date', 'Dif Received Date'], ['Completion Date', 'Date Consulted']],
                      hiddenNodes: [
                        '40eff4cc-893a-11ea-92e4-f875a44e0e11',
                        '72244177-893a-11ea-99a1-f875a44e0e11',
                        '72244177-893a-11ea-99a1-f875a44e0e11',
                        '7224417a-893a-11ea-9e1a-f875a44e0e11',
                        '7224417b-893a-11ea-b383-f875a44e0e11'
                      ],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'entry-number',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: 'b37552ba-9527-11ea-96b5-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      labels: [['Primary Reference Number', 'Entry Number']],
                      hiddenNodes: [
                        'b37552bf-9527-11ea-9c87-f875a44e0e11',
                        'b37552c5-9527-11ea-9d83-f875a44e0e11',
                        'b37552c1-9527-11ea-90e0-f875a44e0e11',
                        'b37552c3-9527-11ea-b334-f875a44e0e11',
                        'b37552be-9527-11ea-9213-f875a44e0e11',
                        'b37552c4-9527-11ea-b8e3-f875a44e0e11',
                      ],
                    }
                  },
                  // todo classification
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'developent-type',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '73fdfe62-8895-11ea-a058-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    }
                  },
                  {
                    componentName: 'default-card',
                    uniqueInstanceName: 'contacts',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '4ea4a189-184f-11eb-b45e-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                      hiddenNodes: [
                        '4ea4c885-184f-11eb-b4d5-f875a44e0e11'
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
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '152aa058-936d-11ea-b517-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'related-activities',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '44532175-2007-11ea-9976-c4d9877d154e',
                      resourceid: "['init-step']['app-id'][0]['resourceInstanceId']",

                    //   labels: [['Cross Reference', 'Planning Reference']],
                    }
                  },
                  {
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'related-monuments',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: '58a2b98f-a255-11e9-9a30-00224800b26d',
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
            required: true,
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
                      graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                      nodegroupid: 'b3addca4-8882-11ea-acc1-f875a44e0e11',
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
