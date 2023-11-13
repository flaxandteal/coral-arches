define([
    'knockout',
    'arches',
    'viewmodels/editable-workflow',
    'templates/views/components/plugins/consultation-workflow.htm',
    'views/components/workflows/related-document-upload'
  ], function (ko, arches, EditableWorkflow, licensingWorkflowTemplate) {
    return ko.components.register('asset-scheduling-workflow', {
      viewModel: function (params) {
        this.componentName = 'asset-scheduling-workflow';
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
                          componentName: 'default-card',
                          uniqueInstanceName: 'app-id',
                          tilesManaged: 'one',
                          parameters: {
                            graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                            nodegroupid: '325a2f2f-efe4-11eb-9b0c-a87eeabdefba',
                            hiddenNodes: [
                              '325a441c-efe4-11eb-9283-a87eeabdefba',
                              '325a4418-efe4-11eb-9bdf-a87eeabdefba',
                              '325a2f32-efe4-11eb-880e-a87eeabdefba',
                              '325a2f36-efe4-11eb-97c6-a87eeabdefba'
                          ]
                          }
                        }
                      ]
                    }
                  ]
                },
                {
                  title: 'Pro-forma',
                  name: 'app-details-step',
                  required: false,
                  workflowstepclass: 'workflow-form-component',
                  layoutSections: [
                    {
                      componentConfigs: [
                        {
                          componentName: 'widget-labeller',
                          uniqueInstanceName: 'site-name',
                          tilesManaged: 'one',
                          parameters: {
                            graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                            nodegroupid: '676d47f9-9c1c-11ea-9aa0-f875a44e0e11',
                            hiddenNodes: [
                              '676d47fe-9c1c-11ea-aa28-f875a44e0e11',
                              '676d47fc-9c1c-11ea-b5b0-f875a44e0e11',
                              '676d47fd-9c1c-11ea-9d73-f875a44e0e11'
                            ],
                      resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
  
                          },
                        },
                        {
                          componentName: 'widget-labeller',
                          uniqueInstanceName: 'monument-smr',
                          tilesManaged: 'one',
                          parameters: {
                            graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                            nodegroupid: 'f17f6581-efc7-11eb-b09f-a87eeabdefba',
                            resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                            hiddenNodes: [
                                "f17f6587-efc7-11eb-b56f-a87eeabdefba",
                                "f17f6585-efc7-11eb-8ac0-a87eeabdefba",
                                "f17f6586-efc7-11eb-917d-a87eeabdefba",
                                "f17f658a-efc7-11eb-a216-a87eeabdefba",
                                "f17f6589-efc7-11eb-9b90-a87eeabdefba"
                            ],
                            prefilledNodes: [
                                ["f17f658a-efc7-11eb-a216-a87eeabdefba", ""]
                            ],
                            labels: [
                                ["External Cross Reference", "SMR"]
                            ]
                          }
                        },
                        {
                          componentName: 'widget-labeller',
                          uniqueInstanceName: 'monument-type',
                          tilesManaged: 'one',
                          parameters: {
                            graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                            nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                            resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                            hiddenNodes: [
                              'ba34557b-b554-11ea-ab95-f875a44e0e11',
                              'ba345579-b554-11ea-9232-f875a44e0e11'
                            ],
                            labels: [
                                ["Description", "Monument Type"]
                            ]
                          }
                        },
                        {
                            componentName: 'widget-labeller',
                            uniqueInstanceName: 'monument-actors',
                            tilesManaged: 'many',
                            parameters: {
                              graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                              nodegroupid: '9682621d-0262-11eb-ab33-f875a44e0e11',
                              resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                              hiddenNodes: [
                                '96826228-0262-11eb-8862-f875a44e0e11',
                                '96826226-0262-11eb-97d4-f875a44e0e11',
                                '96826224-0262-11eb-b74c-f875a44e0e11',
                                '96826227-0262-11eb-a1c0-f875a44e0e11',
                                '96826229-0262-11eb-853d-f875a44e0e11',
                                '9682622a-0262-11eb-a0ef-f875a44e0e11',
                              ],
                              
                            }
                          },
                      ]
                   }
              ]
            },
        ];
  
        this.safeArrayAccesses = [
          'resourceInstanceId',
          'tileId',
        ];
  
        EditableWorkflow.apply(this, [params]);
  
        this.quitUrl = arches.urls.plugin('init-workflow');
      },
      template: licensingWorkflowTemplate
    });
  });
  