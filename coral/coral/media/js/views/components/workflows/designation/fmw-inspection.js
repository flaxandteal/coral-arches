define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/related-document-upload'
], function (ko, arches, EditableWorkflow, licensingWorkflowTemplate) {
  return ko.components.register('fmw-inspection-workflow', {
    viewModel: function (params) {
      this.componentName = 'fmw-inspection-workflow';
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
                  componentName: 'initial-step-monument',
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
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'app-loc',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                //     nodegroupid: '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
                //     hiddenNodes: [
                //         '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
                //       '325a441c-efe4-11eb-9283-a87eeabdefba',
                //       '325a4418-efe4-11eb-9bdf-a87eeabdefba',
                //       '325a2f32-efe4-11eb-880e-a87eeabdefba',
                //       '325a2f36-efe4-11eb-97c6-a87eeabdefba'
                //   ],
                //   prefilledNodes: [
                //     ["87d39b2e-f44f-11eb-9a4a-a87eeabdefba", {}]
                //   ]
                //   }
                // }
              ]
            }
          ]
        },
        {
          title: 'Condition',
          name: 'app-details-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-smr',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'f17f6581-efc7-11eb-b09f-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'f17f6587-efc7-11eb-b56f-a87eeabdefba',
                      'f17f6585-efc7-11eb-8ac0-a87eeabdefba',
                      'f17f6586-efc7-11eb-917d-a87eeabdefba',
                      'f17f658a-efc7-11eb-a216-a87eeabdefba',
                      'f17f6589-efc7-11eb-9b90-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      [
                        'f17f658a-efc7-11eb-a216-a87eeabdefba',
                        '804a489a-be93-463b-b1f6-4f473b644279'
                      ]
                    ],
                    labels: [['Cross Reference', 'SMR']]
                  }
                },
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
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-cmref',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'f17f6581-efc7-11eb-b09f-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'f17f6587-efc7-11eb-b56f-a87eeabdefba',
                      'f17f6585-efc7-11eb-8ac0-a87eeabdefba',
                      'f17f6586-efc7-11eb-917d-a87eeabdefba',
                      'f17f658a-efc7-11eb-a216-a87eeabdefba',
                      'f17f6589-efc7-11eb-9b90-a87eeabdefba'
                    ],
                    prefilledNodes: [
                      [
                        'f17f658a-efc7-11eb-a216-a87eeabdefba',
                        '19afd557-cc21-44b4-b1df-f32568181b2c'
                      ]
                    ],
                    labels: [['Cross Reference', 'CM reference']]
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
                    prefilledNodes: [
                      [
                        'ba34557b-b554-11ea-ab95-f875a44e0e11',
                        '6cd61658-6c0d-46fa-a898-b4d0545cfe34'
                      ]
                    ],
                    labels: [['Description', 'Monument Type']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-townland',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '87d38725-f44f-11eb-8d4b-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parentile: "['init-step']['app-id'][0]['locTileId']",
                    hiddenNodes: [
                      '87d3d7c5-f44f-11eb-8459-a87eeabdefba',
                      '87d3d7c2-f44f-11eb-8ddc-a87eeabdefba',
                      '87d3c3eb-f44f-11eb-be3c-a87eeabdefba'
                    ],
                    // using Town instead of townland since we dont have it locally
                    prefilledNodes: [
                      [
                        '87d3d7c5-f44f-11eb-8459-a87eeabdefba',
                        '24ca1cb9-c4d1-4cbc-9990-df74e6eb346e'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-land-use',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '87d38728-f44f-11eb-900d-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parentile: "['init-step']['app-id'][0]['locTileId']",
                    hiddenNodes: [
                      '87d3c3f0-f44f-11eb-87e0-a87eeabdefba',
                      '87d3c2a4-f44f-11eb-a170-a87eeabdefba',
                      '87d3c3f9-f44f-11eb-bed4-a87eeabdefba',
                      '87d3d7c9-f44f-11eb-a734-a87eeabdefba',
                      '87d3d7bb-f44f-11eb-8fad-a87eeabdefba',
                      '87d3d7e4-f44f-11eb-9d29-a87eeabdefba',
                      '87d3d7c0-f44f-11eb-8304-a87eeabdefba',
                      '87d3c3fd-f44f-11eb-97d8-a87eeabdefba',
                      '87d3d7e7-f44f-11eb-bc69-a87eeabdefba'
                    ],
                    // using Town instead of townland since we dont have it locally
                    prefilledNodes: [
                      [
                        '87d3d7c5-f44f-11eb-8459-a87eeabdefba',
                        '24ca1cb9-c4d1-4cbc-9990-df74e6eb346e'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },

                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'field-worker',
                  tilesManaged: 'one',
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
                      '96826222-0262-11eb-9e58-f875a44e0e11'
                    ],
                    // using inspector instead of warden
                    prefilledNodes: [
                      [
                        '96826222-0262-11eb-9e58-f875a44e0e11',
                        'e0c04ab8-b6ff-4a73-bf49-3e3a703e1539'
                      ]
                    ],
                    labels: [['Person or Organization', 'FMW Warden']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-condition',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'ba34557b-b554-11ea-ab95-f875a44e0e11',
                      'ba345579-b554-11ea-9232-f875a44e0e11'
                    ],
                    prefilledNodes: [
                      [
                        'ba34557b-b554-11ea-ab95-f875a44e0e11',
                        '6611eb43-8e2e-4416-a86f-f830a376010b'
                      ]
                    ],
                    labels: [['Description', 'Condition']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-recommendations',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'ba34557b-b554-11ea-ab95-f875a44e0e11',
                      'ba345579-b554-11ea-9232-f875a44e0e11'
                    ],
                    // using Archaeological Recommendations text
                    prefilledNodes: [
                      [
                        'ba34557b-b554-11ea-ab95-f875a44e0e11',
                        '8c12a812-8000-4ec9-913d-c6fd516117f2'
                      ]
                    ],
                    labels: [['Description', 'Recommendations']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'scheduling-reason',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      'ba34557b-b554-11ea-ab95-f875a44e0e11',
                      'ba345579-b554-11ea-9232-f875a44e0e11'
                    ],
                    prefilledNodes: [
                      [
                        'ba34557b-b554-11ea-ab95-f875a44e0e11',
                        '463a7c8a-f608-4d84-b5ab-4bab8522a715'
                      ]
                    ],
                    labels: [['Description', 'Notes']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'owner',
                  tilesManaged: 'one',
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
                      '96826222-0262-11eb-9e58-f875a44e0e11'
                    ],
                    prefilledNodes: [
                      [
                        '96826222-0262-11eb-9e58-f875a44e0e11',
                        '17bfcc28-6fee-4a7c-a0f5-7bebe2d4cd06'
                      ]
                    ],
                    labels: [['Person or Organization', 'Owner(s)']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'occupier',
                  tilesManaged: 'one',
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
                      '96826222-0262-11eb-9e58-f875a44e0e11'
                    ],
                    // using patron id for now since we don't have occupier in roletype concept
                    prefilledNodes: [
                      [
                        '96826222-0262-11eb-9e58-f875a44e0e11',
                        '0d5f1ee2-2910-46d9-858f-4040f113a79c'
                      ]
                    ],
                    labels: [['Person or Organization', 'Occupier(s)']]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Geospatial Details',
          name: 'geospaital-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Location Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'geometry-info',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '87d3872b-f44f-11eb-bd0c-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parentile: "['init-step']['app-id'][0]['locTileId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Documentation',
          name: 'file-upload-step',
          required: false,
          layoutSections: [
            {
              componentConfigs: [
                {
                  /**
                   * Using custom component to handle the creation of Digital
                   * Objects that will then be automatically named and related
                   * to the Excavation License model.
                   */
                  componentName: 'related-document-upload',
                  uniqueInstanceName: 'file-upload',
                  tilesManaged: 'one',
                  parameters: {
                    /**
                     * Using Digital Object graph id and the file upload
                     * node group id.
                     */
                    graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
                    nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',

                    /**
                     * These can be difficult to work with. Sometimes the `tileId` will be all
                     * lowercase and sometimes it will be camel case. This will vary between workflows.
                     */
                    resourceModelId:
                      "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-step']['app-id'][0]['tileId']",

                    /**
                     * This needs to refer to the Excavation models
                     * Digital object node group.
                     */
                    resourceModelDigitalObjectNodeGroupId: 'fc6b6b0b-5118-11eb-b342-f875a44e0e11'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Designation and Protection Assignment',
          name: 'assignment-step',
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Designation and Protection Assignment'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'designation-info',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '6af2b697-efc5-11eb-8152-a87eeabdefba',
                      '6af2a0d0-efc5-11eb-ab44-a87eeabdefba'
                    ]
                  }
                }
              ]
            }
          ]
        }
      ];

      this.safeArrayAccesses = ['resourceInstanceId', 'tileId', 'locTileId'];

      EditableWorkflow.apply(this, [params]);

      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: licensingWorkflowTemplate
  });
});
