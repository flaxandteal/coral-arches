define([
  'knockout',
  'jquery',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/mapped-excavation-workflow.htm'
], function (ko, $, arches, Workflow, mappedExcavationWorkflow) {
  return ko.components.register('mapped-excavation-workflow', {
    viewModel: function (params) {
      this.componentName = 'mapped-excavation-workflow';

      this.stepConfig = [
        {
          title: 'Initialise Excavation',
          name: 'init-name-step' /* unique to workflow */,
          required: false,
          informationboxdata: {
            heading: 'Initialise Excavation'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'application-id-instance' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
                    renderContext: 'workflow'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Application Details',
          name: 'app-details-step' /* unique to workflow */,
          required: false,
          workflowstepclass: 'workflow-form-component',

          informationboxdata: {
            heading: 'Application Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'excavation-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4a7bba1d-9938-11ea-86aa-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'license-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },

                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'external-file-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '589d38f9-edf9-11eb-90f5-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'activity-description' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a472226f-9937-11ea-966a-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'activity-times' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '4f5ec415-993e-11ea-bab0-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                //   {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'smr-name' /* unique to step */,
                //     tilesManaged: 'one',
                //     parameters: {
                //       graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //       nodegroupid: 'e7d695ff-9939-11ea-8fff-f875a44e0e11',
                //       renderContext: 'workflow',
                //       resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //     }
                //   },
                //   { Inside "Location Data"\Geometry\"Spatial Record Compilation"
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'smr-entry' /* unique to step */,
                //     tilesManaged: 'one',
                //     parameters: {
                //       graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //       nodegroupid: 'a541b93b-f121-11eb-be54-a87eeabdefba',
                //       renderContext: 'workflow',
                //       resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //     }
                //   },
                //   {Inside "Location Data"\Geometry
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'smr-authorization' /* unique to step */,
                //     tilesManaged: 'one',
                //     parameters: {
                //       graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //       nodegroupid: 'be3831a2-813e-11e9-a6d8-80000b44d1d9',
                //       renderContext: 'workflow',
                //       resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //     }
                //   },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'rept-end' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '6c21885d-ee13-11eb-9060-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'arch-found' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'be3831a2-813e-11e9-a6d8-80000b44d1d9',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'storage-area' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '5f00ef7e-9f63-11ea-9db8-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Associated People',
          name: 'associated-people-step',
          required: false,
          informationboxdata: {
            heading: 'Associate People and Organizations'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'associated-people' /* unique to step */,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '2a5b99a9-fe48-11ea-9deb-f875a44e0e11',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Excavation Location',
          name: 'location-step' /* unique to workflow */,
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Record Decision'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'location-index' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: 'a5416b49-f121-11eb-8e2c-a87eeabdefba',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ]
        },
        //   {
        //     title: 'Excavation Address',
        //     name: 'location-step' /* unique to workflow */,
        //     required: false,
        //     workflowstepclass: 'workflow-form-component',
        //     informationboxdata: {
        //       heading: 'Record Decision'
        //     },
        //     layoutSections: [
        //       {
        //         componentConfigs: [
        //             {
        //             componentName: 'default-card',
        //             uniqueInstanceName: 'location-index' /* unique to step */,
        //             tilesManaged: 'many',
        //             parameters: {
        //               graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
        //               nodegroupid: 'a5416b3d-f121-11eb-85b4-a87eeabdefba',
        //               renderContext: 'workflow',
        //               resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
        //               parenttileid: "['location-step']['location-index']['tileId']"
        //             }
        //           },
        //         ]
        //       },
        //     ]
        //   },
        {
          title: 'Record Decision',
          name: 'init-file-step' /* unique to workflow */,
          required: false,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Record Decision'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'related-file' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '0d8e3224-fd69-45e2-bb80-221f5b66d46c',
                    renderContext: 'workflow',
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'record-decision' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                    nodegroupid: '833b14a7-4c78-42fd-a64a-be416a89903b',

                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'related-file' /* unique to step */,
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
                //     nodegroupid: '101c32ba-2b49-4aa5-b74e-245b9f696012',
                //     renderContext: 'workflow',
                //     resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //   }
                // },
              ]
            }
          ]
        },
        {
          /**
           * WIP
           */
          title: 'Record Decision Additional Files',
          name: 'related-documents',
          required: false,
          informationboxdata: {
            heading: 'Record Decision File Upload'
          },
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
                     * [FIXME]
                     * These two lines might be incorrect as they don't follow the same format
                     * found in communication-workflow.js
                     */
                    resourceModelId:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-name-step']['application-id-instance'][0]['tileid']",

                    /**
                     * This needs to refer to the Excavation models
                     * Digital object node group.
                     */
                    resourceModelDigitalObjectNodeGroupId: '101c32ba-2b49-4aa5-b74e-245b9f696012'
                  }
                }
              ]
            }
          ]
        },
        // {
        //   title: 'Record Decision Additional Files',
        //   name: 'file-upload' /* unique to workflow */,
        //   required: false,
        //   informationboxdata: {
        //     heading: 'Record Decision File Upload'
        //   },
        //   layoutSections: [
        //     {
        //       componentConfigs: [
        //         {
        //           componentName: 'default-card',
        //           uniqueInstanceName: 'related-file' /* unique to step */,
        //           tilesManaged: 'one',
        //           parameters: {
        //             graphid: 'b9e0701e-5463-11e9-b5f5-000d3ab1e588',
        //             nodegroupid: '0d8e3224-fd69-45e2-bb80-221f5b66d46c',
        //             renderContext: 'workflow',
        //             resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
        //           }
        //         },
        //       ]             }
        //   ]
        // },
        {
          title: 'Excavation Cover Letter',
          name: 'excavation-cover-letter',
          description: 'Choose an option below',
          component: 'views/components/workflows/component-based-step',
          componentname: 'component-based-step',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'excavation-cover-letter',
                  uniqueInstanceName: 'excavation-cover',
                  tilesManaged: 'none',
                  parameters: {
                    digitalObject: "['upload-documents']['upload-documents-step']",
                    consultationTileid: "['init-name-step']['application-id-instance']['tileid']",
                    consultationResourceid:
                      "['init-name-step']['application-id-instance']['resourceid']",
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ],
          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
          nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea',
          icon: 'fa-check',
          resourceid: null,
          tileid: null,
          parenttileid: null,
          informationboxdata: {
            heading: 'Please Review your cover letter',
            text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over'
          }
        },
        {
          title: 'Excavation Complete',
          name: 'excavation-complete',
          description: 'Choose an option below',
          component: 'views/components/workflows/component-based-step',
          componentname: 'component-based-step',
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'excavation-final-step',
                  uniqueInstanceName: 'excavation-final',
                  tilesManaged: 'none',
                  parameters: {
                    digitalObject: "['upload-documents']['upload-documents-step']",
                    consultationTileid: "['init-name-step']['application-id-instance']['tileid']",
                    consultationResourceid:
                      "['init-name-step']['application-id-instance']['resourceid']",
                    resourceid:
                      "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                  }
                }
              ]
            }
          ],
          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
          nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea',
          icon: 'fa-check',
          resourceid: null,
          tileid: null,
          parenttileid: null,
          informationboxdata: {
            heading: 'Workflow Complete: Review your work',
            text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over'
          }
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: mappedExcavationWorkflow
  });
});
