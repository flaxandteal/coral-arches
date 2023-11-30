define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/monument-revision-workflow.htm',
  'views/components/workflows/default-card-util'
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
                //   componentName: 'default-card-util',
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
                  componentName: 'default-card-util',
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
                  componentName: 'default-card-util',
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
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'monument-smr',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '42633a18-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42648b20-eabf-11ed-9e22-72d420f37f11',
                      '42648792-eabf-11ed-9e22-72d420f37f11',
                      '426489b8-eabf-11ed-9e22-72d420f37f11',
                      '42648f30-eabf-11ed-9e22-72d420f37f11',
                      '42648de6-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '42648f30-eabf-11ed-9e22-72d420f37f11',
                        '804a489a-be93-463b-b1f6-4f473b644279'
                      ]
                    ],
                    labels: [['Cross Reference', 'SMR']]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'monument-townland',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263afc0-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parentile: "['init-step']['app-id'][0]['locTileId']",
                    hiddenNodes: [
                      '42665f36-eabf-11ed-9e22-72d420f37f11',
                      '42665a18-eabf-11ed-9e22-72d420f37f11',
                      '42661b02-eabf-11ed-9e22-72d420f37f11'
                    ],
                    // using Town instead of townland since we dont have it locally
                    prefilledNodes: [
                      [
                        '42665f36-eabf-11ed-9e22-72d420f37f11',
                        '24ca1cb9-c4d1-4cbc-9990-df74e6eb346e'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'monument-land-use',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4263c596-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parentile: "['init-step']['app-id'][0]['locTileId']",
                    hiddenNodes: [
                      '426622aa-eabf-11ed-9e22-72d420f37f11',
                      '42661508-eabf-11ed-9e22-72d420f37f11',
                      '42662ff2-eabf-11ed-9e22-72d420f37f11',
                      '42666576-eabf-11ed-9e22-72d420f37f11',
                      '42664f32-eabf-11ed-9e22-72d420f37f11',
                      '42668ee8-eabf-11ed-9e22-72d420f37f11',
                      '42665748-eabf-11ed-9e22-72d420f37f11',
                      '42663588-eabf-11ed-9e22-72d420f37f11',
                      '42669352-eabf-11ed-9e22-72d420f37f11'
                    ],
                    // using Town instead of townland since we dont have it locally
                    prefilledNodes: [
                      [
                        '42665f36-eabf-11ed-9e22-72d420f37f11',
                        '24ca1cb9-c4d1-4cbc-9990-df74e6eb346e'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },

                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'field-worker',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4264513c-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '4266f66c-eabf-11ed-9e22-72d420f37f11',
                      '4266f3ba-eabf-11ed-9e22-72d420f37f11',
                      '4266f086-eabf-11ed-9e22-72d420f37f11',
                      '4266f4fa-eabf-11ed-9e22-72d420f37f11',
                      '4266f7ca-eabf-11ed-9e22-72d420f37f11',
                      '4266f914-eabf-11ed-9e22-72d420f37f11',
                      '4266ed98-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '4266ed98-eabf-11ed-9e22-72d420f37f11',
                        '58efc6e4-840b-43e5-b91f-0cf087833e75'
                      ]
                    ],
                    labels: [['Person or Organization', 'Field Worker']]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'owner',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4264513c-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '4266f66c-eabf-11ed-9e22-72d420f37f11',
                      '4266f3ba-eabf-11ed-9e22-72d420f37f11',
                      '4266f086-eabf-11ed-9e22-72d420f37f11',
                      '4266f4fa-eabf-11ed-9e22-72d420f37f11',
                      '4266f7ca-eabf-11ed-9e22-72d420f37f11',
                      '4266f914-eabf-11ed-9e22-72d420f37f11',
                      '4266ed98-eabf-11ed-9e22-72d420f37f11'
                    ],
                    prefilledNodes: [
                      [
                        '4266ed98-eabf-11ed-9e22-72d420f37f11',
                        '17bfcc28-6fee-4a7c-a0f5-7bebe2d4cd06'
                      ]
                    ],
                    labels: [['Person or Organization', 'Owner(s)']]
                  }
                },
                {
                  componentName: 'default-card-util',
                  uniqueInstanceName: 'occupier',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                    nodegroupid: '4264513c-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '4266f66c-eabf-11ed-9e22-72d420f37f11',
                      '4266f3ba-eabf-11ed-9e22-72d420f37f11',
                      '4266f086-eabf-11ed-9e22-72d420f37f11',
                      '4266f4fa-eabf-11ed-9e22-72d420f37f11',
                      '4266f7ca-eabf-11ed-9e22-72d420f37f11',
                      '4266f914-eabf-11ed-9e22-72d420f37f11',
                      '4266ed98-eabf-11ed-9e22-72d420f37f11'
                    ],
                    // using patron id for now since we don't have occupier in roletype concept
                    prefilledNodes: [
                      [
                        '4266ed98-eabf-11ed-9e22-72d420f37f11',
                        '0d5f1ee2-2910-46d9-858f-4040f113a79c'
                      ]
                    ],
                    labels: [['Person or Organization', 'Occupier(s)']]
                  }
                },
                {
                  componentName: 'default-card-util',
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
                  componentName: 'default-card-util',
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
                  componentName: 'default-card-util',
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
                    nodegroupid: '4263d086-eabf-11ed-9e22-72d420f37f11',
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
                    resourceModelDigitalObjectNodeGroupId: 'f9b96458-83bc-11ee-b751-0242ac130007'
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
                    nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    hiddenNodes: [
                      '42656e96-eabf-11ed-9e22-72d420f37f11',
                      '42655d8e-eabf-11ed-9e22-72d420f37f11',
                      '426586b0-eabf-11ed-9e22-72d420f37f11'
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
