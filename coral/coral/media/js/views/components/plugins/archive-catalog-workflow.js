define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/consultation-workflow.htm',
  'views/components/workflows/related-document-upload'
], function (ko, arches, EditableWorkflow, licensingWorkflowTemplate) {
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
                        componentName: 'default-card',
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
                        ]
                        }
                      }
                    ]
                  }
                ]
              },
              {
                title: 'Archive Source Details',
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
                          graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                          nodegroupid: '145f9615-9ad2-11ea-b4d3-f875a44e0e11',
                          hiddenNodes: [
                            '145f9619-9ad2-11ea-83ec-f875a44e0e11',
                            '145f961a-9ad2-11ea-948a-f875a44e0e11',
                            '145f9618-9ad2-11ea-925e-f875a44e0e11'
                          ],
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

                        },
                      },
                      {
                        componentName: 'widget-labeller',
                        uniqueInstanceName: 'archive-type',
                        tilesManaged: 'one',
                        parameters: {
                          graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                          nodegroupid: 'c78190bf-1aba-11ec-8bb8-a87eeabdefba',
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",

                        }
                      },
                      {
                        componentName: 'widget-labeller',
                        uniqueInstanceName: 'archive-description',
                        tilesManaged: 'one',
                        parameters: {
                          graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                          nodegroupid: '6a7f6b8b-9ad3-11ea-a265-f875a44e0e11',
                          resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                          hiddenNodes: [
                            '6a7f9283-9ad3-11ea-992b-f875a44e0e11'
                          ]

                        }
                      },
                      {
                        componentName: 'widget-labeller',
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
                        },
                      },
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
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'source-creation',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                      nodegroupid: '3001afdf-b46a-11ea-a528-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                      parenttileid: "['app-details-step']['archive-holding'][0]['tileId']"

                    },
                  },
                  
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
                    componentName: 'widget-labeller',
                    uniqueInstanceName: 'source-location',
                    tilesManaged: 'one',
                    parameters: {
                      graphid: 'b07cfa6f-894d-11ea-82aa-f875a44e0e11',
                      nodegroupid: 'c69aa19d-fe7b-11ea-9e10-f875a44e0e11',
                      resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                      parenttileid: "['app-details-step']['archive-holding'][0]['tileId']"

                    },
                  },
                  
                ]
             }
            ]
          }
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
