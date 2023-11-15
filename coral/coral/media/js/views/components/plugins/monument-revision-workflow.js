define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/monument-revision-workflow.htm'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('monument-revision-workflow', {
    viewModel: function (params) {
      this.componentName = 'monument-revision-workflow';
      this.stepConfig = [
        {
          title: 'Start new revision',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42635b60-eabf-11ed-9e22-72d420f37f11',
                    hiddenNodes: [
                      '4264ab14-eabf-11ed-9e22-72d420f37f11',
                      '4264a560-eabf-11ed-9e22-72d420f37f11',
                      '42649b38-eabf-11ed-9e22-72d420f37f11',
                      '4264a10a-eabf-11ed-9e22-72d420f37f11'
                    ]
                  }
                }
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'app-loc',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //     nodegroupid: '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
                //     hiddenNodes: [
                //         '87d39b2e-f44f-11eb-9a4a-a87eeabdefba',
                //       '4264ab14-eabf-11ed-9e22-72d420f37f11',
                //       '4264a560-eabf-11ed-9e22-72d420f37f11',
                //       '42649b38-eabf-11ed-9e22-72d420f37f11',
                //       '4264a10a-eabf-11ed-9e22-72d420f37f11'
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
          title: 'Heritage Asset Details',
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263977e-eabf-11ed-9e22-72d420f37f11',
                    hiddenNodes: [
                      '42653552-eabf-11ed-9e22-72d420f37f11',
                      '426536ec-eabf-11ed-9e22-72d420f37f11'
                    ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    labels: [['Name Type', 'Type of Heritage Asset']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-type',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42647ff4-eabf-11ed-9e22-72d420f37f11',
                      '42647d24-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '42647ff4-eabf-11ed-9e22-72d420f37f11',
                        '6cd61658-6c0d-46fa-a898-b4d0545cfe34'
                      ]
                    ],
                    labels: [['Description', 'Heritage Asset Type (Other)']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-smr',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                  uniqueInstanceName: 'monument-townland',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                        '58efc6e4-840b-43e5-b91f-0cf087833e75'
                      ]
                    ],
                    labels: [['Person or Organization', 'Field Worker']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'owner',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-condition',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42647ff4-eabf-11ed-9e22-72d420f37f11',
                      '42647d24-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '42647ff4-eabf-11ed-9e22-72d420f37f11',
                        '6611eb43-8e2e-4416-a86f-f830a376010b'
                      ]
                    ],
                    labels: [['Description', 'Condition']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'monument-threats',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42647ff4-eabf-11ed-9e22-72d420f37f11',
                      '42647d24-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '42647ff4-eabf-11ed-9e22-72d420f37f11',
                        '935d5a08-b805-412f-b53c-d9bf65b4d719'
                      ]
                    ],
                    labels: [['Description', 'Threats']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'scheduling-reason',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42647ff4-eabf-11ed-9e22-72d420f37f11',
                      '42647d24-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '42647ff4-eabf-11ed-9e22-72d420f37f11',
                        '463a7c8a-f608-4d84-b5ab-4bab8522a715'
                      ]
                    ],
                    labels: [['Description', 'Reason for Scheduling']]
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
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
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '6af2b697-efc5-11eb-8152-a87eeabdefba',
                      '6af2a0d0-efc5-11eb-ab44-a87eeabdefba',
                      '6af2b69e-efc5-11eb-801e-a87eeabdefba'
                    ]
                  }
                }
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
