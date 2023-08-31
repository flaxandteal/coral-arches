define([
  'knockout',
  'jquery',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/excavation-workflow.htm',
  'views/components/workflows/excavation-workflow/excavation-area-select',
  'views/components/workflows/excavation-workflow/excavation-final-step',
  'views/components/workflows/excavation-workflow/excavation-cover-letter',
  'views/components/workflows/excavation-workflow/asset-reference-card',
  'views/components/workflows/related-document-upload'
], function (ko, $, arches, Workflow, excavationWorkflow) {
  return ko.components.register('excavation-workflow', {
    viewModel: function (params) {
      this.componentName = 'excavation-workflow';

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
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '02d7406a-1e22-4b3b-b908-568b0e157f17',
                    renderContext: 'workflow',
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
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '0d799613-addd-4157-94b9-e58a9d9ff5d6',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'county-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '2002ced7-c098-4a09-b776-7e0f0bd8cda0',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'external-file-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '38e264b2-3608-47d5-8ede-986f6168f893',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'applicant-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '9c98720a-f58e-4d11-9a01-409b20e1386a',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",

                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'excavation-dates' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '50167ecc-4929-4451-bb3f-33666df32021',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'pow-ref' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '8aea7d07-757d-43bb-b5a1-eed4ef40c828',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'asset-reference-card',
                  uniqueInstanceName: 'asset-refs' /* unique to step */,
                  tilesManaged: 'many',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '02d7406a-1e22-4b3b-b908-568b0e157f17',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'site-visits' /* unique to step */,
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                //     nodegroupid: '5371bd8c-978c-4e0c-b43d-4857d1f62049',
                //     resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //   }
                // },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'excavation-status' /* unique to step */,
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                //     nodegroupid: '633fdd74-e4a1-42f5-850d-6bf197bb38a8',
                //     resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                //   }
                // },
              ]
            },
          ]
        },
        {
          title: 'Excavation Location',
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
                  uniqueInstanceName: 'site-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '0726a5fa-dc5e-4914-82d0-7271d22e1f5c',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
          ]
        },
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
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '0d8e3224-fd69-45e2-bb80-221f5b66d46c',
                    renderContext: 'workflow',
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'record-decision' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
                    nodegroupid: '833b14a7-4c78-42fd-a64a-be416a89903b',
                   
                    resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                  }
                },
                // {
                //   componentName: 'default-card',
                //   uniqueInstanceName: 'related-file' /* unique to step */,
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: 'eca88468-73c8-4784-9f22-be8766c13a1d',
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
                     * These can be difficult to work with. Sometimes the `tileId` will be all
                     * lowercase and sometimes it will be camel case. This will vary between workflows.
                     */
                    resourceModelId: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']",
                    resourceTileId: "['init-name-step']['application-id-instance'][0]['tileId']",
                    
                    /**
                     * This needs to refer to the Excavation models 
                     * Digital object node group.
                     */
                    resourceModelDigitalObjectNodeGroupId: '101c32ba-2b49-4aa5-b74e-245b9f696012'
                  }
                },
              ]
            }
          ]
        },
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
                              consultationResourceid: "['init-name-step']['application-id-instance']['resourceid']",
                              resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                          },
                      },
                  ], 
              },
          ],
          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
          nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea',
          icon: 'fa-check',
          resourceid: null,
          tileid: null,
          parenttileid: null,
          informationboxdata: {
              heading: 'Please Review your cover letter',
              text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over',
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
                              consultationResourceid: "['init-name-step']['application-id-instance']['resourceid']",
                              resourceid: "['init-name-step']['application-id-instance'][0]['resourceid']['resourceInstanceId']"
                          },
                      },
                  ], 
              },
          ],
          graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
          nodegroupid: '6a773228-db20-11e9-b6dd-784f435179ea',
          icon: 'fa-check',
          resourceid: null,
          tileid: null,
          parenttileid: null,
          informationboxdata: {
              heading: 'Workflow Complete: Review your work',
              text: 'Please review the summary information. You can go back to a previous step to make changes or "Quit Workflow" to discard your changes and start over',
          }
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: excavationWorkflow
  });
});
